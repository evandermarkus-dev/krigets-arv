# Krigets Arv — The Legacy of War

**En investigativ webbapp om hur väpnade konflikter drabbar barn.** Krigets Arv kombinerar en interaktiv konfliktkarta, en AI-utredare som svarar med källhänvisningar från humanitära organisationer och fredsforskning, rollspelsperspektiv och en faktabank — för journalister, lärare, NGO-forskare och engagerade medborgare.

🔗 **Live:** [krigets-arv.vercel.app](https://krigets-arv.vercel.app) · Svenska och engelska

---

## Funktioner

| Sida | Vad den gör |
|---|---|
| **Explore** | Mapbox-karta över aktiva konfliktzoner (Jemen, Gaza, Ukraina, Sudan, Sydsudan, Syrien, Myanmar, DR Kongo, Etiopien, Somalia, Sahel, Libanon m.fl.). Statistiken hämtas live från databasen och nya konflikter kan läggas till via admin utan koddeploy. |
| **Investigate** | AI-utredare (Claude Sonnet 4.6) med RAG mot en vektordatabas av indexerade källdokument. Svar strömmas med källhänvisningar, i kompakt (snabba fakta) eller utförligt läge (strukturerad analys). |
| **Perspectives** | Rollspel med sex karaktärer — ett barn i Gaza, en FN-diplomat, en vapenlobbyist, en MSF-läkare, en före detta barnsoldat och en lärare i Ukraina. Karaktärerna kan själva slå upp verifierade fakta i källdatabasen via tool calling. |
| **Factbank** | Drygt hundra verifierade statistikuppgifter med källattribution, filtrerbara per kategori. |

## Källor

Innehållet är begränsat till ett kuraterat urval betrodda domäner (definierade i `src/config/sources.ts`), bland annat UNICEF, SIPRI, ICRC, Save the Children, FN-organ, Human Rights Watch, ReliefWeb och OHCHR. Inga slumpmässiga webbsidor används som källor.

## Arkitektur

```
                    ┌────────────── Vercel Cron (veckovis) ──────────────┐
                    ▼                                                    │
  Firecrawl ──► chunkning (800 tecken, 120 overlap) ──► OpenAI embeddings ─┐
                                                                         ▼
                                                     Supabase Postgres + pgvector
                                                     (documents, document_chunks,
                                                      conflict_stats, conflict_meta)
                                                                         │
  Användarfråga ──► RAG-middleware (AI SDK) ── vektorsökning ◄───────────┘
                     │   └─ fallback: live-sökning via Firecrawl
                     ▼
              Claude Sonnet 4.6 ──► strömmat svar med källor
```

**Robusthet**

- **Circuit breaker** runt pgvector och Firecrawl — tre fel öppnar kretsen i 30 sekunder och appen faller tillbaka i stället för att hänga
- **RAG-deadline** på 1,2 sekunder så att långsam sökning aldrig blockerar svaret
- **Svarscache** i Upstash Redis (10 min), nyckad per fråga, läge, språk och karaktär
- **Rate limiting** per IP + User-Agent-hash; både limiter och cache failar öppet om Redis är nere
- **`/api/health`** kontrollerar databas, Redis och RAG-konfiguration

**Datauppdatering**

- `/api/firecrawl/[conflictId]` — schemalagd crawl av konfliktspecifika källor (Vercel Cron)
- `/api/admin/ingest` — indexera en enskild URL eller seeda alla primärkällor
- `/api/admin/refresh-conflicts` — uppdatera konfliktstatistik via pgvector + Claude
- `/api/admin/discover-conflicts` — låt Claude föreslå nya pågående konflikter

Alla admin- och cron-routes kräver `Authorization: Bearer <CRON_SECRET>`. Ett enkelt admingränssnitt finns på `/admin`.

## Projektstruktur

```
src/
├── app/
│   ├── [locale]/           # explore, investigate, perspectives, factbank (sv/en)
│   ├── admin/              # adminpanel
│   └── api/                # investigate, perspectives, conflicts, health, admin/*, firecrawl/*
├── config/
│   ├── prompts.ts          # systemprompter
│   └── sources.ts          # betrodda källdomäner med typ och prioritet
├── data/                   # basdata för konflikter och faktabank
├── lib/                    # RAG-middleware, embeddings, ingestion, circuit breaker, cache, ratelimit
└── i18n/                   # next-intl-konfiguration
supabase/migrations/        # RLS-policies
```

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Vercel AI SDK 6 · Claude Sonnet 4.6 · OpenAI `text-embedding-3-small` · Supabase (Postgres + pgvector) · Firecrawl · Upstash Redis · Mapbox GL · next-intl · Vercel

## Kom igång

```bash
git clone https://github.com/evandermarkus-dev/krigets-arv.git
cd krigets-arv
npm install
# skapa .env.local med variablerna nedan
npm run dev   # http://localhost:3000
```

### Miljövariabler

| Variabel | Användning |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (krävs) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Kartan (krävs — begränsa till din domän i Mapbox) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Databas och vektorsökning |
| `OPENAI_API_KEY` | Embeddings (utan nyckel hoppas RAG över) |
| `FIRECRAWL_API_KEY` | Ingestion och live-sökning |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting och cache (valfritt lokalt) |
| `CRON_SECRET` | Skyddar admin- och cron-routes |

Supabase krävs för API-routerna (klienten kastar fel vid uppstart om variablerna saknas). OpenAI, Firecrawl och Redis är valfria — utan dem hoppas RAG, live-sökning, cache och rate limiting över.

## Licens

Privat projekt. Kontakta mig om du vill använda innehållet eller koden.

## Skapad av

**Markus** — [Evander AI Consulting](https://evander.ai) · [GitHub](https://github.com/evandermarkus-dev)
