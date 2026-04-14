import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropic = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { perspectivesRatelimit } from "@/lib/ratelimit";
import { MONOLOGUE_TRIGGERS } from "@/config/prompts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (perspectivesRatelimit) {
    const { success } = await perspectivesRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
  }

  try {
    const { messages, systemPrompt, locale } = await req.json();

    const monologueTrigger = MONOLOGUE_TRIGGERS[locale] ?? MONOLOGUE_TRIGGERS.sv;

    // Replace START_MONOLOGUE trigger with actual prompt in last message
    const processedMessages = messages.map((m: { role: string; content: unknown }, i: number) =>
      i === messages.length - 1 && m.content === "START_MONOLOGUE"
        ? { ...m, content: monologueTrigger }
        : m
    );

    const modelMessages = await convertToModelMessages(processedMessages);

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 512,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Perspectives API error:", error);
    return NextResponse.json({ error: "Något gick fel." }, { status: 500 });
  }
}
