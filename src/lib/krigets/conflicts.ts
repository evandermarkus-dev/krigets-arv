/**
 * Typed query-helpers för konflikter, stats och dokumentkopplingar.
 *
 * Alla funktioner returnerar ren data eller kastar SupabaseQueryError —
 * inga manuella `.error`-checks i anropande kod.
 */

import { supabase, getServiceClient, unwrap } from "./supabase"
import type {
  ConflictMeta,
  ConflictStat,
  ConflictDocument,
  Document,
  Locale,
  TaggedBy,
} from "./database.types"

// =============================================================================
// Läsning (server-side, RLS gäller om policies är satta)
// =============================================================================

/** Hämta alla aktiva konflikter sorterade efter allvar och namn. */
export async function listActiveConflicts(): Promise<ConflictMeta[]> {
  return unwrap(
    await supabase
      .from("conflict_meta")
      .select("*")
      .eq("active", true)
      .order("severity", { ascending: true })
      .order("name_sv", { ascending: true }),
    "listActiveConflicts",
  )
}

/** Hämta en konflikt med tillhörande stats per locale. */
export async function getConflictWithStats(
  conflictId: string,
  locale: Locale,
): Promise<{ meta: ConflictMeta; stats: ConflictStat | null }> {
  // Explicit generic behövs — TypeScript infererar annars T = ConflictMeta | null
  const meta = unwrap<ConflictMeta>(
    await supabase.from("conflict_meta").select("*").eq("id", conflictId).single(),
    `getConflictWithStats(meta:${conflictId})`,
  )

  const statsResult = await supabase
    .from("conflict_stats")
    .select("*")
    .eq("conflict_id", conflictId)
    .eq("locale", locale)
    .maybeSingle()

  if (statsResult.error) {
    throw new Error(`getConflictWithStats(stats): ${statsResult.error.message}`)
  }

  return { meta, stats: statsResult.data }
}

/** Hämta dokument kopplade till en konflikt, sorterade på relevans. */
export async function getDocumentsForConflict(
  conflictId: string,
  options: { minRelevance?: number; limit?: number } = {},
): Promise<Array<Document & { relevance_score: number; tagged_by: string }>> {
  const { minRelevance = 0.3, limit = 50 } = options

  // Steg 1: hämta kopplingar (undviker komplex join-typinferens)
  const links = unwrap(
    await supabase
      .from("conflict_documents")
      .select("document_id, relevance_score, tagged_by")
      .eq("conflict_id", conflictId)
      .gte("relevance_score", minRelevance)
      .order("relevance_score", { ascending: false })
      .limit(limit),
    `getDocumentsForConflict(links:${conflictId})`,
  )

  if (links.length === 0) return []

  // Steg 2: hämta dokumenten
  const docIds = links.map((l) => l.document_id)
  const docs = unwrap(
    await supabase.from("documents").select("*").in("id", docIds),
    `getDocumentsForConflict(docs:${conflictId})`,
  )

  const docMap = new Map(docs.map((d) => [d.id, d]))

  return links
    .filter((l) => docMap.has(l.document_id))
    .map((l) => ({
      ...(docMap.get(l.document_id) as Document),
      relevance_score: l.relevance_score,
      tagged_by: l.tagged_by,
    }))
}

/** Hämta konflikter som saknar dokumentkopplingar. */
export async function listConflictsWithoutDocuments(): Promise<ConflictMeta[]> {
  const [conflicts, links] = await Promise.all([
    listActiveConflicts(),
    unwrap(
      await supabase.from("conflict_documents").select("conflict_id"),
      "listConflictsWithoutDocuments(links)",
    ),
  ])

  const linkedIds = new Set(links.map((l) => l.conflict_id))
  return conflicts.filter((c) => !linkedIds.has(c.id))
}

// =============================================================================
// Skrivning (kräver service role — server-side endast)
// =============================================================================

/** Tagga ett dokument som relevant för en konflikt. */
export async function linkDocumentToConflict(args: {
  conflictId: string
  documentId: string
  relevanceScore?: number
  taggedBy?: TaggedBy
}): Promise<ConflictDocument> {
  const client = getServiceClient()
  return unwrap(
    await client
      .from("conflict_documents")
      .upsert(
        {
          conflict_id: args.conflictId,
          document_id: args.documentId,
          relevance_score: args.relevanceScore ?? 1.0,
          tagged_by: args.taggedBy ?? "manual",
        },
        { onConflict: "conflict_id,document_id" },
      )
      .select()
      .single(),
    `linkDocumentToConflict(${args.conflictId} -> ${args.documentId})`,
  )
}

/** Ta bort en dokumentkoppling (raderar inte själva dokumentet). */
export async function unlinkDocumentFromConflict(args: {
  conflictId: string
  documentId: string
}): Promise<void> {
  const client = getServiceClient()
  const { error } = await client
    .from("conflict_documents")
    .delete()
    .eq("conflict_id", args.conflictId)
    .eq("document_id", args.documentId)
  if (error) throw new Error(`unlinkDocumentFromConflict: ${error.message}`)
}

/** Uppdatera stats för en konflikt + locale (upsert). */
export async function upsertConflictStats(stats: {
  conflictId: string
  locale: Locale
  description?: string | null
  arms?: string | null
  sources?: string[]
  stats?: unknown
}): Promise<ConflictStat> {
  const client = getServiceClient()
  return unwrap(
    await client
      .from("conflict_stats")
      .upsert(
        {
          conflict_id: stats.conflictId,
          locale: stats.locale,
          description: stats.description ?? null,
          arms: stats.arms ?? null,
          sources: stats.sources ?? [],
          stats: (stats.stats as never) ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conflict_id,locale" },
      )
      .select()
      .single(),
    `upsertConflictStats(${stats.conflictId}:${stats.locale})`,
  )
}
