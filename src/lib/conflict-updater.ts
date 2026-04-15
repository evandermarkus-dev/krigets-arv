import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { supabase } from "./supabase";
import { embedText } from "./embeddings";
import { searchSources } from "./firecrawl";
import type { SearchResult } from "./supabase";

const anthropicProvider = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });

export interface ConflictUpdateResult {
  conflictId: string;
  locale: string;
  success: boolean;
  description?: string;
  stats?: { label: string; value: string }[];
  arms?: string;
  sources?: string[];
  error?: string;
}

/**
 * Söker i pgvector efter relevanta chunks för en given konflikt.
 */
async function searchForConflict(
  query: string,
  limit = 6
): Promise<SearchResult[]> {
  if (!process.env.OPENAI_API_KEY) return [];
  try {
    const embedding = await embedText(query);
    const { data, error } = await supabase.rpc("search_chunks", {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: limit,
    });
    if (error || !data?.length) return [];
    return data as SearchResult[];
  } catch {
    return [];
  }
}

/**
 * Extraherar strukturerad konfliktdata med Claude.
 * Ber Claude svara med ren JSON — ingen omgivande text.
 */
async function extractWithClaude(
  conflictName: string,
  locale: string,
  context: string
): Promise<{ description: string; stats: { label: string; value: string }[]; arms: string; sources: string[] } | null> {
  const isSv = locale === "sv";

  const systemPrompt = isSv
    ? `Du är ett precisionsinstrument för dataextraktion om barn i väpnade konflikter.
Svara ENBART med valid JSON. Ingen inledningstext, inga förklaringar, inga markdown-kodblock.
JSON-schemat du ska följa:
{
  "description": "En mening (max 20 ord) om konfliktens aktuella påverkan på barn",
  "stats": [
    { "label": "Kortfattad etikett", "value": "Siffra + enhet" },
    { "label": "...", "value": "..." },
    { "label": "...", "value": "..." }
  ],
  "arms": "En mening om vapenleverantörer eller vapenhandel kopplat till konflikten",
  "sources": ["Organisation 1", "Organisation 2"]
}
Regler: stats-arrayen ska ha exakt 3 objekt. Använd siffror från källtexten. Om källtexten saknar data för ett fält, skriv "okänt".`
    : `You are a precision data extraction tool for children in armed conflicts.
Respond ONLY with valid JSON. No preamble, no explanations, no markdown code blocks.
JSON schema to follow:
{
  "description": "One sentence (max 20 words) about the conflict's current impact on children",
  "stats": [
    { "label": "Short label", "value": "Number + unit" },
    { "label": "...", "value": "..." },
    { "label": "...", "value": "..." }
  ],
  "arms": "One sentence about arms suppliers or weapons trade linked to this conflict",
  "sources": ["Organization 1", "Organization 2"]
}
Rules: stats array must have exactly 3 items. Use numbers from the source text. If source lacks data for a field, write "unknown".`;

  const userPrompt = isSv
    ? `Extrahera aktuell information om konflikten i ${conflictName} utifrån följande källtext:\n\n${context}`
    : `Extract current information about the conflict in ${conflictName} from the following source text:\n\n${context}`;

  try {
    const { text } = await generateText({
      model: anthropicProvider("claude-sonnet-4-6"),
      maxOutputTokens: 512,
      system: systemPrompt,
      prompt: userPrompt,
    });

    // Strip markdown code fences if Claude wraps the response despite instructions
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(clean);
  } catch (err) {
    console.error("[extractWithClaude] fel:", err);
    return null;
  }
}

/**
 * Uppdaterar en konflikt i Supabase med färsk data från pgvector + Firecrawl + Claude.
 */
export async function updateConflict(
  conflictId: string,
  conflictName: string,
  locale: string
): Promise<ConflictUpdateResult> {
  // Bygg sökfrågor — engelska ger bäst träff i källorna
  const ID_TO_EN: Record<string, string> = {
    jemen: "Yemen",
    ukraina: "Ukraine",
    sydsudan: "South Sudan",
    syrien: "Syria",
    etiopien: "Ethiopia",
    drc: "DR Congo",
    libanon: "Lebanon",
    sahel: "Sahel Mali Burkina Faso",
  };
  const enName = ID_TO_EN[conflictId] ?? conflictName;

  const queries = [
    `${enName} children casualties 2025`,
    `${enName} child soldiers displaced humanitarian`,
    `${enName} arms weapons conflict`,
  ];

  // Steg 1: Sök pgvector
  const vectorResults: SearchResult[] = [];
  for (const q of queries) {
    const hits = await searchForConflict(q, 3);
    vectorResults.push(...hits);
  }

  // Steg 2: Firecrawl fallback om < 3 chunks
  let contextChunks: string[] = vectorResults.map((r) => `[${r.source_name}]\n${r.content}`);

  if (vectorResults.length < 3) {
    const live = await searchSources(`${enName} children conflict 2025`, 2);
    contextChunks = [
      ...contextChunks,
      ...live.map((r) => `[${r.sourceName}]\n${r.markdown}`),
    ];
  }

  if (contextChunks.length === 0) {
    return { conflictId, locale, success: false, error: "Inga källchunks hittades" };
  }

  const context = contextChunks.slice(0, 8).join("\n\n---\n\n");

  // Steg 3: Extrahera med Claude
  const extracted = await extractWithClaude(conflictName, locale, context);
  if (!extracted) {
    return { conflictId, locale, success: false, error: "Claude-extraktion misslyckades" };
  }

  // Steg 4: Upsert till Supabase
  const { error } = await supabase.from("conflict_stats").upsert({
    conflict_id: conflictId,
    locale,
    description: extracted.description,
    stats: extracted.stats,
    arms: extracted.arms,
    sources: extracted.sources,
    updated_at: new Date().toISOString(),
  }, { onConflict: "conflict_id,locale" });

  if (error) {
    return { conflictId, locale, success: false, error: `Supabase-fel: ${error.message}` };
  }

  return {
    conflictId,
    locale,
    success: true,
    description: extracted.description,
    stats: extracted.stats,
    arms: extracted.arms,
    sources: extracted.sources,
  };
}
