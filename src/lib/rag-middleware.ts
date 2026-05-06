import type { LanguageModelMiddleware } from "ai";
import { searchSources, formatResultsAsContext } from "./firecrawl";
import { embedText } from "./embeddings";
import { supabase, type SearchResult } from "./supabase";
import { withBreaker } from "./circuit-breaker";

const RAG_DEADLINE_MS = 1200

/**
 * Nyckelord som alltid läggs till sökkfrågan för att styra Firecrawl
 * mot konflikt- och barnrelaterat innehåll på betrodda domäner.
 */
const DOMAIN_KEYWORDS = "children armed conflict";

/**
 * Svenska termer → engelska för bättre träff på engelskspråkiga källor.
 */
const QUERY_TRANSLATIONS: [RegExp, string][] = [
  [/barnsoldater?/i, "child soldiers"],
  [/vapenhandel|vapenexport/i, "arms trade weapons export"],
  [/sexuellt v[åa]ld|v[åa]ldtäkt/i, "sexual violence conflict"],
  [/utbildning/i, "education conflict"],
  [/trauma|psykisk/i, "trauma mental health children conflict"],
  [/d[öo]dsfall|d[öo]das|d[öo]dade/i, "killed casualties"],
  [/flykt|fördrivna|fördrivning/i, "displaced refugees"],
  [/svält|hunger|undernär/i, "malnutrition famine"],
  [/sjukhus|hälsov[åa]rd|medicin/i, "healthcare hospitals attack"],
  [/Jemen|Yemen/i, "Yemen conflict"],
  [/Gaza|Palestina/i, "Gaza Palestine conflict"],
  [/Ukraina/i, "Ukraine war"],
  [/Sudan/i, "Sudan conflict"],
  [/Syrien/i, "Syria conflict"],
  [/Kongo/i, "DRC Congo conflict"],
  [/Myanmar|Burma/i, "Myanmar conflict"],
  [/Etiopien|Tigray/i, "Ethiopia Tigray conflict"],
  [/Somalia/i, "Somalia conflict"],
  [/Sahel|Mali|Burkina/i, "Sahel Mali Burkina Faso conflict"],
  [/Libanon/i, "Lebanon conflict"],
  [/Iran/i, "Iran Israel conflict Middle East"],
  [/Houthi|Houthierna/i, "Houthi Yemen Red Sea"],
  [/Hizballah|Hizbollah/i, "Hezbollah Lebanon conflict"],
];

function buildSearchQuery(messages: unknown[]): string {
  const lastUserMsg = [...(messages as Array<{ role: string; content: unknown }>)]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMsg) return "";

  let text = "";
  if (typeof lastUserMsg.content === "string") {
    text = lastUserMsg.content;
  } else if (Array.isArray(lastUserMsg.content)) {
    const textPart = (lastUserMsg.content as Array<{ type: string; text?: string }>).find(
      (p) => p.type === "text"
    );
    text = textPart?.text ?? "";
  }

  if (!text.trim()) return "";

  let query = text;
  for (const [pattern, replacement] of QUERY_TRANSLATIONS) {
    query = query.replace(pattern, replacement);
  }

  return `${query.slice(0, 80).trim()} ${DOMAIN_KEYWORDS}`;
}

/**
 * Söker i Supabase pgvector efter relevanta chunks.
 * Returnerar [] om OPENAI_API_KEY saknas eller databasen är tom.
 */
async function vectorSearch(query: string, limit = 4): Promise<SearchResult[]> {
  if (!process.env.OPENAI_API_KEY) return [];

  const embedding = await embedText(query);

  const { data, error } = await supabase.rpc("search_chunks", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error || !data?.length) return [];
  return data as SearchResult[];
}

/**
 * Formaterar vektorträffar till ett kontextblock för systemprompt-injektion.
 */
function formatVectorResults(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const blocks = results.map(
    (r, i) =>
      `### Källa ${i + 1}: ${r.title} (${r.source_name})\nURL: ${r.url}\nRelevans: ${Math.round(r.similarity * 100)}%\n\n${r.content}`
  );

  return `\n\n---\nINDEXERADE KÄLLDOKUMENT (hämtade ur vektordatabas):\n\n${blocks.join("\n\n---\n\n")}\n\nAnvänd dessa källor i ditt svar och citera dem med [Källa: <titel>, <url>].`;
}

/** Export for logging in the API route */
export type RagSource = "pgvector" | "firecrawl" | "none"

/**
 * Runs the full two-step RAG pipeline (pgvector → Firecrawl fallback).
 * Both steps are wrapped with circuit breakers.
 * Returns the context string and which source won.
 */
async function runRagPipeline(
  query: string,
): Promise<{ context: string; source: RagSource }> {
  // Steg 1: pgvector med circuit breaker
  const vectorResults = await withBreaker(
    "pgvector",
    () => vectorSearch(query, 4),
    [] as SearchResult[],
  )

  let context = formatVectorResults(vectorResults)
  let source: RagSource = vectorResults.length >= 2 ? "pgvector" : "none"

  // Steg 2: Firecrawl fallback om < 2 vektorträffar
  if (vectorResults.length < 2) {
    const firecrawlResults = await withBreaker(
      "firecrawl",
      () => searchSources(query, 3),
      [],
    )
    const firecrawlContext = formatResultsAsContext(firecrawlResults)
    context = context + firecrawlContext
    if (firecrawlResults.length > 0) source = "firecrawl"
  }

  return { context, source }
}

/**
 * AI SDK Language Model Middleware — injicerar relevant källkontext
 * i systemprompten innan varje Claude-anrop.
 *
 * Sökstrategi i två steg:
 *   1. pgvector (Supabase) — snabb, offline-indexerad, hög precision
 *   2. Firecrawl live-sökning — fallback om < 2 vektorträffar (eller tom DB)
 *
 * Hela pipeline:n körs mot ett 1200 ms tak — om timeout vinner streamas
 * Claude med enbart basprompt (inga externa källor injiceras).
 */
export const ragMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const query = buildSearchQuery(params.prompt);
    if (!query) return params;

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), RAG_DEADLINE_MS))

    const ragResult = await Promise.race([runRagPipeline(query), timeout])

    // Timeout won — stream with base prompt only
    if (ragResult === null || !ragResult.context) return params

    const { context } = ragResult

    // Injicera i befintligt system-meddelande (eller skapa nytt)
    const existingSystemIdx = params.prompt.findIndex((m) => m.role === "system");
    const updatedPrompt = [...params.prompt];

    if (existingSystemIdx >= 0) {
      const existing = updatedPrompt[existingSystemIdx] as { role: "system"; content: string };
      updatedPrompt[existingSystemIdx] = {
        ...existing,
        content: existing.content + context,
      };
    } else {
      updatedPrompt.unshift({ role: "system", content: context });
    }

    return { ...params, prompt: updatedPrompt };
  },
};
