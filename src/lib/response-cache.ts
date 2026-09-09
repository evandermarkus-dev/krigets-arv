import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

const DEFAULT_TTL = 600; // 10 minuter

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function buildCacheKey(lastMessage: string, mode: string, locale: string): string {
  const hash = createHash("sha256")
    .update(`${lastMessage}::${mode}::${locale}`)
    .digest("hex")
    .slice(0, 24);
  return `krigets-arv:response:${hash}`;
}

export async function getCachedResponse(key: string): Promise<string | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get<string>(key);
  } catch {
    return null;
  }
}

export async function setCachedResponse(key: string, text: string, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, text, { ex: ttl });
  } catch {
    // Cache-fel ska aldrig blockera svar
  }
}

/**
 * Returnerar ett cachat svar i AI SDK:s UI Message Stream-protokoll (SSE,
 * x-vercel-ai-ui-message-stream: v1) — samma protokoll som
 * result.toUIMessageStreamResponse() producerar. useChat känner inte igen
 * det äldre data-stream-formatet ("0:...\n"), så ett svar i fel format
 * renderas aldrig i klienten trots en lyckad 200 OK.
 */
export function cachedTextStreamResponse(text: string): Response {
  const chunks = [
    { type: "text-start", id: "0" },
    { type: "text-delta", id: "0", delta: text },
    { type: "text-end", id: "0" },
  ];
  const body =
    chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n";

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
      "x-accel-buffering": "no",
      "x-from-cache": "true",
    },
  });
}
