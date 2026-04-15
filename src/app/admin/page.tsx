"use client";

import { useState } from "react";
import Link from "next/link";
import { CONFLICTS_SV } from "@/data/conflicts";

type ConflictStatus = {
  id: string;
  name: string;
  state: "idle" | "running" | "done" | "error";
  sv?: { success: boolean; error?: string };
  en?: { success: boolean; error?: string };
};

type NdjsonEvent =
  | { type: "start"; conflictId: string }
  | { type: "done"; conflictId: string; sv: { success: boolean; error?: string }; en: { success: boolean; error?: string } }
  | { type: "complete"; total: number };

const EMPTY_NEW = { id: "", name_sv: "", name_en: "", lat: "", lng: "", severity: "critical" as "critical" | "high", query_sv: "", query_en: "" };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<ConflictStatus[]>(
    CONFLICTS_SV.map((c) => ({ id: c.id, name: c.name, state: "idle" }))
  );
  const [log, setLog] = useState<string[]>([]);
  const [authError, setAuthError] = useState(false);
  const [newConflict, setNewConflict] = useState(EMPTY_NEW);
  const [addStatus, setAddStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [addError, setAddError] = useState("");

  function appendLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  function updateStatus(patch: Partial<ConflictStatus> & { id: string }) {
    setStatuses((prev) =>
      prev.map((s) => (s.id === patch.id ? { ...s, ...patch } : s))
    );
  }

  async function runUpdate(conflictId?: string) {
    setRunning(true);
    setAuthError(false);
    setLog([]);

    if (conflictId) {
      updateStatus({ id: conflictId, state: "running", sv: undefined, en: undefined });
    } else {
      setStatuses(CONFLICTS_SV.map((c) => ({ id: c.id, name: c.name, state: "running" })));
    }

    try {
      const res = await fetch("/api/admin/refresh-conflicts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(conflictId ? { conflictId } : {}),
      });

      if (res.status === 401) {
        setAuthError(true);
        setStatuses(CONFLICTS_SV.map((c) => ({ id: c.id, name: c.name, state: "idle" })));
        setRunning(false);
        return;
      }

      if (!res.body) throw new Error("Inget svar från API");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as NdjsonEvent;

            if (event.type === "start") {
              appendLog(`▶ Startar ${event.conflictId}...`);
              updateStatus({ id: event.conflictId, state: "running" });
            } else if (event.type === "done") {
              const svOk = event.sv.success;
              const enOk = event.en.success;
              const ok = svOk && enOk;
              appendLog(
                ok
                  ? `✓ ${event.conflictId} — klart (SV + EN)`
                  : `✗ ${event.conflictId} — ${!svOk ? `SV: ${event.sv.error}` : ""} ${!enOk ? `EN: ${event.en.error}` : ""}`
              );
              updateStatus({
                id: event.conflictId,
                state: ok ? "done" : "error",
                sv: event.sv,
                en: event.en,
              });
            } else if (event.type === "complete") {
              appendLog(`✓ Klar — ${event.total} konflikter uppdaterade`);
            }
          } catch {
            // Ignorera ogiltiga JSON-rader
          }
        }
      }
    } catch (err) {
      appendLog(`Fel: ${err instanceof Error ? err.message : String(err)}`);
    }

    setRunning(false);
  }

  async function addNewConflict() {
    setAddStatus("saving");
    setAddError("");
    try {
      const res = await fetch("/api/conflicts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          ...newConflict,
          lat: parseFloat(newConflict.lat),
          lng: parseFloat(newConflict.lng),
        }),
      });

      if (res.status === 401) { setAddError("Fel lösenord"); setAddStatus("error"); return; }
      const data = await res.json();
      if (!data.success) { setAddError(data.error ?? "Okänt fel"); setAddStatus("error"); return; }

      setAddStatus("done");
      setNewConflict(EMPTY_NEW);
      // Lägg till i statuslistan så den kan uppdateras direkt
      setStatuses((prev) => [...prev, { id: newConflict.id, name: newConflict.name_sv, state: "idle" }]);
      setTimeout(() => setAddStatus("idle"), 3000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Okänt fel");
      setAddStatus("error");
    }
  }

  const canAdd = newConflict.id && newConflict.name_sv && newConflict.name_en &&
    newConflict.lat && newConflict.lng && password && addStatus !== "saving";

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-300 font-mono">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-0.5 bg-red-600" />
          <span className="text-[11px] tracking-[0.3em] text-zinc-400 uppercase">Krigets Arv — Admin</span>
        </div>
        <Link href="/sv" className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Tillbaka
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12 space-y-10">

        {/* Auth */}
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">Autentisering</h2>
          <input
            type="password"
            placeholder="CRON_SECRET"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          {authError && (
            <p className="text-[11px] text-red-400">Fel lösenord — kontrollera CRON_SECRET i Vercel</p>
          )}
        </section>

        {/* Global action */}
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">Uppdatera konfliktdata</h2>
          <button
            onClick={() => runUpdate()}
            disabled={running || !password}
            className="w-full py-3 text-xs font-bold tracking-[0.15em] uppercase bg-red-800 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors"
          >
            {running ? "Uppdaterar…" : "Uppdatera alla konflikter (SV + EN)"}
          </button>
        </section>

        {/* Per-conflict status */}
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">Konflikter</h2>
          <div className="divide-y divide-zinc-800/60 border border-zinc-800">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusDot state={s.state} />
                  <span className="text-sm text-zinc-300">{s.name}</span>
                  {s.sv && !s.sv.success && (
                    <span className="text-[10px] text-red-400">SV: {s.sv.error}</span>
                  )}
                  {s.en && !s.en.success && (
                    <span className="text-[10px] text-red-400">EN: {s.en.error}</span>
                  )}
                </div>
                <button
                  onClick={() => runUpdate(s.id)}
                  disabled={running || !password}
                  className="text-[10px] tracking-widest uppercase px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Uppdatera
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Lägg till ny konflikt */}
        <section className="space-y-3">
          <h2 className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">Lägg till ny konflikt</h2>
          <p className="text-[11px] text-zinc-600">Konflikter tillagda här sparas i Supabase och visas direkt på kartan utan ny deploy.</p>
          <div className="border border-zinc-800 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="ID (t.ex. irak)" value={newConflict.id}
                onChange={(e) => setNewConflict((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/\s/g, "-") }))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
              <select value={newConflict.severity}
                onChange={(e) => setNewConflict((p) => ({ ...p, severity: e.target.value as "critical" | "high" }))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500">
                <option value="critical">Kritisk (röd)</option>
                <option value="high">Allvarlig (orange)</option>
              </select>
            </div>
            <input placeholder="Namn på svenska (t.ex. Irak)" value={newConflict.name_sv}
              onChange={(e) => setNewConflict((p) => ({ ...p, name_sv: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
            <input placeholder="Namn på engelska (t.ex. Iraq)" value={newConflict.name_en}
              onChange={(e) => setNewConflict((p) => ({ ...p, name_en: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Latitud (t.ex. 33.22)" value={newConflict.lat}
                onChange={(e) => setNewConflict((p) => ({ ...p, lat: e.target.value }))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
              <input placeholder="Longitud (t.ex. 43.68)" value={newConflict.lng}
                onChange={(e) => setNewConflict((p) => ({ ...p, lng: e.target.value }))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
            </div>
            <input placeholder="Utredningsfråga (svenska)" value={newConflict.query_sv}
              onChange={(e) => setNewConflict((p) => ({ ...p, query_sv: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
            <input placeholder="Utredningsfråga (engelska)" value={newConflict.query_en}
              onChange={(e) => setNewConflict((p) => ({ ...p, query_en: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
            <button onClick={addNewConflict} disabled={!canAdd}
              className="w-full py-2.5 text-xs font-bold tracking-[0.15em] uppercase bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors">
              {addStatus === "saving" ? "Sparar…" : addStatus === "done" ? "✓ Tillagd!" : "Lägg till konflikt"}
            </button>
            {addError && <p className="text-[11px] text-red-400">{addError}</p>}
          </div>
        </section>

        {/* Live log */}
        {log.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">Logg</h2>
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 space-y-1 max-h-64 overflow-y-auto">
              {log.map((line, i) => (
                <p key={i} className={`text-[11px] leading-relaxed ${line.startsWith("✓") ? "text-green-400" : line.startsWith("✗") || line.startsWith("Fel") ? "text-red-400" : "text-zinc-400"}`}>
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatusDot({ state }: { state: ConflictStatus["state"] }) {
  const cls =
    state === "running" ? "bg-yellow-500 animate-pulse" :
    state === "done"    ? "bg-green-500" :
    state === "error"   ? "bg-red-500" :
                          "bg-zinc-700";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}
