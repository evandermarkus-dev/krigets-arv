import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "nav" });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06050a]">

      {/* Background photo – child from behind looking at a landscape/horizon.
          ┌─ BYTA BILD: Gå till https://unsplash.com/s/photos/child-alone-landscape
          │  Välj ett foto, klicka "Download free" → kopiera bildens adress → klistra in nedan.
          └─ Bra sökord: "child alone field", "child back horizon", "lonely child landscape" */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url('/hero.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "62% 38%",
        filter: "grayscale(85%) brightness(0.50) sepia(15%)",
      }} />

      {/* Left panel: hard dark for text legibility */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/98 via-black/80 to-black/10" />
      {/* Top fade */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      {/* Bottom: warm amber glow — suggests dusk/horizon */}
      <div className="absolute bottom-0 left-0 right-0 z-0 h-72 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 z-0 h-48 w-[60%] bg-gradient-to-r from-amber-950/20 to-transparent blur-[60px]" />

      {/* Grain – ger filmisk textur */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px" }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 md:px-14">
        <div className="flex items-center gap-3">
          <div className="h-4 w-0.5 bg-red-600" />
          <span className="font-mono text-[11px] tracking-[0.3em] text-zinc-400 uppercase">Krigets Arv</span>
        </div>
        <div className="flex items-center gap-1 border border-zinc-700/60 bg-black/50 backdrop-blur-sm px-3 py-1.5">
          <Link href="/sv" className={`px-2 py-0.5 text-[11px] tracking-widest font-bold uppercase ${locale === "sv" ? "text-red-500" : "text-zinc-500 hover:text-zinc-200 transition-colors"}`}>SV</Link>
          <span className="text-zinc-600 text-xs">|</span>
          <Link href="/en" className={`px-2 py-0.5 text-[11px] tracking-widest font-bold uppercase ${locale === "en" ? "text-red-500" : "text-zinc-500 hover:text-zinc-200 transition-colors"}`}>EN</Link>
        </div>
      </nav>

      {/* Hero – max half the width so photo breathes on the right */}
      <div className="relative z-20 px-8 md:px-14 pt-6 pb-36 max-w-2xl">

        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-8 bg-red-600" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-red-500 uppercase">{t("badge")}</span>
        </div>

        <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            className="text-[clamp(5rem,12vw,10rem)] font-black leading-[0.85] tracking-tight text-white mb-10">
          {t("h1_line1")}<br />
          <span className="relative inline-block text-red-500">
            {t("h1_line2")}
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
            { num: "366", label: t("stat1_label"), sub: t("stat1_sub") },
            { num: "22 495", label: t("stat2_label"), sub: t("stat2_sub") },
            { num: "+30%", label: t("stat3_label"), sub: t("stat3_sub") },
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
          <Link href={`/${locale}/explore`} className="group inline-flex items-center gap-3 bg-red-700 hover:bg-red-600 text-white text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 transition-all hover:shadow-[0_0_24px_rgba(185,28,28,0.5)]">
            {t("cta")} <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link href={`/${locale}/investigate`} className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:text-white border border-zinc-600 hover:border-zinc-400 px-6 py-4 bg-black/30 backdrop-blur-sm transition-all">
            {t("ai_link")}
          </Link>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-zinc-800/80 bg-black/70 backdrop-blur-md">
        <div className="flex items-stretch divide-x divide-zinc-800/80">
          {[
            { href: `/${locale}/explore`, label: nav("explore") },
            { href: `/${locale}/investigate`, label: nav("investigate") },
            { href: `/${locale}/perspectives`, label: nav("perspectives") },
            { href: `/${locale}/factbank`, label: nav("factbank") },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-4 px-2 hover:bg-zinc-900/50 transition-colors group">
              <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
