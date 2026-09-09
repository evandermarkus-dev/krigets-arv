import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

// Skapar en Upstash-baserad rate limiter om env-variablerna finns.
// Saknas de (t.ex. lokal dev utan Redis) returneras null — routes tillåter då alla anrop.
function createRatelimit(requests: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: "krigets-arv",
  });
}

/**
 * Bygger en sammansatt identifier från IP + User-Agent.
 * Minskar risken att många användare bakom samma NAT/router delar en hink —
 * olika enheter och webbläsare har olika User-Agent.
 */
export function buildRatelimitKey(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}::${userAgent}`)
    .digest("hex")
    .slice(0, 20);
}

/**
 * Kollar en rate limiter men failar öppet (tillåter requesten) om limitern
 * själv kastar — t.ex. att Redis är onåbart. En trasig Redis-uppkoppling ska
 * aldrig blockera den faktiska funktionen.
 */
export async function checkRatelimit(
  limiter: ReturnType<typeof createRatelimit>,
  ip: string,
  userAgent: string,
): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(buildRatelimitKey(ip, userAgent));
    return success;
  } catch {
    return true;
  }
}

// /api/investigate — 30 förfrågningar per composite-nyckel per minut
export const investigateRatelimit = createRatelimit(30, "1 m");

// /api/perspectives — 40 förfrågningar per composite-nyckel per minut (fler utbyten per session)
export const perspectivesRatelimit = createRatelimit(40, "1 m");
