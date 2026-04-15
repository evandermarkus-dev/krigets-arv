import { NextRequest } from "next/server";
import { updateConflict } from "@/lib/conflict-updater";
import { CONFLICTS_SV } from "@/data/conflicts";

/**
 * POST /api/admin/refresh-conflicts
 *
 * Skyddad av CRON_SECRET. Uppdaterar konfliktdata via Firecrawl + pgvector + Claude.
 * Streamar progress som newline-delimiterad JSON (NDJSON) så admin-UI kan visa status live.
 *
 * Body: {} → uppdaterar alla konflikter
 *       { conflictId: "gaza" } → uppdaterar en specifik konflikt
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const singleId = typeof body.conflictId === "string" ? body.conflictId : null;

  const conflicts = singleId
    ? CONFLICTS_SV.filter((c) => c.id === singleId)
    : CONFLICTS_SV;

  if (conflicts.length === 0) {
    return new Response(JSON.stringify({ error: "Konflikt-id hittades inte" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Streama NDJSON-progress tillbaka till klienten
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      console.log(`[refresh-conflicts] Startar uppdatering av ${conflicts.length} konflikter`);

      for (const conflict of conflicts) {
        send({ type: "start", conflictId: conflict.id });
        console.log(`[refresh-conflicts] Uppdaterar: ${conflict.id}`);

        const [sv, en] = await Promise.all([
          updateConflict(conflict.id, conflict.name, "sv"),
          updateConflict(conflict.id, conflict.name, "en"),
        ]);

        if (!sv.success) console.error(`[refresh-conflicts] SV misslyckades för ${conflict.id}: ${sv.error}`);
        if (!en.success) console.error(`[refresh-conflicts] EN misslyckades för ${conflict.id}: ${en.error}`);

        send({
          type: "done",
          conflictId: conflict.id,
          sv: { success: sv.success, error: sv.error },
          en: { success: en.success, error: en.error },
        });
      }

      console.log(`[refresh-conflicts] Klar`);
      send({ type: "complete", total: conflicts.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
