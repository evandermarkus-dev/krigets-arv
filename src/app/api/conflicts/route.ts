import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { CONFLICTS_SV, CONFLICTS_EN } from "@/data/conflicts";
import type { Conflict } from "@/data/conflicts";

/**
 * GET /api/conflicts?locale=sv
 *
 * Returnerar konfliktdata med live-statistik från Supabase om tillgänglig,
 * annars faller den tillbaka på hårdkodad data.
 */
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "sv";
  const baseConflicts: Conflict[] = locale === "en" ? CONFLICTS_EN : CONFLICTS_SV;

  try {
    const { data: liveStats, error } = await supabase
      .from("conflict_stats")
      .select("conflict_id, description, stats, arms, sources, updated_at")
      .eq("locale", locale);

    if (error) console.error("[conflicts] Supabase-fel:", error.message);

    if (!liveStats || liveStats.length === 0) {
      console.log(`[conflicts] Ingen live-data för locale=${locale}, använder hårdkodad data`);
      return Response.json(baseConflicts);
    }

    console.log(`[conflicts] Hämtade ${liveStats.length} live-rader för locale=${locale}`);

    // Indexera live-data per conflict_id för O(1)-lookup
    const liveMap = new Map(liveStats.map((row) => [row.conflict_id, row]));

    const merged = baseConflicts.map((c) => {
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

    return Response.json(merged);
  } catch {
    // Fallback till hårdkodad data vid fel
    return Response.json(baseConflicts);
  }
}
