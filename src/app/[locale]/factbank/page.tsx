"use client";

import { useState } from "react";
import Link from "next/link";

const FACTS = [
  {
    id: 1, category: "Barn i konflikt",
    stat: "520 miljoner",
    label: "barn levde i aktiva konfliktzoner 2024",
    detail: "Mer än ett av fem barn globalt befann sig i konfliktdrabbade områden under 2024 – det högsta antalet någonsin registrerat.",
    context: "Det betyder att varje femte barn på jorden växer upp under ständigt hot om våld, tvångsflykt och psykologiskt trauma – med livslånga konsekvenser för hälsa, utbildning och framtid.",
    source: "FN:s säkerhetsråd, 2024",
    color: "red",
  },
  {
    id: 2, category: "Barn i konflikt",
    stat: "41 370",
    label: "grova kränkningar mot barn verifierades av FN 2024",
    detail: "+25% från 2023. Det högsta antalet sedan FN började registrera grova kränkningar mot barn i väpnade konflikter.",
    context: "Grova kränkningar inkluderar dödande, lemlästning, rekrytering av barnsoldater, sexuellt våld, bortföranden och attacker mot skolor och sjukhus. Mörkertalet är stort – många kränkningar når aldrig FN.",
    source: "FN:s säkerhetsråd / UNICEF, 2024",
    color: "red",
  },
  {
    id: 3, category: "Barn i konflikt",
    stat: "+30%",
    label: "ökning av brott mot barn i konflikter 2024",
    detail: "Brott mot barn i väpnade konflikter ökade med 30 procent under 2024 jämfört med föregående år.",
    context: "Ökningen är inte slumpmässig – den sammanfaller med eskaleringar i Gaza, Sudan och Ukraina där civila infrastrukturer systematiskt angrips. Trenden är konsekvent uppåtgående sedan 2020.",
    source: "Save the Children, 2024",
    color: "red",
  },
  {
    id: 4, category: "Barn i konflikt",
    stat: "+50%",
    label: "ökning av sexuellt våld mot barn i konflikt på 5 år",
    detail: "Sexuellt våld mot barn i väpnade konflikter har ökat med 50 procent under de senaste fem åren.",
    context: "Sexuellt våld används aktivt som ett vapen i konflikter. Flickor är oproportionerligt drabbade. Mörkertalet är enormt – de flesta fall anmäls aldrig på grund av stigma och rädsla för repressalier.",
    source: "Save the Children, 2025",
    color: "red",
  },
  {
    id: 5, category: "Jemen",
    stat: "11 miljoner",
    label: "barn i Jemen behöver akut humanitärt stöd",
    detail: "Jemen är hem för världens värsta humanitära kris. Sedan 2015 har den saudiskledda koalitionen – med västerländskt vapenstöd – bombat landet.",
    context: "Vapenembargon ignoreras systematiskt. Brittiska domstolar förklarade UK:s vapensäljning till Saudiarabien som olaglig 2019 – men försäljningen fortsatte. BAE Systems sålde vapen för £17,6 miljarder under kriget.",
    source: "UNICEF, 2025",
    color: "orange",
  },
  {
    id: 6, category: "Jemen",
    stat: "365+",
    label: "barn dödade eller skadade i Jemen under 2025",
    detail: "Ett barn dödas eller skadas i genomsnitt varje dag i Jemen under 2025. Sjukhus, skolor och marknader har bombats systematiskt.",
    context: "Sambandet är direkt: vapensystem exporterade av USA och Storbritannien används av den saudiskledda koalitionen i attacker som dödar civila. Lockheed Martin, RTX och BAE Systems rapporterar rekordvinster.",
    source: "Save the Children / ICRC, 2025",
    color: "orange",
  },
  {
    id: 7, category: "Gaza",
    stat: "1,1 miljoner",
    label: "barn i Gaza behöver akut humanitärt stöd",
    detail: "Nästan alla barn i Gaza uppvisar tecken på traumatisk stress. 625 000 skolbarn saknar utbildning. Varje fem sekunder skadas, dödas eller fördrivs ett barn i Mellanöstern.",
    context: "FN:s rapport från februari 2026 dokumenterar 'domicide' – massförstörelse av bostäder, skolor och sjukhus i Gaza, Myanmar, Sudan och Ukraina. Det klassas som ett systematiskt krigsbrott.",
    source: "UNICEF / OCHA, 2026",
    color: "orange",
  },
  {
    id: 8, category: "Ukraina",
    stat: "3 800+",
    label: "skolor förstörda i Ukraina sedan 2022",
    detail: "Systematiska attacker mot utbildningsinfrastruktur – 'educide' – syftar till att krossa en hel generations framtid. 7,5 miljoner barn har fördrivits.",
    context: "Psykosocial forskning från ukrainska skolbarn visar massiv förekomst av PTSD, ångest och sömnstörningar. Barn som växer upp under konstant hot om bombningar utvecklar neurologiska förändringar med livslånga effekter.",
    source: "UNICEF / FN / PMC, 2025",
    color: "blue",
  },
  {
    id: 9, category: "Sudan",
    stat: "14 miljoner",
    label: "barn fördrivna i Sudan – en av världens mest ignorerade kriser",
    detail: "Sudans humanitära kris är en av världens mest underprioriterade. RSF-milisen rekryterar barnsoldater och begår sexuellt våld systematiskt.",
    context: "Vapen från UAE och Ryssland fortsätter att flöda till RSF trots internationella uppmaningar om embargo. Al-Fasher-krisen 2025 tvingade tiotusentals familjer på flykt. Internationella medier täcker krisen knappt.",
    source: "OCHA / ICRC, 2025",
    color: "orange",
  },
  {
    id: 10, category: "Vapenhandel",
    stat: "$2,7 biljoner",
    label: "global militärspending 2024 – högsta nivån i historien",
    detail: "Den globala militärspendingen nådde historisk rekordnivå 2024, drivet av krig i Ukraina, Mellanöstern och accelererad NATO-upprustning.",
    context: "FN beräknar att $2,7 biljoner är mer än vad som krävs för att eliminera extrem fattigdom globalt. Av de permanenta FN-säkerhetsrådsmedlemmarna är USA, UK, Frankrike, Ryssland och Kina också världens fem största vapenexportörer.",
    source: "FN / SIPRI, 2024",
    color: "zinc",
  },
  {
    id: 11, category: "Vapenhandel",
    stat: "#1",
    label: "USA – världens största vapenexportör 2021–2025",
    detail: "USA toppar global vapenexport med Saudi-Arabien som huvudmottagare. Frankrike är #2, Ryssland #3 enligt SIPRI mars 2026.",
    context: "Strukturell konflikt: de fem permanenta FN-säkerhetsrådsmedlemmarna är också de fem största vapenexportörerna. Det skapar ett inbyggt intressekonfliktsystem där de länder som ska säkra fred tjänar ekonomiskt på krig.",
    source: "SIPRI, mars 2026",
    color: "zinc",
  },
  {
    id: 12, category: "Vapenhandel",
    stat: "£17,6 mdr",
    label: "BAE Systems sålde vapen till Saudiarabien under Jemenkriget",
    detail: "BAE Systems sålde vapensystem för £17,6 miljarder till Saudiarabien under Jemenkriget. UK:s Court of Appeal förklarade försäljningen som olaglig 2019 – men den fortsatte.",
    context: "BAE Systems rapporterade rekordvinst 2024–2025, delvis driven av Jemenkonflikten. Lockheed Martin omsatte $71 miljarder 2024. RTX (Raytheon) omsatte $80 miljarder 2025. Vapenbolagen är börsens starkaste sektor under konfliktåren.",
    source: "Declassified UK / The Guardian / BAE Systems årsredovisning",
    color: "zinc",
  },
  {
    id: 13, category: "Vapenhandel",
    stat: "$19 biljoner",
    label: "total global kostnad för väpnade konflikter",
    detail: "Den totala ekonomiska kostnaden för väpnade konflikter – inklusive direkta och indirekta kostnader – uppgår till $19 biljoner globalt.",
    context: "Kostnaden inkluderar militärutgifter, humanitär hjälp, förlorad produktivitet, flyktinghantering och återuppbyggnad. Den överstiger vida värdet av all global bistånd och hälsoinvestering kombinerat.",
    source: "Vision of Humanity / Visual Capitalist",
    color: "zinc",
  },
  {
    id: 14, category: "Långtidseffekter",
    stat: "18 år",
    label: "kritisk period för hjärnutveckling som krig förstör",
    detail: "Kronisk stress och trauma under de första 18 åren orsakar mätbara neurologiska skador – PTSD, kognitiva nedsättningar och emotionell dysreglering.",
    context: "Vetenskapliga studier (PMC/NIH) visar att barn utsatta för krig har strukturella förändringar i hippocampus och prefrontala cortex. Hypervigilans – ett konstant tillstånd av beredskap – hindrar normal kognitiv utveckling och kvarstår i vuxen ålder.",
    source: "PMC / NIH / IZA Institute of Labor Economics",
    color: "amber",
  },
  {
    id: 15, category: "Långtidseffekter",
    stat: "+70%",
    label: "ökning av saknade personer registrerade av Röda Korset på 5 år",
    detail: "Antalet saknade personer registrerade av ICRC ökade med 70 procent på fem år – ett direkt mått på krigets förödelse för familjer.",
    context: "Familjeseparation är ett av krigets mest förödande arv. Barn som separeras från sina föräldrar löper kraftigt förhöjd risk för trafficking, rekrytering av väpnade grupper och psykisk ohälsa. Återförening är ofta omöjlig när familjemedlemmar dödats.",
    source: "ICRC, 2025",
    color: "amber",
  },
];

const CATEGORIES = ["Alla", "Barn i konflikt", "Jemen", "Gaza", "Ukraina", "Sudan", "Vapenhandel", "Långtidseffekter"];
const COLOR_MAP: Record<string, string> = {
  red: "text-red-400", orange: "text-orange-400",
  blue: "text-blue-400", zinc: "text-zinc-300", amber: "text-amber-400",
};

export default function FactbankPage() {
  const [activeCategory, setActiveCategory] = useState("Alla");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = activeCategory === "Alla" ? FACTS : FACTS.filter((f) => f.category === activeCategory);

  function copyFact(e: React.MouseEvent, fact: typeof FACTS[0]) {
    e.stopPropagation();
    const text = [
      `${fact.stat} ${fact.label}`,
      ``,
      fact.detail,
      ``,
      `KONTEXT: ${fact.context}`,
      ``,
      `Källa: ${fact.source}`,
      `Via: Krigets Arv – krigets-arv.se`,
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
          <Link href="/sv" className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors">← Krigets Arv</Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Faktabank</span>
          </div>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono">{filtered.length} fakta · Klicka för att expandera · Kopiera med kontext</span>
      </div>

      <div className="border-b border-zinc-800/60 px-8 md:px-14 py-3 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
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
                        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Kontext & analys</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">{fact.context}</p>
                      </div>
                      <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-zinc-700">[Källa: {fact.source}]</span>
                        <button
                          onClick={(e) => copyFact(e, fact)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                            copiedId === fact.id ? "bg-green-800 text-green-200" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          }`}>
                          {copiedId === fact.id ? "✓ Kopierat" : "Kopiera med källa"}
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
        <p className="text-[10px] text-zinc-700 font-mono">
          Alla fakta är baserade på verifierade källor · UNICEF · SIPRI · ICRC · FN · Save the Children · PMC
        </p>
      </div>
    </div>
  );
}
