import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCachedResponse } from "@/lib/response-cache";

const CHECK_TIMEOUT_MS = 2000

function withTimeout<T>(thenable: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), CHECK_TIMEOUT_MS),
    ),
  ])
}

async function checkDb(): Promise<"ok" | "error"> {
  try {
    const { error } = await withTimeout(
      supabase.from("conflict_stats").select("conflict_id").limit(1),
    )
    return error ? "error" : "ok"
  } catch {
    return "error"
  }
}

async function checkRedis(): Promise<"ok" | "error" | "skipped"> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return "skipped"
  try {
    await withTimeout(getCachedResponse("__health__"))
    return "ok"
  } catch {
    return "error"
  }
}

async function checkRag(): Promise<"ok" | "skipped"> {
  if (!process.env.OPENAI_API_KEY) return "skipped"
  // A full embed call would be too expensive on every health probe — Supabase
  // reachability is already covered by checkDb, so we just verify the key exists.
  return "ok"
}

export async function GET() {
  const [dbResult, redisResult, ragResult] = await Promise.allSettled([
    checkDb(),
    checkRedis(),
    checkRag(),
  ])

  const db = dbResult.status === "fulfilled" ? dbResult.value : "error"
  const redis = redisResult.status === "fulfilled" ? redisResult.value : "error"
  const rag = ragResult.status === "fulfilled" ? ragResult.value : "error"

  const healthy = db === "ok" && (redis === "ok" || redis === "skipped")
  const status = healthy ? "ok" : "degraded"

  return NextResponse.json({ status, db, redis, rag }, { status: healthy ? 200 : 503 })
}
