import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const { message, systemPrompt, history } = await req.json();

    const messages: Anthropic.MessageParam[] = [
      ...(history || []),
      {
        role: "user",
        content: message === "START_MONOLOGUE"
          ? "Presentera dig och börja din berättelse."
          : message,
      },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const answer = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Perspectives API error:", error);
    return NextResponse.json({ error: "Något gick fel." }, { status: 500 });
  }
}
