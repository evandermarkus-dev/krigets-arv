# Krigets Arv — CLAUDE.md

## Vad är det här projektet?

**Krigets Arv** (The Legacy of War) är en investigativ webbapplikation som dokumenterar väpnade konflikters konsekvenser för barn globalt. Den kombinerar datavisualisering, AI-forskning och rollspelsperspektiv för att synliggöra sambanden mellan geopolitik, vapenhandel och barns lidande.

**Primär målgrupp:** Journalister, lärare, NGO-forskare, engagerade medborgare.

---

## Katalogstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── investigate/route.ts   # AI-utredarens API (Claude Sonnet)
│   │   └── perspectives/route.ts  # Rollspelsperspektivens API (Claude Sonnet)
│   ├── [locale]/                  # Locale-specifika sidor (sv/en)
│   │   ├── page.tsx               # Hemsida med hero + navigation
│   │   ├── explore/page.tsx       # Interaktiv Mapbox-karta (6 konfliktzoner)
│   │   ├── investigate/page.tsx   # AI-chatbot för forskning
│   │   ├── perspectives/page.tsx  # Rollspel: 3 karaktärer
│   │   └── factbank/page.tsx      # Faktabank med 15 verifierade fakta
│   ├── layout.tsx                 # Root layout (passthrough)
│   └── page.tsx                   # Root redirect → /sv
├── components/ui/                 # shadcn/ui-komponenter
├── i18n/                          # next-intl konfiguration
├── lib/utils.ts                   # cn()-utility
└── messages/
    ├── sv.json                    # Svenska översättningar
    └── en.json                    # Engelska översättningar
```

---

## De 4 huvudsidorna

| Sida | Rutt | Funktion |
|---|---|---|
| Explore | `/[locale]/explore` | Mapbox-karta med 6 konfliktzoner, klickbara markörer med statistik |
| Investigate | `/[locale]/investigate` | Claude AI-chatbot, 2 lägen (kompakt/utförligt), konversationshistorik |
| Perspectives | `/[locale]/perspectives` | Rollspel med 3 karaktärer: barn i Gaza, FN-diplomat, vapenlobbyist |
| Factbank | `/[locale]/factbank` | 15 expanderbara faktakort med källattribution, filtrerbart |

---

## De 2 API-routes

### `POST /api/investigate`
- **Input:** `{ question: string, history: MessageParam[], mode: "compact" | "detailed" }`
- **Output:** `{ answer: string }`
- Använder `BASE_PROMPT` med 366 verifierade fakta inbäddade i systemprompt
- Kompakt läge: max 300 tokens, 3-4 meningar
- Utförligt läge: max 1024 tokens, strukturerad analys

### `POST /api/perspectives`
- **Input:** `{ message: string, systemPrompt: string, history: MessageParam[] }`
- **Output:** `{ answer: string }`
- `systemPrompt` skickas från klienten (rollspecifik prompt definierad i perspectives/page.tsx)
- `message === "START_MONOLOGUE"` triggar karaktärens öppningsmonolog

---

## AI-modell och käll-arkitektur

- **Modell:** `claude-sonnet-4-20250514` via direkt `@anthropic-ai/sdk`
- **Kunskapsbas:** Hårdkodad `BASE_PROMPT` i `api/investigate/route.ts` med statistik från UNICEF, SIPRI, ICRC, Save the Children, FN, HRW
- **OBS:** `@mendable/firecrawl-js` är installerad men ej aktiv — planerad för framtida RAG-implementation

---

## Internationalisering

- **Framework:** `next-intl` v4
- **Locale:** `sv` (primär) och `en`
- **Routing:** URL-baserat (`/sv/...`, `/en/...`)
- **Config:** `src/i18n/routing.ts`, `middleware.ts`
- **OBS:** Feature-sidor (explore, investigate, perspectives, factbank) har fortfarande hårdkodad svensk text — migrering till `t("key")`-mönster är planerat

---

## Miljövariabler

```env
ANTHROPIC_API_KEY=          # Claude API-nyckel (krävs)
NEXT_PUBLIC_MAPBOX_TOKEN=   # Mapbox publikt token (krävs, begränsa till domän i Mapbox-dashboard)
FIRECRAWL_API_KEY=          # Firecrawl (installerad, ej aktiv ännu)
```

---

## Tech stack

| Teknologi | Version | Användning |
|---|---|---|
| Next.js | 15.5 | App Router, API routes |
| React | 19 | UI-komponenter |
| TypeScript | 5 | Typ-säkerhet |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | — | UI-komponentbibliotek |
| Mapbox GL | 3.11 | Interaktiva kartor |
| react-map-gl | 8.0 | React-wrapper för Mapbox |
| next-intl | 4.8 | Internationalisering |
| react-markdown | 10 | Renderar AI-svar |
| @anthropic-ai/sdk | 0.78 | Direkt Claude-integration |

---

## Kodkonventioner

- Allt nytt innehåll (fakta, konflikter) ska citeras med specificerad källa
- Håll `FACTS`-array och `CONFLICTS`-array separerade från rendering-kod (extrahera till `src/data/`)
- Systempromptar hör hemma i `src/config/prompts.ts`, inte i route-handlers
- Alla statistikuppgifter måste ha källhänvisning: `[Källa: Organisation, år]`

---

## Planerade förbättringar (se plans/serene-tickling-rose.md)

- Migrera till Vercel AI SDK v6 med streaming
- Rate limiting på AI-routes (Upstash)
- Sökbara källdokument via Firecrawl
- Faktabanken expanderad till 50+ fakta
- Fler rollspelsperspektiv
