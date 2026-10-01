import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
const anthropic = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { perspectivesRatelimit, checkRatelimit } from "@/lib/ratelimit";
import { MONOLOGUE_TRIGGERS, ROLE_PROMPTS } from "@/config/prompts";
import { buildCacheKey, getCachedResponse, setCachedResponse, cachedTextStreamResponse } from "@/lib/response-cache";
import { log } from "@/lib/logger";
import { conversationCacheText, messageText, withText } from "@/lib/ui-messages";
import { embedText } from "@/lib/embeddings";
import { supabase, type SearchResult } from "@/lib/supabase";
import { searchSources, formatResultsAsContext } from "@/lib/firecrawl";
import { withBreaker } from "@/lib/circuit-breaker";

async function vectorSearch(query: string, limit = 3): Promise<SearchResult[]> {
  if (!process.env.OPENAI_API_KEY) return [];
  const embedding = await embedText(query);
  const { data, error } = await supabase.rpc("search_chunks", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
  });
  if (error || !data?.length) return [];
  return data as SearchResult[];
}

const lookupFactSchema = z.object({
  query: z.string().describe("Söktermen på engelska, t.ex. 'child soldiers South Sudan recruitment'"),
});

const lookupFactTool = tool<z.infer<typeof lookupFactSchema>, string>({
  description:
    "Sök i källdatabasen efter verifierade fakta om ett specifikt ämne (konflikter, barns rättigheter, vapenhandel, m.m.). Använd detta när du vill citera ett konkret faktum eller en statistik.",
  inputSchema: lookupFactSchema,
  execute: async ({ query }) => {
    const vectorResults = await withBreaker("pgvector", () => vectorSearch(query, 3), [] as SearchResult[]);

    if (vectorResults.length >= 1) {
      return vectorResults
        .map((r) => `[${r.source_name}] ${r.content.slice(0, 400)}\nKälla: ${r.url}`)
        .join("\n\n");
    }

    const firecrawlResults = await withBreaker("firecrawl", () => searchSources(query, 2), []);
    if (firecrawlResults.length > 0) return formatResultsAsContext(firecrawlResults);

    return "Inga relevanta källdokument hittades för denna sökning.";
  },
});

export const maxDuration = 60;

const MAX_MESSAGES = 40;

/** Resolve the character prompt on the server — never trust a prompt from the client. */
function resolveRolePrompt(roleId: unknown, locale: string): string | null {
  if (typeof roleId !== "string") return null;
  const prompts = ROLE_PROMPTS[locale] ?? ROLE_PROMPTS.sv;
  return Object.hasOwn(prompts, roleId) ? prompts[roleId] : null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  if (!(await checkRatelimit(perspectivesRatelimit, ip, ua))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const messages = body?.messages;
    const locale: string = body?.locale === "en" ? "en" : "sv";

    const systemPrompt = resolveRolePrompt(body?.roleId, locale);
    if (!systemPrompt) {
      return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    }
    if (!Array.isArray(body?.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
    }

    // Cache-nyckel = karaktärens prompt + hela samtalet. AI SDK 6 skickar text i
    // `parts`; den gamla `content`-läsningen gav tom text, så varje följdfråga
    // fick tillbaka karaktärens första cachade svar.
    const cacheKey = buildCacheKey(`${systemPrompt}::${conversationCacheText(messages)}`, "perspectives", locale);
    const cached = await getCachedResponse(cacheKey);

    if (cached) {
      log("info", { route: "perspectives", cache_hit: true });
      return cachedTextStreamResponse(cached);
    }

    const monologueTrigger = MONOLOGUE_TRIGGERS[locale];

    // Replace START_MONOLOGUE trigger with actual prompt in last message
    const processedMessages = messages.map((m: object, i: number) =>
      i === messages.length - 1 && messageText(m) === "START_MONOLOGUE"
        ? withText(m, monologueTrigger)
        : m
    );

    const modelMessages = await convertToModelMessages(processedMessages);

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 512,
      stopWhen: stepCountIs(2),
      tools: { lookupFact: lookupFactTool },
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
