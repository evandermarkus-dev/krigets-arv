import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

// /api/investigate — 10 förfrågningar per IP per minut
export const investigateRatelimit = createRatelimit(10, "1 m");

// /api/perspectives — 20 förfrågningar per IP per minut (fler utbyten per session)
export const perspectivesRatelimit = createRatelimit(20, "1 m");
