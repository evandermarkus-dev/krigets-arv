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
