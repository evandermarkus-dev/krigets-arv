import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808]">

      {/* Background photo – refugees/conflict, grayscale, visible */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1600&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
        filter: "grayscale(100%) brightness(0.65)",
      }} />

      {/* Left: dark fade so text reads cleanly. Right: photo shows through */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* Subtle red glow at bottom-left */}
      <div className="absolute bottom-0 left-0 z-0 h-64 w-96 bg-red-950/40 blur-[80px]" />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.05]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px" }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 md:px-14">
        <div className="flex items-center gap-3">
          <div className="h-4 w-0.5 bg-red-600" />
          <span className="font-mono text-[11px] tracking-[0.3em] text-zinc-400 uppercase">Krigets Arv</span>
        </div>
        <div className="flex items-center gap-1 border border-zinc-700/60 bg-black/50 backdrop-blur-sm px-3 py-1.5">
          <Link href="/sv" className="px-2 py-0.5 text-[11px] tracking-widest font-bold text-red-500 uppercase">SV</Link>
          <span className="text-zinc-600 text-xs">|</span>
          <Link href="/en" className="px-2 py-0.5 text-[11px] tracking-widest text-zinc-500 hover:text-zinc-200 uppercase transition-colors">EN</Link>
        </div>
      </nav>

      {/* Hero – max half the width so photo breathes on the right */}
      <div className="relative z-20 px-8 md:px-14 pt-6 pb-36 max-w-2xl">

        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-8 bg-red-600" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-red-500 uppercase">Investigativ rapport · 2025–2026</span>
        </div>

        <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            className="text-[clamp(5rem,12vw,10rem)] font-black leading-[0.85] tracking-tight text-white mb-10">
          Krigets<br />
          <span className="relative inline-block text-red-500">
            Arv
            <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-red-600" />
          </span>
        </h1>

        <div className="border-l-2 border-red-700 pl-5 mb-12 max-w-md">
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
            {t("description")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-10 mb-12 border-t border-zinc-800/60 pt-8">
          {[
            { num: "366", label: "Källdokument", sub: "UNICEF · SIPRI · ICRC · HRW" },
            { num: "22 495", label: "Brott mot barn 2024", sub: "FN dokumenterade övergrepp" },
            { num: "+30%", label: "Ökning sedan 2023", sub: "Save the Children" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-3xl font-black text-white tabular-nums leading-none">{s.num}</span>
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider mt-1">{s.label}</span>
              <span className="text-[10px] text-zinc-600 font-mono">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <Link href="/sv/explore" className="group inline-flex items-center gap-3 bg-red-700 hover:bg-red-600 text-white text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 transition-all hover:shadow-[0_0_24px_rgba(185,28,28,0.5)]">
            {t("cta")} <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link href="/sv/investigate" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:text-white border border-zinc-600 hover:border-zinc-400 px-6 py-4 bg-black/30 backdrop-blur-sm transition-all">
            AI-Utredaren
          </Link>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-zinc-800/80 bg-black/70 backdrop-blur-md">
        <div className="flex items-stretch divide-x divide-zinc-800/80">
          {[
            { href: "/sv/explore", label: "Utforska", desc: "Interaktiv karta" },
            { href: "/sv/investigate", label: "Utred", desc: "AI-utredaren" },
            { href: "/sv/perspectives", label: "Perspektiv", desc: "Rollspelsläget" },
            { href: "/sv/factbank", label: "Faktabank", desc: "Citat & data" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-4 px-2 hover:bg-zinc-900/50 transition-colors group">
              <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">{item.label}</span>
              <span className="text-[9px] text-zinc-700 font-mono mt-0.5">{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
