"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getFacts, CATEGORIES, CATEGORIES_EN, COLOR_MAP } from "@/data/facts";

const UI = {
  sv: {
    back: "← Krigets Arv",
    title: "Faktabank",
    filter_all: "Alla",
    of: "av",
    hint: "fakta · Klicka för att expandera · Kopiera med kontext",
    context_label: "Kontext & analys",
    source_prefix: "Källa",
    copy: "Kopiera med källa",
    copied: "✓ Kopierat",
    copy_context: "KONTEXT",
    copy_via: "Via: Krigets Arv – krigets-arv.se",
    footer: "Alla fakta är baserade på verifierade källor · UNICEF · SIPRI · ICRC · FN · Save the Children · PMC",
  },
  en: {
    back: "← Legacy of War",
    title: "Fact Bank",
    filter_all: "All",
    of: "of",
    hint: "facts · Click to expand · Copy with context",
    context_label: "Context & analysis",
    source_prefix: "Source",
    copy: "Copy with source",
    copied: "✓ Copied",
    copy_context: "CONTEXT",
    copy_via: "Via: The Legacy of War – krigets-arv.se",
    footer: "All facts are based on verified sources · UNICEF · SIPRI · ICRC · UN · Save the Children · PMC",
  },
};

export default function FactbankPage() {
  const { locale } = useParams() as { locale: string };
  const ui = UI[locale as keyof typeof UI] ?? UI.sv;
  const FACTS = getFacts(locale);
  const categories = locale === "en" ? CATEGORIES_EN : CATEGORIES;

  const [activeCategory, setActiveCategory] = useState(ui.filter_all);

  // Återställ filter om locale byts
  useEffect(() => {
    setActiveCategory(ui.filter_all);
  }, [locale]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = activeCategory === ui.filter_all ? FACTS : FACTS.filter((f) => f.category === activeCategory);

  function copyFact(e: React.MouseEvent, fact: typeof FACTS[0]) {
    e.stopPropagation();
    const text = [
      `${fact.stat} ${fact.label}`,
      ``,
      fact.detail,
      ``,
      `${ui.copy_context}: ${fact.context}`,
      ``,
      `${ui.source_prefix}: ${fact.source}`,
      ui.copy_via,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(fact.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-zinc-800/80 px-8 py-4 md:px-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}`} className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">{ui.back}</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">{ui.title}</span>
          </div>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono">{filtered.length} {ui.of} {FACTS.length} {ui.hint}</span>
      </div>

      <div className="border-b border-zinc-800/60 px-8 md:px-14 py-3 flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              activeCategory === cat ? "bg-red-700 text-white" : "text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="px-8 md:px-14 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fact) => {
            const isExpanded = expandedId === fact.id;
            return (
              <div key={fact.id}
                className={`border transition-all cursor-pointer ${isExpanded ? "border-zinc-600 bg-zinc-900/80" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60"}`}
                onClick={() => setExpandedId(isExpanded ? null : fact.id)}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">{fact.category}</span>
                    <span className="text-[10px] font-mono text-zinc-700">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                  <div className={`text-3xl font-black leading-none mb-2 ${COLOR_MAP[fact.color]}`}>{fact.stat}</div>
                  <p className="text-xs font-semibold text-zinc-300 mb-2 leading-snug">{fact.label}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{fact.detail}</p>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-zinc-700 pt-4">
                      <div>
                        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">{ui.context_label}</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">{fact.context}</p>
                      </div>
                      <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-zinc-700">[{ui.source_prefix}: {fact.source}]</span>
                        <button
                          onClick={(e) => copyFact(e, fact)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                            copiedId === fact.id ? "bg-green-800 text-green-200" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          }`}>
                          {copiedId === fact.id ? ui.copied : ui.copy}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-800/60 px-8 md:px-14 py-4 text-center">
        <p className="text-[10px] text-zinc-700 font-mono">{ui.footer}</p>
      </div>
    </div>
  );
}
