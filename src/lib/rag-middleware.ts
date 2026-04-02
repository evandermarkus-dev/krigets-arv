import type { LanguageModelMiddleware } from "ai";
import { searchSources, formatResultsAsContext } from "./firecrawl";

/**
 * Extraherar en sökkfråga ur meddelandena.
 *
 * TODO: Implementera din strategi här (5-10 rader).
 *
 * Parametrar:
 *   messages — hela konversationshistoriken (ModelMessage[])
 *
 * Returnera:
 *   En sträng att söka efter, t.ex. "UNICEF barnsoldater Sydsudan 2024"
 *   Returnera "" för att skippa sökning.
 *
 * Tips att tänka på:
 * - Det senaste user-meddelandet är bäst att utgå från
 * - Lägg till ämnesrelaterade nyckelord (konflikter, barn, vapen...) för bättre precision
 * - Håll frågan under ~8 ord — för lång fråga ger sämre träff
 * - Du kan kombinera sista frågan med kontext från tidigare meddelanden
 */
function buildSearchQuery(messages: unknown[]): string {
  // Hitta det senaste user-meddelandet
  const lastUserMsg = [...(messages as Array<{ role: string; content: unknown }>)]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMsg) return "";

  // Extrahera text ur content (kan vara string eller array av parts)
  let text = "";
  if (typeof lastUserMsg.content === "string") {
    text = lastUserMsg.content;
  } else if (Array.isArray(lastUserMsg.content)) {
    const textPart = (lastUserMsg.content as Array<{ type: string; text?: string }>).find(
      (p) => p.type === "text"
    );
    text = textPart?.text ?? "";
  }

  // Returnera texten direkt — max 120 tecken för att hålla sökkfrågan fokuserad
  return text.slice(0, 120).trim();
}

/**
 * AI SDK Language Model Middleware som injicerar Firecrawl-sökresultat
 * i systemprompten innan varje anrop till Claude.
 *
 * Appliceras via wrapLanguageModel() i API-routen.
 */
export const ragMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const query = buildSearchQuery(params.prompt);
    if (!query) return params;

    // Hämta sökresultat parallellt med liten timeout-skydd
    const results = await Promise.race([
      searchSources(query, 3),
      new Promise<[]>((resolve) => setTimeout(() => resolve([]), 4000)),
    ]);

    const context = formatResultsAsContext(results);
    if (!context) return params;

    // Hitta och uppdatera befintligt system-meddelande i prompt-arrayen,
    // eller lägg till ett nytt om det saknas
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
