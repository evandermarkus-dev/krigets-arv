import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropicProvider = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { investigateRatelimit } from "@/lib/ratelimit";
import { ragMiddleware } from "@/lib/rag-middleware";
import { getInvestigateSystemPrompt } from "@/config/prompts";
import { supabase } from "@/lib/supabase";

async function getLiveConflictContext(locale: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("conflict_stats")
      .select("conflict_id, description, stats, arms, sources")
      .eq("locale", locale);

    if (!data?.length) return "";

    const lines = data.map((row) => {
      const statsStr = Array.isArray(row.stats)
        ? (row.stats as { label: string; value: string }[]).map((s) => `${s.label}: ${s.value}`).join(", ")
        : "";
      const sourcesStr = Array.isArray(row.sources) ? (row.sources as string[]).join(", ") : "";
      return `- ${row.conflict_id}: ${row.description} | ${statsStr} | Vapen: ${row.arms} | Källor: ${sourcesStr}`;
    });

    const header = locale === "sv"
      ? "=== AKTUELL STATISTIK FÖR AKTIVA KONFLIKTER (hämtad från databas) ==="
      : "=== CURRENT STATISTICS FOR ACTIVE CONFLICTS (fetched from database) ===";

    return `\n\n${header}\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

// Wrappa modellen med RAG-middleware — injicerar live-sökresultat i varje anrop
const model = wrapLanguageModel({
  model: anthropicProvider("claude-sonnet-4-6"),
  middleware: ragMiddleware,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (investigateRatelimit) {
    const { success } = await investigateRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
  }

  try {
    const { messages, mode, locale } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Meddelanden saknas" }, { status: 400 });

    const [systemPrompt, liveContext] = await Promise.all([
      Promise.resolve(getInvestigateSystemPrompt(mode, locale)),
      getLiveConflictContext(locale),
    ]);
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      system: systemPrompt + liveContext,
      messages: modelMessages,
      maxOutputTokens: mode === "compact" ? 300 : 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Investigate API error:", error);
    return NextResponse.json({ error: "Något gick fel. Försök igen." }, { status: 500 });
  }
}
