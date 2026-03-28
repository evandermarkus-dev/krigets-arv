"use client";

import { useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const CONFLICTS = [
  {
    id: "jemen", name: "Jemen",
    lng: 48.5164, lat: 15.5527, severity: "critical",
    description: "Världens värsta humanitära kris. Ett barn dödas eller skadas varje dag i genomsnitt.",
    stats: [
      { label: "Barn behöver hjälp", value: "11M" },
      { label: "Barn dödade/skadade 2025", value: "365+" },
      { label: "Underernärda barn", value: "2.2M" },
    ],
    arms: "USA-vapen via Saudi-Arabien används direkt i bombkampanjen",
    sources: ["UNICEF", "ICRC", "Save the Children"],
    investigateQuery: "Vad är kopplingen mellan vapenexport och barnadödlighet i Jemen?",
  },
  {
    id: "ukraina", name: "Ukraina",
    lng: 31.1656, lat: 48.3794, severity: "critical",
    description: "Systematiska attacker mot skolor – 'educide' mot en hel generation barn.",
    stats: [
      { label: "Barn fördrivna", value: "7.5M" },
      { label: "Skolor förstörda", value: "3 800+" },
      { label: "Barn med PTSD", value: "miljoner" },
    ],
    arms: "Ryssland finansierar krig med vapenprofiter – barn betalar priset",
    sources: ["UNICEF", "FN", "PMC"],
    investigateQuery: "Hur påverkar det ryska kriget i Ukraina barns psykiska hälsa och utbildning?",
  },
  {
    id: "sudan", name: "Sudan",
    lng: 30.2176, lat: 12.8628, severity: "critical",
    description: "Massiv flykt från al-Fasher. Barnsoldater och hungersnöd på akut nivå.",
    stats: [
      { label: "Fördrivna barn", value: "14M" },
      { label: "Barnsoldater", value: "stigande" },
      { label: "Svältrisk", value: "akut" },
    ],
    arms: "Vapen från UAE och Ryssland till RSF-milisen",
    sources: ["ICRC", "OCHA", "Save the Children"],
    investigateQuery: "Hur drabbas barn i Sudans humanitära kris och vilka aktörer levererar vapen?",
  },
  {
    id: "gaza", name: "Gaza",
    lng: 34.3088, lat: 31.3547, severity: "critical",
    description: "Domicide – massförstörelse. Varje fem sekunder skadas ett barn.",
    stats: [
      { label: "Barn i konfliktzon", value: "1.1M" },
      { label: "Skolbarn utan utbildning", value: "625 000" },
      { label: "Barn med trauma", value: "nästan alla" },
    ],
    arms: "USA-levererade vapen används i konflikten",
    sources: ["UNICEF", "OCHA", "WHO"],
    investigateQuery: "Hur påverkas barn i Gaza och vad är kopplingen till internationell vapenexport?",
  },
  {
    id: "syrien", name: "Syrien",
    lng: 38.9968, lat: 34.8021, severity: "high",
    description: "14 år av konflikt. Ryskt/kinesiskt veto blockerade humanitär hjälp i FN.",
    stats: [
      { label: "Fördrivna barn", value: "6M" },
      { label: "År i konflikt", value: "14+" },
      { label: "Barndödlighet", value: "kraftigt förhöjd" },
    ],
    arms: "Ryssland och Iran levererade vapen till Assad-regimen",
    sources: ["UNICEF", "FN", "HRW"],
    investigateQuery: "Hur har FN:s säkerhetsråd misslyckats med att skydda barn i Syrien?",
  },
  {
    id: "sydsudan", name: "Sydsudan",
    lng: 31.3070, lat: 6.8770, severity: "high",
    description: "Rekrytering av barnsoldater och sexuellt våld på rekordhög nivå.",
    stats: [
      { label: "Fördrivna barn", value: "4M" },
      { label: "Barnsoldater", value: "19 000+" },
      { label: "Sexuellt våld mot barn", value: "+50% på 5 år" },
    ],
    arms: "Vapen från Uganda, Sudan och Kina till stridande parter",
    sources: ["ICRC", "FN", "ISS Africa"],
    investigateQuery: "Hur rekryteras barnsoldater i Sydsudan och vilka är de bakomliggande orsakerna?",
  },
];

type Conflict = typeof CONFLICTS[0];

export default function ExplorePage() {
  const [selected, setSelected] = useState<Conflict | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewState, setViewState] = useState({ longitude: 30, latitude: 20, zoom: 2.2 });

  function copyWithSource(conflict: Conflict) {
    const text = [
      `KONFLIKT: ${conflict.name}`,
      ``,
      conflict.description,
      ``,
      `STATISTIK:`,
      ...conflict.stats.map((s) => `• ${s.label}: ${s.value}`),
      ``,
      `VAPENKOPPLING: ${conflict.arms}`,
      ``,
      `KÄLLOR: ${conflict.sources.join(", ")}`,
      ``,
      `Källa: Krigets Arv – krigets-arv.se`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function investigateConflict(conflict: Conflict) {
    const url = `/sv/investigate?q=${encodeURIComponent(conflict.investigateQuery)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/sv" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">← Krigets Arv</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Utforska konflikter</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-600" />
            <span className="text-[10px] text-zinc-600 font-mono">Kritisk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-600" />
            <span className="text-[10px] text-zinc-600 font-mono">Allvarlig</span>
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
            {CONFLICTS.map((c) => (
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
                  {/* Header */}
                  <div className="border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{selected.name}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 ${selected.severity === "critical" ? "bg-red-900/60 text-red-300" : "bg-orange-900/60 text-orange-300"}`}>
                      {selected.severity === "critical" ? "KRITISK" : "ALLVARLIG"}
                    </span>
                  </div>
                  {/* Body */}
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
                    {/* Action buttons */}
                    <div className="flex gap-2 border-t border-zinc-800 pt-3">
                      <button onClick={() => copyWithSource(selected)}
                        className={`flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 transition-colors ${copied ? "bg-green-800 text-green-200" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                        {copied ? "✓ Kopierat!" : "Kopiera med källa"}
                      </button>
                      <button onClick={() => investigateConflict(selected)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 bg-red-800 hover:bg-red-700 text-red-100 transition-colors">
                        Utred vidare →
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
                <p className="text-[11px] text-zinc-400 font-mono tracking-wider">Klicka på en markör för att se konfliktdata</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
