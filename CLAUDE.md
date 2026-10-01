# Krigets Arv — CLAUDE.md

## Vad är det här projektet?

**Krigets Arv** (The Legacy of War) är en investigativ webbapplikation som dokumenterar väpnade konflikters konsekvenser för barn globalt. Den kombinerar en konfliktkarta, en RAG-baserad AI-utredare, rollspelsperspektiv och en faktabank.

**Primär målgrupp:** Journalister, lärare, NGO-forskare, engagerade medborgare.
**Live:** https://krigets-arv.vercel.app · **Hosting:** Vercel (inkl. Cron)

## Kommandon

```bash
npm run dev       # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit  # typkontroll
```

---

## Katalogstruktur

```
src/
├── app/
│   ├── [locale]/                     # sv/en
│   │   ├── page.tsx                  # Hem
│   │   ├── explore/page.tsx          # Mapbox-karta, data från /api/conflicts
│   │   ├── investigate/page.tsx      # AI-utredare (useChat, streaming)
│   │   ├── perspectives/page.tsx     # Rollspel, 6 karaktärer (useChat)
│   │   └── factbank/page.tsx         # Faktabank (src/data/facts.ts)
│   ├── admin/page.tsx                # Adminpanel — lösenord = CRON_SECRET
│   └── api/
│       ├── investigate/              # RAG + Claude, streaming
│       ├── perspectives/             # Rollspel + lookupFact-tool, streaming
│       ├── conflicts/                # Basdata + live-statistik + dynamiska konflikter
│       ├── health/                   # DB / Redis / RAG-status
│       ├── firecrawl/[conflictId]/   # Cron-crawl per konflikt
│       └── admin/
│           ├── ingest/               # Indexera URL eller seeda primärkällor
│           ├── refresh-conflicts/    # Uppdatera conflict_stats via pgvector + Claude
│           └── discover-conflicts/   # Claude föreslår nya konflikter → conflict_meta
├── config/
│   ├── prompts.ts                    # BASE_PROMPT, investigate-tillägg, ROLE_PROMPTS, MONOLOGUE_TRIGGERS
│   └── sources.ts                    # TRUSTED_SOURCES (domän, typ, prioritet 1–3)
├── data/
│   ├── conflicts.ts                  # Baskonflikter sv/en (mergas med DB i /api/conflicts)
│   └── facts.ts                      # Faktabank sv/en
├── lib/
│   ├── rag-middleware.ts             # AI SDK-middleware: pgvector → fallback Firecrawl
│   ├── embeddings.ts                 # OpenAI text-embedding-3-small
│   ├── ingestion.ts                  # Firecrawl scrape → chunk (800/120) → embed → DB
│   ├── conflict-updater.ts           # Genererar konfliktstatistik ur källor
│   ├── firecrawl.ts                  # Domänbegränsad sökning (prio-1 först)
│   ├── circuit-breaker.ts            # withBreaker(name, fn, fallback)
│   ├── response-cache.ts             # Upstash-cache för AI-svar
│   ├── ratelimit.ts                  # Upstash, IP + UA-hash
│   ├── logger.ts                     # Strukturerad JSON-loggning
│   ├── supabase.ts                   # Re-exporterar typad klient + toVector() + radtyper
│   ├── ui-messages.ts                # Text ur AI SDK 6-meddelanden (parts) + cache-nyckel
│   └── krigets/                      # Typat bibliotek: klient, crawl-jobb, dokument, konflikter
│       └── database.types.ts         # Genererade Supabase-typer
└── i18n/                             # next-intl
messages/{sv,en}.json                 # next-intl-översättningar (de som faktiskt laddas)
supabase/migrations/                  # RLS-policies
vercel.json                           # Cron-schema
```

---

## AI och RAG

- **Modell:** `claude-sonnet-4-6` via Vercel AI SDK 6 (`@ai-sdk/anthropic`) i alla routes
- **Embeddings:** OpenAI `text-embedding-3-small`, sökning via RPC `search_chunks` (pgvector)
- **Investigate:** modellen wrappas med `ragMiddleware` som injicerar källor i varje anrop. pgvector först (deadline 1,2 s), Firecrawl-sökning som fallback. Live-statistik från `conflict_stats` läggs till i systemprompten. Kompakt läge 300 tokens, utförligt 1024.
- **Perspectives:** karaktären har ett `lookupFact`-tool (pgvector → Firecrawl), max 2 steg, 512 tokens. `START_MONOLOGUE` ersätts med lokaliserad trigger från `MONOLOGUE_TRIGGERS`.
- Både pgvector och Firecrawl körs via `withBreaker` — 3 fel öppnar kretsen i 30 s.

## Databas (Supabase)

| Tabell | Innehåll |
|---|---|
| `documents` | Indexerade källdokument (`doc_type` satt = klassificerat) |
| `document_chunks` | Chunks med embeddings |
| `conflict_meta` | Dynamiska konflikter tillagda via admin (`active`) |
| `conflict_stats` | Live-statistik per konflikt och locale |
| `conflict_documents` | Koppling dokument ↔ konflikt |
| `conflict_events` | Händelser per konflikt |
| `firecrawl_jobs` | Jobbspårning för crawls |

All skrivning sker server-side med service role. RLS tillåter enbart publik läsning (se migrationen).

## Säkerhet

- **Systemprompter litas aldrig på från klienten.** Perspectives skickar `roleId`; servern slår upp prompten i `ROLE_PROMPTS` och avvisar okända roller (400).
- Admin- och cron-routes kräver `Authorization: Bearer <CRON_SECRET>`. Vercel Cron skickar headern automatiskt.
- Rate limits: investigate 30/min, perspectives 40/min per IP+UA. Limiter och cache failar öppet om Redis är nere.
- `NEXT_PUBLIC_MAPBOX_TOKEN` är publik — begränsa den till domänen i Mapbox.

## Internationalisering

- `next-intl` v4, locales `sv` (default) och `en`, URL-baserat (`/sv/...`, `/en/...`)
- `middleware.ts` exkluderar `api`, `admin` och statiska filer
- Feature-sidorna har egna `UI = { sv, en }`-objekt i stället för `t("key")`
- `src/i18n/request.ts` laddar `messages/` i roten

## Miljövariabler

```env
ANTHROPIC_API_KEY=            # krävs
NEXT_PUBLIC_MAPBOX_TOKEN=     # krävs (karta)
SUPABASE_URL=                 # krävs — supabase-klienterna kastar fel vid modul-load om de saknas
SUPABASE_SERVICE_ROLE_KEY=    # krävs, endast server
OPENAI_API_KEY=               # embeddings; saknas → RAG hoppas över
FIRECRAWL_API_KEY=            # ingestion + live-sökning; saknas → returnerar []
UPSTASH_REDIS_REST_URL=       # rate limit + cache; saknas → avstängt
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=                  # admin/cron-auth + adminpanelens lösenord
```

`src/instrumentation.ts` läser `.env.local` vid start och skriver över systemvariabler — endast relevant lokalt.

---

## Kodkonventioner

- Allt nytt innehåll (fakta, konflikter) ska ha specificerad källa: `[Källa: Organisation, år]`
- Data hör hemma i `src/data/`, systemprompter i `src/config/prompts.ts`, inte i routes eller klientkomponenter
- Nya källdomäner läggs till i `src/config/sources.ts` med typ och prioritet
- Externa beroenden (DB, Firecrawl, Redis) ska wrappas så att fel degraderar funktionen i stället för att ge 500
- Ny DB-kod skrivs mot det typade `src/lib/krigets/`-biblioteket. Skicka embeddings via `toVector()` (genererade typer säger `string` för pgvector)
- Läs aldrig `message.content` i API-routes — AI SDK 6 skickar text i `parts`. Använd `messageText()` / `conversationCacheText()` från `lib/ui-messages.ts`

## Kända lösa trådar

- Kunskapsdatabasen är i praktiken tom: `documents` innehåller bara 7 startsidor (seed, april 2026), inga är klassificerade, och `firecrawl_jobs` har 0 rader — cron-crawlarna har aldrig skrivit något. RAG faller därför nästan alltid tillbaka på Firecrawl-sökning.
- Ange aldrig ett hårdkodat antal källdokument i UI eller prompt — räkna dynamiskt eller utelämna
