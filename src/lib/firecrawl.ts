import FirecrawlApp, { type SearchResultWeb } from "@mendable/firecrawl-js";

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

// Returnerar null om FIRECRAWL_API_KEY saknas (lokal dev utan nyckel).
function getClient(): FirecrawlApp | null {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  return new FirecrawlApp({ apiKey: key });
}

/**
 * Söker efter relevanta dokument med Firecrawl.
 * Returnerar max `limit` resultat, eller [] vid fel/saknad nyckel.
 */
export async function searchSources(
  query: string,
  limit = 3
): Promise<SearchResult[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const response = await client.search(query, {
      limit,
      scrapeOptions: { formats: ["markdown"] },
    });

    // SearchData returnerar { web, news, images } — vi använder web-resultat
    // Castar till SearchResultWeb[] eftersom web-sökning alltid ger den typen
    const webResults = (response.web ?? []) as SearchResultWeb[];
    if (webResults.length === 0) return [];

    return webResults
      .slice(0, limit)
      .filter((r) => r.url)
      .map((r) => ({
        url: r.url,
        title: r.title ?? r.url,
        description: r.description ?? "",
        markdown: (r.description ?? "").slice(0, 1500),
      }));
  } catch (err) {
    console.error("[Firecrawl] search failed:", err);
    return [];
  }
}

/**
 * Formaterar sökresultat till ett kontextblock för systemprompt-injektion.
 */
export function formatResultsAsContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const blocks = results.map(
    (r, i) =>
      `### Källa ${i + 1}: ${r.title}\nURL: ${r.url}\n\n${r.markdown}`
  );

  return `\n\n---\nAKTUELLA KÄLLDOKUMENT (hämtade i realtid):\n\n${blocks.join("\n\n---\n\n")}\n\nAnvänd dessa källor i ditt svar och citera dem med [Källa: <titel>, <url>].`;
}
