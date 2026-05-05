/**
 * Hantering av documents och document_chunks.
 * Inkluderar pgvector-sökning via search_chunks RPC.
 */

import { supabase, getServiceClient, unwrap } from "./supabase"
import type { Document, DocumentChunk, DocType, Json } from "./database.types"

export interface ChunkSearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  source_name: string
  title: string
  url: string
}

// =============================================================================
// Sökning (server-side)
// =============================================================================

/**
 * Vektor-similarity-sök i document_chunks. Förutsätter att RPC `search_chunks`
 * finns i Supabase (verifierat 2026-05-04).
 *
 * `queryEmbedding` ska vara en JSON-stringifierad float-array, t.ex.:
 *   JSON.stringify(await openai.embeddings.create({...}).then(r => r.data[0].embedding))
 */
export async function searchChunks(args: {
  queryEmbedding: string
  matchThreshold?: number
  matchCount?: number
}): Promise<ChunkSearchResult[]> {
  const { queryEmbedding, matchThreshold = 0.7, matchCount = 10 } = args

  return unwrap(
    await supabase.rpc("search_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    }),
    "searchChunks",
  ) as ChunkSearchResult[]
}

/** Hämta dokument filtrerat på domain, doc_type eller topics. */
export async function listDocuments(
  filter: {
    domain?: string
    docType?: DocType
    topic?: string
    publishedSince?: string // ISO-datum
    limit?: number
  } = {},
): Promise<Document[]> {
  let query = supabase.from("documents").select("*").order("scraped_at", { ascending: false })

  if (filter.domain) query = query.eq("domain", filter.domain)
  if (filter.docType) query = query.eq("doc_type", filter.docType)
  if (filter.topic) query = query.contains("topics", [filter.topic])
  if (filter.publishedSince) query = query.gte("published_date", filter.publishedSince)

  query = query.limit(filter.limit ?? 50)

  return unwrap(await query, "listDocuments")
}

// =============================================================================
// Skrivning (server-side endast)
// =============================================================================

export interface UpsertDocumentInput {
  url: string
  title: string
  sourceName: string
  domain: string
  publishedDate?: string | null
  docType?: DocType
  topics?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Upsert ett dokument på unique-constraint (url) och returnera ID:t.
 * Idempotent — kan köras om utan att skapa dubbletter.
 */
export async function upsertDocument(input: UpsertDocumentInput): Promise<Document> {
  const client = getServiceClient()
  return unwrap(
    await client
      .from("documents")
      .upsert(
        {
          url: input.url,
          title: input.title,
          source_name: input.sourceName,
          domain: input.domain,
          published_date: input.publishedDate ?? null,
          doc_type: input.docType ?? null,
          topics: input.topics ?? [],
          metadata: (input.metadata ?? {}) as unknown as Json,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "url" },
      )
      .select()
      .single(),
    `upsertDocument(${input.url})`,
  )
}

export interface ChunkInput {
  content: string
  chunkIndex: number
  embedding?: string // pgvector format: '[0.1,0.2,...]'
  tokenCount?: number
}

/**
 * Bulk-insert chunks för ett dokument. Tar bort befintliga chunks för
 * dokumentet först (idempotent rebuild).
 */
export async function replaceDocumentChunks(
  documentId: string,
  chunks: ChunkInput[],
): Promise<DocumentChunk[]> {
  const client = getServiceClient()

  const { error: deleteError } = await client
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId)
  if (deleteError) throw new Error(`replaceDocumentChunks(delete): ${deleteError.message}`)

  if (chunks.length === 0) return []

  const rows = chunks.map((c) => ({
    document_id: documentId,
    chunk_index: c.chunkIndex,
    content: c.content,
    embedding: c.embedding ?? null,
    token_count: c.tokenCount ?? null,
  }))

  return unwrap(
    await client.from("document_chunks").insert(rows).select(),
    `replaceDocumentChunks(insert ${chunks.length})`,
  )
}

/** Räkna chunks per domain — användbar för diagnostik. */
export async function getDocumentChunkStats(): Promise<
  Array<{ domain: string; docs: number; chunks: number }>
> {
  const docs = unwrap(
    await supabase.from("documents").select("id, domain"),
    "getDocumentChunkStats(docs)",
  )
  const chunks = unwrap(
    await supabase.from("document_chunks").select("document_id"),
    "getDocumentChunkStats(chunks)",
  )

  const chunkCount = new Map<string, number>()
  for (const c of chunks) {
    chunkCount.set(c.document_id, (chunkCount.get(c.document_id) ?? 0) + 1)
  }

  const byDomain = new Map<string, { docs: number; chunks: number }>()
  for (const d of docs) {
    const existing = byDomain.get(d.domain) ?? { docs: 0, chunks: 0 }
    existing.docs += 1
    existing.chunks += chunkCount.get(d.id) ?? 0
    byDomain.set(d.domain, existing)
  }

  return Array.from(byDomain.entries())
    .map(([domain, v]) => ({ domain, ...v }))
    .sort((a, b) => b.chunks - a.chunks)
}
