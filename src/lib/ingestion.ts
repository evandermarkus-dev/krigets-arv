import { supabase } from "./supabase";
import { embedBatch } from "./embeddings";
import { getDomainName } from "@/config/sources";
import FirecrawlApp from "@mendable/firecrawl-js";

const CHUNK_SIZE = 800;       // tecken per chunk (≈ 200 tokens)
const CHUNK_OVERLAP = 120;    // tecken overlap mellan chunks

function getFirecrawl(): FirecrawlApp | null {
  const key = process.env.FIRECRAWL_API_KEY;
  return key ? new FirecrawlApp({ apiKey: key }) : null;
}

/**
 * Delar upp en lång text i överlappande chunks.
 * Försöker dela på styckesbrytningar (\n\n) för att hålla meningar hela.
 */
function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      // Overlap: börja nästa chunk med slutet av föregående
      const words = current.split(" ");
      current = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(" ") + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks;
}

export interface IngestResult {
  url: string;
  title: string;
  chunksStored: number;
  skipped: boolean;
  error?: string;
}

/**
 * Indexerar en URL i tre steg:
 * 1. Scrapar innehållet med Firecrawl (markdown-format)
 * 2. Chunkar och embeddar texten med OpenAI text-embedding-3-small
 * 3. Sparar dokument + chunks i Supabase pgvector
 *
 * Hoppar över URL:er som redan finns i databasen (idempotent).
 */
export async function ingestUrl(url: string): Promise<IngestResult> {
  // Kontrollera om URL:en redan är indexerad
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("url", url)
    .maybeSingle();

  if (existing) {
    return { url, title: "", chunksStored: 0, skipped: true };
  }

  const firecrawl = getFirecrawl();
  if (!firecrawl) {
    return { url, title: "", chunksStored: 0, skipped: false, error: "FIRECRAWL_API_KEY saknas" };
  }

  // Steg 1: Scrapa URL
  let markdown = "";
  let title = url;
  try {
    const result = await firecrawl.scrape(url, { formats: ["markdown"] });
    markdown = (result as { markdown?: string; metadata?: { title?: string } }).markdown ?? "";
    title = (result as { markdown?: string; metadata?: { title?: string } }).metadata?.title ?? url;
  } catch (err) {
    return { url, title, chunksStored: 0, skipped: false, error: `Firecrawl fel: ${err}` };
  }

  if (!markdown || markdown.length < 100) {
    return { url, title, chunksStored: 0, skipped: false, error: "För lite innehåll att indexera" };
  }

  // Steg 2: Chunk + embed
  const chunks = chunkText(markdown);
  if (chunks.length === 0) {
    return { url, title, chunksStored: 0, skipped: false, error: "Inga chunks genererades" };
  }

  let embeddings: number[][];
  try {
    embeddings = await embedBatch(chunks);
  } catch (err) {
    return { url, title, chunksStored: 0, skipped: false, error: `Embedding fel: ${err}` };
  }

  // Steg 3: Spara i Supabase
  const domain = new URL(url).hostname.replace("www.", "");

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ url, title, source_name: getDomainName(domain), domain })
    .select("id")
    .single();

  if (docError || !doc) {
    return { url, title, chunksStored: 0, skipped: false, error: `DB-fel: ${docError?.message}` };
  }

  const rows = chunks.map((content, i) => ({
    document_id: doc.id,
    content,
    embedding: embeddings[i],
    chunk_index: i,
    token_count: Math.round(content.length / 4),
  }));

  const { error: chunkError } = await supabase.from("document_chunks").insert(rows);
  if (chunkError) {
    return { url, title, chunksStored: 0, skipped: false, error: `Chunk-fel: ${chunkError.message}` };
  }

  return { url, title, chunksStored: chunks.length, skipped: false };
}

/**
 * Indexerar en lista URL:er sekventiellt med 500ms fördröjning
 * mellan varje för att inte överbelasta Firecrawl och OpenAI.
 */
export async function ingestUrls(urls: string[]): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const url of urls) {
    const result = await ingestUrl(url);
    results.push(result);
    console.log(`[Ingestion] ${result.skipped ? "SKIP" : result.error ? "ERR" : "OK"} ${url} — ${result.chunksStored} chunks`);
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
