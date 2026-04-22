import { NextRequest } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { supabase } from "@/lib/supabase";
import { updateConflict } from "@/lib/conflict-updater";
import { CONFLICTS_SV } from "@/data/conflicts";

const anthropicProvider = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });

const DISCOVER_SYSTEM_PROMPT = `Du är ett geopolitiskt AI-system specialiserat på att identifiera aktiva väpnade konflikter globalt.
Svara ENBART med en valid JSON-array. Inga markdown-kodblock, ingen förklarande text, ingenting utanför JSON.

Schema per konflikt:
[
  {
    "id": "kebab-case-id",
    "name_sv": "Konfliktnamn på svenska",
    "name_en": "Conflict name in English",
    "lat": 0.0,
    "lng": 0.0,
    "severity": "critical",
    "query_sv": "Hur påverkar [konflikt] barn och civila?",
    "query_en": "How does [conflict] affect children and civilians?"
  }
]

Regler:
- severity "critical" = aktiv strid med bekräftade civila dödsfall eller fördrivningar just nu
- severity "high" = pågående väpnad konflikt med lägre intensitet eller fastlåst läge
- lat/lng = konfliktzonens geografiska centrum i decimalgrader (ej landets huvudstad)
- id = max 20 tecken, enbart a–z och bindestreck, inga accenter
- Inkludera BARA konflikter med verifierad pågående aktivitet 2025–2026
- Fokusera på konflikter som drabbar barn och civila`;

interface DiscoveredConflict {
  id: string;
  name_sv: string;
  name_en: string;
  lat: number;
  lng: number;
  severity: "critical" | "high";
  query_sv: string;
  query_en: string;
}

/**
 * POST /api/admin/discover-conflicts
 *
 * Skyddad av CRON_SECRET. Låter Claude identifiera nya pågående väpnade konflikter,
 * jämför mot befintliga i appen och lägger automatiskt till saknade i conflict_meta.
 * Hämtar sedan statistik (SV + EN) för varje ny konflikt via updateConflict().
 * Streamas som NDJSON — samma mönster som /api/admin/refresh-conflicts.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Steg 1: Hämta befintliga konflikt-ID:n (hårdkodade + databas)
        const hardcodedIds = CONFLICTS_SV.map((c) => c.id);
        const { data: metaRows } = await supabase
          .from("conflict_meta")
          .select("id");
        const existingIds = new Set([
          ...hardcodedIds,
          ...(metaRows ?? []).map((r) => r.id),
        ]);

        send({ type: "scanning", existingCount: existingIds.size });

        // Steg 2: Fråga Claude om aktuella konflikter
        const { text } = await generateText({
          model: anthropicProvider("claude-sonnet-4-6"),
          maxOutputTokens: 2048,
          system: DISCOVER_SYSTEM_PROMPT,
          prompt: `Lista de 15 mest allvarliga pågående väpnade konflikterna i världen ${new Date().getFullYear()}. Fokusera på konflikter som påverkar barn och civila.`,
        });

        // Steg 3: Parsa JSON och filtrera bort redan kända konflikter
        const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        let discovered: DiscoveredConflict[] = [];

        try {
          discovered = JSON.parse(clean);
        } catch {
          send({ type: "error", message: "Claude returnerade ogiltig JSON" });
          controller.close();
          return;
        }

        // Validera och filtrera
        const newConflicts = discovered.filter((c) => {
          if (!c.id || !c.name_sv || !c.name_en || !c.lat || !c.lng || !c.severity) return false;
          if (!["critical", "high"].includes(c.severity)) return false;
          return !existingIds.has(c.id);
        });

        send({ type: "found", total: discovered.length, newCount: newConflicts.length });

        if (newConflicts.length === 0) {
          send({ type: "complete", added: 0, message: "Inga nya konflikter hittades" });
          controller.close();
          return;
        }

        // Steg 4: Lägg till varje ny konflikt och hämta statistik
        let addedCount = 0;
        for (const conflict of newConflicts) {
          send({ type: "adding", conflictId: conflict.id, name: conflict.name_en });

          // Inserera i conflict_meta
          const { error: insertError } = await supabase.from("conflict_meta").upsert({
            id: conflict.id,
            name_sv: conflict.name_sv,
            name_en: conflict.name_en,
            lat: conflict.lat,
            lng: conflict.lng,
            severity: conflict.severity,
            query_sv: conflict.query_sv ?? "",
            query_en: conflict.query_en ?? "",
            active: true,
          }, { onConflict: "id" });

          if (insertError) {
            send({ type: "error", conflictId: conflict.id, message: insertError.message });
            continue;
          }

          // Hämta statistik parallellt för SV och EN
          const [sv, en] = await Promise.all([
            updateConflict(conflict.id, conflict.name_en, "sv"),
            updateConflict(conflict.id, conflict.name_en, "en"),
          ]);

          addedCount++;
          send({
            type: "done",
            conflictId: conflict.id,
            name: conflict.name_en,
            sv: { success: sv.success, error: sv.error },
            en: { success: en.success, error: en.error },
          });
        }

        send({ type: "complete", added: addedCount });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Okänt fel" });
      }

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
