"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { getConflicts } from "@/data/conflicts";
import type { Conflict } from "@/data/conflicts";

const UI = {
  sv: {
    back: "← Krigets Arv",
    title: "Utforska konflikter",
    legend_critical: "Kritisk",
    legend_serious: "Allvarlig",
    hint: "Klicka på en markör för att se konfliktdata",
    copy: "Kopiera med källa",
    copied: "✓ Kopierat!",
    investigate_btn: "Utred vidare →",
    severity_critical: "KRITISK",
    severity_serious: "ALLVARLIG",
    copy_conflict: "KONFLIKT",
    copy_stats: "STATISTIK",
    copy_arms: "VAPENKOPPLING",
    copy_sources: "KÄLLOR",
    copy_footer: "Källa: Krigets Arv – krigets-arv.se",
  },
  en: {
    back: "← Legacy of War",
    title: "Explore conflicts",
    legend_critical: "Critical",
    legend_serious: "Serious",
    hint: "Click on a marker to view conflict data",
    copy: "Copy with source",
    copied: "✓ Copied!",
    investigate_btn: "Investigate further →",
    severity_critical: "CRITICAL",
    severity_serious: "SERIOUS",
    copy_conflict: "CONFLICT",
    copy_stats: "STATISTICS",
    copy_arms: "ARMS CONNECTION",
    copy_sources: "SOURCES",
    copy_footer: "Source: The Legacy of War – krigets-arv.se",
  },
};

export default function ExplorePage() {
  const { locale } = useParams() as { locale: string };
  const ui = UI[locale as keyof typeof UI] ?? UI.sv;

  const [conflicts, setConflicts] = useState<Conflict[]>(() => getConflicts(locale));
  const [selected, setSelected] = useState<Conflict | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewState, setViewState] = useState({ longitude: 30, latitude: 20, zoom: 2.2 });

  // Hämta live-data från Supabase via API; faller tillbaka på hårdkodad data vid fel
  useEffect(() => {
    setConflicts(getConflicts(locale));
    fetch(`/api/conflicts?locale=${locale}`)
      .then((r) => r.json())
      .then((data: Conflict[]) => { if (Array.isArray(data)) setConflicts(data); })
      .catch(() => { /* behåll hårdkodad data */ });
  }, [locale]);

  // Stäng popup om locale byts
  useEffect(() => {
    setSelected(null);
    setCopied(false);
  }, [locale]);

  function copyWithSource(conflict: Conflict) {
    const text = [
      `${ui.copy_conflict}: ${conflict.name}`,
      ``,
      conflict.description,
      ``,
      `${ui.copy_stats}:`,
      ...conflict.stats.map((s) => `• ${s.label}: ${s.value}`),
      ``,
      `${ui.copy_arms}: ${conflict.arms}`,
      ``,
      `${ui.copy_sources}: ${conflict.sources.join(", ")}`,
      ``,
      ui.copy_footer,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function investigateConflict(conflict: Conflict) {
    const url = `/${locale}/investigate?q=${encodeURIComponent(conflict.investigateQuery)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}`} className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">{ui.back}</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">{ui.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-600" />
            <span className="text-[10px] text-zinc-600 font-mono">{ui.legend_critical}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-600" />
            <span className="text-[10px] text-zinc-600 font-mono">{ui.legend_serious}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="bottom-right" />
            {conflicts.map((c: Conflict) => (
              <Marker key={c.id} longitude={c.lng} latitude={c.lat} anchor="center"
                onClick={(e) => { e.originalEvent.stopPropagation(); setSelected(c); setCopied(false); }}>
                <div className="cursor-pointer relative">
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${c.severity === "critical" ? "bg-red-600" : "bg-orange-600"}`}
                    style={{ animationDuration: "2s" }} />
                  <div className={`relative h-4 w-4 rounded-full border-2 border-white/20 shadow-lg ${c.severity === "critical" ? "bg-red-600" : "bg-orange-500"}`} />
                </div>
              </Marker>
            ))}

            {selected && (
              <Popup longitude={selected.lng} latitude={selected.lat} anchor="bottom"
                onClose={() => setSelected(null)} closeOnClick={false} className="conflict-popup">
                <div className="bg-zinc-900 border border-zinc-700 min-w-[300px]">
                  <div className="border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{selected.name}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 ${selected.severity === "critical" ? "bg-red-900/60 text-red-300" : "bg-orange-900/60 text-orange-300"}`}>
                      {selected.severity === "critical" ? ui.severity_critical : ui.severity_serious}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-zinc-300 text-xs leading-relaxed">{selected.description}</p>
                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
                      {selected.stats.map((s) => (
                        <div key={s.label} className="flex flex-col">
                          <span className="text-sm font-black text-red-400">{s.value}</span>
                          <span className="text-[9px] text-zinc-600 leading-tight mt-0.5">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-800 pt-2">
                      <p className="text-[9px] text-zinc-500 font-mono">⚔️ {selected.arms}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {selected.sources.map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 font-mono">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 border-t border-zinc-800 pt-3">
                      <button onClick={() => copyWithSource(selected)}
                        className={`flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 transition-colors ${copied ? "bg-green-800 text-green-200" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                        {copied ? ui.copied : ui.copy}
                      </button>
                      <button onClick={() => investigateConflict(selected)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-red-800 hover:bg-red-700 text-red-100 transition-colors">
                        {ui.investigate_btn}
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
          {!selected && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm border border-zinc-800 px-4 py-2">
                <p className="text-[11px] text-zinc-400 font-mono tracking-wider">{ui.hint}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
