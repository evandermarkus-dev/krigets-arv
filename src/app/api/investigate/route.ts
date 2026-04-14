import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropicProvider = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { investigateRatelimit } from "@/lib/ratelimit";
import { ragMiddleware } from "@/lib/rag-middleware";
import { getInvestigateSystemPrompt } from "@/config/prompts";

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

    const systemPrompt = getInvestigateSystemPrompt(mode, locale);
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: mode === "compact" ? 300 : 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Investigate API error:", error);
    return NextResponse.json({ error: "Något gick fel. Försök igen." }, { status: 500 });
  }
}
