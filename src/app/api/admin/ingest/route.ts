import { NextRequest, NextResponse } from "next/server";
import { ingestUrl, ingestUrls } from "@/lib/ingestion";
import { TRUSTED_SOURCES } from "@/config/sources";

/**
 * POST /api/admin/ingest
 *
 * Skyddad av CRON_SECRET — används för att trigga indexering.
 *
 * Body-alternativ:
 *   { url: string }           — indexera en specifik URL
 *   { seed: true }            — indexera startsidorna för alla betrodda domäner
 *
 * Exempel:
 *   curl -X POST /api/admin/ingest \
 *     -H "Authorization: Bearer <CRON_SECRET>" \
 *     -d '{"url":"https://www.unicef.org/reports/children-war-2024"}'
 */
export async function POST(req: NextRequest) {
  // Autentisering
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Indexera en enskild URL
  if (typeof body.url === "string") {
    const result = await ingestUrl(body.url);
    return NextResponse.json(result);
  }

  // Seed: indexera startsidorna för alla betrodda domäner
  if (body.seed === true) {
    const seedUrls = TRUSTED_SOURCES.filter((s) => s.priority === 1).map(
      (s) => `https://www.${s.domain}`
    );
    const results = await ingestUrls(seedUrls);
    const summary = {
      total: results.length,
      indexed: results.filter((r) => !r.skipped && !r.error).length,
      skipped: results.filter((r) => r.skipped).length,
      errors: results.filter((r) => r.error).length,
      results,
    };
    return NextResponse.json(summary);
  }

  return NextResponse.json(
    { error: 'Ange { url: "..." } eller { seed: true }' },
    { status: 400 }
  );
}
