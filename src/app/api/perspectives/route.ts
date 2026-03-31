import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter: 10 requests per IP per minute.
// NOTE: This is per-instance — for distributed rate limiting use @upstash/ratelimit.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "För många förfrågningar. Vänta en minut." }, { status: 429 });
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
