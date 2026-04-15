import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { CONFLICTS_SV, CONFLICTS_EN } from "@/data/conflicts";
import type { Conflict } from "@/data/conflicts";

/**
 * GET /api/conflicts?locale=sv
 *
 * Returnerar konfliktdata med live-statistik från Supabase om tillgänglig.
 * Slår också ihop med dynamiska konflikter från conflict_meta-tabellen
 * som lagts till via admin utan koddeploy.
 */
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "sv";
  const baseConflicts: Conflict[] = locale === "en" ? CONFLICTS_EN : CONFLICTS_SV;

  try {
    // Hämta live-statistik och dynamiska konfliktmetadata parallellt
    const [statsResult, metaResult] = await Promise.all([
      supabase
        .from("conflict_stats")
        .select("conflict_id, description, stats, arms, sources, updated_at")
        .eq("locale", locale),
      supabase
        .from("conflict_meta")
        .select("id, name_sv, name_en, lat, lng, severity, query_sv, query_en")
        .eq("active", true),
    ]);

    if (statsResult.error) console.error("[conflicts] stats-fel:", statsResult.error.message);
    if (metaResult.error) console.error("[conflicts] meta-fel:", metaResult.error.message);

    const liveStats = statsResult.data ?? [];
    const dynamicMeta = metaResult.data ?? [];

    const liveMap = new Map(liveStats.map((row) => [row.conflict_id, row]));

    // Slå ihop live-statistik med hårdkodad basdata
    const merged: Conflict[] = baseConflicts.map((c) => {
      const live = liveMap.get(c.id);
      if (!live) return c;
      return {
        ...c,
        description: live.description ?? c.description,
        stats: Array.isArray(live.stats) && live.stats.length > 0 ? live.stats : c.stats,
        arms: live.arms ?? c.arms,
        sources: Array.isArray(live.sources) && live.sources.length > 0 ? live.sources : c.sources,
      };
    });

    // Lägg till dynamiska konflikter från Supabase som inte finns i hårdkodad lista
    const hardcodedIds = new Set(baseConflicts.map((c) => c.id));
    for (const meta of dynamicMeta) {
      if (hardcodedIds.has(meta.id)) continue;
      const live = liveMap.get(meta.id);
      merged.push({
        id: meta.id,
        name: locale === "en" ? meta.name_en : meta.name_sv,
        lat: meta.lat,
        lng: meta.lng,
        severity: meta.severity as "critical" | "high",
        description: live?.description ?? "",
        stats: Array.isArray(live?.stats) ? live.stats : [],
        arms: live?.arms ?? "",
        sources: Array.isArray(live?.sources) ? live.sources : [],
        investigateQuery: locale === "en" ? meta.query_en : meta.query_sv,
      });
    }

    console.log(`[conflicts] ${merged.length} konflikter (${baseConflicts.length} hårdkodade + ${merged.length - baseConflicts.length} dynamiska)`);
    return Response.json(merged);
  } catch {
    return Response.json(baseConflicts);
  }
}

/**
 * POST /api/conflicts
 *
 * Lägger till en ny konflikt i conflict_meta. Skyddad av CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.name_sv || !body?.name_en || !body?.lat || !body?.lng || !body?.severity) {
    return new Response(JSON.stringify({ error: "Saknade fält" }), { status: 400 });
  }

  const { error } = await supabase.from("conflict_meta").upsert({
    id: body.id,
    name_sv: body.name_sv,
    name_en: body.name_en,
    lat: body.lat,
    lng: body.lng,
    severity: body.severity,
    query_sv: body.query_sv ?? "",
    query_en: body.query_en ?? "",
    active: true,
  }, { onConflict: "id" });

  if (error) {
    console.error("[conflicts] POST-fel:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`[conflicts] Ny konflikt tillagd: ${body.id}`);
  return Response.json({ success: true, id: body.id });
}
