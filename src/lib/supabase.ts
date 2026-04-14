import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY måste vara satta");
}

/** Service-role-klient — används enbart server-side (API routes, ingestion) */
export const supabase = createClient(url, key);

// Typade tabellrader
export interface DocumentRow {
  id: string;
  url: string;
  title: string;
  source_name: string;
  domain: string;
  scraped_at: string;
  metadata: Record<string, unknown>;
}

export interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  token_count: number | null;
  created_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  document_id: string;
  url: string;
  title: string;
  source_name: string;
  similarity: number;
}
