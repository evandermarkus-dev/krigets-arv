/** Service-role client — re-exported from the typed krigets/ library. */
export { supabase } from "./krigets/supabase";

/**
 * pgvector columns are typed as `string` in the generated Supabase types,
 * but PostgREST accepts a JSON number array — which is what we send. This
 * cast only satisfies the type checker; the request payload is unchanged.
 */
export function toVector(embedding: number[]): string {
  return embedding as unknown as string;
}

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
