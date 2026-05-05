import { NextRequest, NextResponse } from "next/server"
import { runConflictBatch, type BatchInput } from "@/lib/krigets/firecrawl"

// Crawl-jobb kan ta upp till 5 minuter — sätt maxDuration till Vercels default-tak
export const maxDuration = 300

// ISO2-koder och OHCHR-sluggar per konflikt-ID
// Utöka listan när fler konflikter ska täckas
const CONFLICT_SOURCES: Record<string, BatchInput["sources"]> = {
  "tigray-ethiopia": [
    {
      domain: "reliefweb.int",
      urlPattern: "https://reliefweb.int/country/et",
      crawlMode: "crawl",
      includePaths: ["/country/et"],
    },
    {
      domain: "ohchr.org",
      urlPattern: "https://www.ohchr.org/en/countries/ethiopia",
      crawlMode: "crawl",
      includePaths: ["/en/countries/ethiopia"],
    },
  ],
  "haiti-gang-violence": [
    {
      domain: "reliefweb.int",
      urlPattern: "https://reliefweb.int/country/ht",
      crawlMode: "crawl",
      includePaths: ["/country/ht"],
    },
    {
      domain: "ohchr.org",
      urlPattern: "https://www.ohchr.org/en/countries/haiti",
      crawlMode: "crawl",
      includePaths: ["/en/countries/haiti"],
    },
  ],
  "mozambique-cabo": [
    {
      domain: "reliefweb.int",
      urlPattern: "https://reliefweb.int/country/mz",
      crawlMode: "crawl",
      includePaths: ["/country/mz"],
    },
    {
      domain: "ohchr.org",
      urlPattern: "https://www.ohchr.org/en/countries/mozambique",
      crawlMode: "crawl",
      includePaths: ["/en/countries/mozambique"],
    },
  ],
}

const KNOWN_CONFLICTS = new Set(Object.keys(CONFLICT_SOURCES))

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  // Bearer-auth: Vercel cron skickar "Authorization: Bearer <CRON_SECRET>" automatiskt
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conflictId } = await params

  if (!KNOWN_CONFLICTS.has(conflictId)) {
    return NextResponse.json(
      { error: `Okänd konflikt: ${conflictId}. Kända: ${[...KNOWN_CONFLICTS].join(", ")}` },
      { status: 404 },
    )
  }

  const sources = CONFLICT_SOURCES[conflictId]
  console.log(`[firecrawl-batch] Startar ${sources.length} jobb för ${conflictId}`)

  try {
    const results = await runConflictBatch({ conflictId, sources }, { concurrency: 2 })

    const summary = {
      conflictId,
      jobs: results.length,
      succeeded: results.filter((r) => r.status === "succeeded").length,
      failed: results.filter((r) => r.status === "failed").length,
      totalDocuments: results.reduce((sum, r) => sum + r.documentsInserted, 0),
      totalPages: results.reduce((sum, r) => sum + r.pagesScraped, 0),
    }

    console.log(`[firecrawl-batch] Klart för ${conflictId}:`, summary)
    return NextResponse.json({ ok: true, ...summary, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[firecrawl-batch] Oväntat fel för ${conflictId}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
