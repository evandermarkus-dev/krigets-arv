# Krigets Arv — The Legacy of War

En investigativ webbapplikation om väpnade konflikters konsekvenser för barn globalt. Kombinerar datavisualisering, AI-forskning och rollspelsperspektiv för att synliggöra sambanden mellan geopolitik, vapenhandel och barns lidande.

## Funktioner

- **Explore** — Interaktiv Mapbox-karta med 6 aktiva konfliktzoner (Yemen, Gaza, Ukraina, Sudan, Sydsudan, Syrien)
- **Investigate** — Claude AI-chatbot med 366 verifierade källdokument, kompakt och utförligt läge
- **Perspectives** — Rollspel med tre perspektiv: barn i Gaza, FN-diplomat, vapenlobbyist
- **Factbank** — 15 verifierade statistikkort med källattribution, filtrerbart per kategori

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Mapbox GL · Anthropic Claude API · next-intl (sv/en)

## Kom igång

```bash
npm install
cp .env.example .env.local  # Fyll i ANTHROPIC_API_KEY och NEXT_PUBLIC_MAPBOX_TOKEN
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Miljövariabler

```env
ANTHROPIC_API_KEY=          # Claude API-nyckel (krävs)
NEXT_PUBLIC_MAPBOX_TOKEN=   # Mapbox token — begränsa till domän i Mapbox-dashboard
FIRECRAWL_API_KEY=          # Firecrawl (för framtida källdataingestion)
```

## Källmaterial

Applikationen refererar till 366 källdokument från UNICEF, SIPRI (Stockholm International Peace Research Institute), ICRC (Internationella Rödakorskommittén), Save the Children, FN:s säkerhetsråd och Human Rights Watch.

## Licens

Privat projekt.
