const CHUNK_SIZE = 800;       // tecken per chunk (≈ 200 tokens)
const CHUNK_OVERLAP = 120;    // tecken overlap mellan chunks

/**
 * Delar upp en lång text i överlappande chunks.
 * Försöker dela på styckesbrytningar (\n\n) för att hålla meningar hela.
 * Delas av ingestion.ts (enskild URL) och krigets/firecrawl.ts (crawl-jobb).
 */
export function chunkText(text: string): string[] {
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

/**
 * Rensar scrapad markdown från navigation och länkmarkup innan chunkning.
 * Behåller länktexten men tar bort URL:er, bilder, "Skip to main content"
 * och korta menyrader (list-poster under 30 tecken). Rubriker och brödtext
 * lämnas orörda.
 */
export function cleanMarkdown(markdown: string): string {
  const stripped = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // bilder
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // [text](url) -> text
    .replace(/Skip to main content/gi, "");

  return stripped
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t === "") return true;
      return !(/^[-*]\s/.test(t) && t.length < 30); // menyrader
    })
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
