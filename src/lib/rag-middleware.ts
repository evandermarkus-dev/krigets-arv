import type { LanguageModelMiddleware } from "ai";
import { searchSources, formatResultsAsContext } from "./firecrawl";
import { embedText } from "./embeddings";
import { supabase, type SearchResult } from "./supabase";

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

  try {
    const embedding = await embedText(query);

    const { data, error } = await supabase.rpc("search_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error || !data?.length) return [];
    return data as SearchResult[];
  } catch {
    return [];
  }
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

/**
 * AI SDK Language Model Middleware — injicerar relevant källkontext
 * i systemprompten innan varje Claude-anrop.
 *
 * Sökstrategi i två steg:
 *   1. pgvector (Supabase) — snabb, offline-indexerad, hög precision
 *   2. Firecrawl live-sökning — fallback om < 2 vektorträffar (eller tom DB)
 */
export const ragMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const query = buildSearchQuery(params.prompt);
    if (!query) return params;

    // Steg 1: pgvector
    const vectorResults = await Promise.race([
      vectorSearch(query, 4),
      new Promise<[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);

    let context = formatVectorResults(vectorResults);

    // Steg 2: Firecrawl fallback om < 2 vektorträffar
    if (vectorResults.length < 2) {
      const firecrawlResults = await Promise.race([
        searchSources(query, 3),
        new Promise<[]>((resolve) => setTimeout(() => resolve([]), 4000)),
      ]);
      const firecrawlContext = formatResultsAsContext(firecrawlResults);
      context = context + firecrawlContext;
    }

    if (!context) return params;

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
