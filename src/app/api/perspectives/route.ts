import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropic = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { perspectivesRatelimit, buildRatelimitKey } from "@/lib/ratelimit";
import { MONOLOGUE_TRIGGERS } from "@/config/prompts";
import { buildCacheKey, getCachedResponse, setCachedResponse } from "@/lib/response-cache";
import { log } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  if (perspectivesRatelimit) {
    const { success } = await perspectivesRatelimit.limit(buildRatelimitKey(ip, ua));
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
  }

  try {
    const { messages, systemPrompt, locale } = await req.json();

    // Cache key based on last message content + locale
    const lastMsg = messages?.at(-1);
    const lastText =
      typeof lastMsg?.content === "string"
        ? lastMsg.content
        : (lastMsg?.content as Array<{ type: string; text?: string }>)?.find(
            (p) => p.type === "text",
          )?.text ?? "";

    const cacheKey = buildCacheKey(lastText, "perspectives", locale ?? "sv");
    const cached = await getCachedResponse(cacheKey);

    if (cached) {
      log("info", { route: "perspectives", cache_hit: true });
      const body = `0:${JSON.stringify(cached)}\n`;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
          "x-from-cache": "true",
        },
      });
    }

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
      onFinish: async ({ text }) => {
        if (text) await setCachedResponse(cacheKey, text, 1800);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    log("error", { route: "perspectives", error: String(error) });
    return NextResponse.json({ error: "Något gick fel." }, { status: 500 });
  }
}
