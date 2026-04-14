import FirecrawlApp, { type SearchResultWeb } from "@mendable/firecrawl-js";
import { PRIMARY_DOMAINS, TRUSTED_DOMAINS, getDomainName } from "@/config/sources";

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
  sourceName: string;
}

// Returnerar null om FIRECRAWL_API_KEY saknas (lokal dev utan nyckel).
function getClient(): FirecrawlApp | null {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  return new FirecrawlApp({ apiKey: key });
}

/**
 * Söker efter relevanta dokument med Firecrawl, begränsat till betrodda domäner.
 *
 * Strategi med fallback i två steg:
 *   1. Söker prio-1-domäner (UNICEF, SIPRI, ICRC, HRW, ReliefWeb, OHCHR, Save the Children)
 *   2. Om < 2 träffar — utvidgar till alla betrodda domäner
 *
 * Returnerar max `limit` resultat, eller [] vid fel/saknad nyckel.
 */
export async function searchSources(
  query: string,
  limit = 3
): Promise<SearchResult[]> {
  const client = getClient();
  if (!client) return [];

  const runSearch = async (domains: string[]): Promise<SearchResult[]> => {
    // includeDomains is a valid Firecrawl API param but missing from SDK types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.search(query, {
      limit,
      includeDomains: domains,
      scrapeOptions: { formats: ["markdown"] },
    } as any);

    const webResults = (response.web ?? []) as SearchResultWeb[];
    return webResults
      .filter((r) => r.url)
      .slice(0, limit)
      .map((r) => {
        const domain = new URL(r.url).hostname.replace("www.", "");
        return {
          url: r.url,
          title: r.title ?? r.url,
          description: r.description ?? "",
          markdown: (r.description ?? "").slice(0, 1500),
          sourceName: getDomainName(domain),
        };
      });
  };

  try {
    // Steg 1: prio-1-domäner
    const primary = await runSearch(PRIMARY_DOMAINS);
    if (primary.length >= 2) return primary;

    // Steg 2: fallback till alla betrodda domäner
    console.log("[Firecrawl] fallback till alla betrodda domäner");
    return await runSearch(TRUSTED_DOMAINS);
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
