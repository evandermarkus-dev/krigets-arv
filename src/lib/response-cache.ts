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
