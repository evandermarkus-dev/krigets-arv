import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropic = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { perspectivesRatelimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (perspectivesRatelimit) {
    const { success } = await perspectivesRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "För många förfrågningar. Vänta en minut." }, { status: 429 });
    }
  }

  try {
    const { messages, systemPrompt } = await req.json();

    // Replace START_MONOLOGUE trigger with actual prompt in last message
    const processedMessages = messages.map((m: { role: string; content: unknown }, i: number) =>
      i === messages.length - 1 && m.content === "START_MONOLOGUE"
        ? { ...m, content: "Presentera dig och börja din berättelse." }
        : m
    );

    const modelMessages = await convertToModelMessages(processedMessages);

    const result = streamText({
      model: anthropic("claude-sonnet-4-5"),
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
