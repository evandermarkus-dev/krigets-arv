/**
 * Firecrawl-klient med jobspårning i firecrawl_jobs.
 * Använder Firecrawl v2 API (default-export): scrape / crawl / map.
 *
 * Användning:
 *   const results = await runConflictBatch({
 *     conflictId: 'tigray-ethiopia',
 *     sources: [
 *       { domain: 'reliefweb.int', urlPattern: 'https://reliefweb.int/country/et', crawlMode: 'crawl' },
 *       { domain: 'ohchr.org', urlPattern: 'https://www.ohchr.org/en/countries/ethiopia', crawlMode: 'crawl' },
 *     ],
 *   })
 */

import Firecrawl from "@mendable/firecrawl-js"
import { getServiceClient } from "./supabase"
import { upsertDocument } from "./documents"
import { linkDocumentToConflict } from "./conflicts"
import type { CrawlMode, JobStatus } from "./database.types"

// =============================================================================
// Singleton
// =============================================================================

let _firecrawl: Firecrawl | null = null

function getFirecrawl(): Firecrawl {
  if (_firecrawl) return _firecrawl
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY saknas")
  _firecrawl = new Firecrawl({ apiKey })
  return _firecrawl
}

// =============================================================================
// Public API
// =============================================================================

export interface CrawlJobInput {
  sourceDomain: string
  conflictId?: string | null
  urlPattern: string
  crawlMode: CrawlMode
  maxDepth?: number
  includePaths?: string[]
  excludePaths?: string[]
}

export interface CrawlJobResult {
  jobId: string
  status: JobStatus
  pagesScraped: number
  pagesFailed: number
  documentsInserted: number
  errorMessage?: string
}

export async function runCrawlJob(input: CrawlJobInput): Promise<CrawlJobResult> {
  const job = await createJob(input)
  try {
    const result = await executeJob(input)
    await markJobSuccess(job.id, result)
    return { jobId: job.id, status: "succeeded", ...result }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markJobFailure(job.id, message)
    return {
      jobId: job.id,
      status: "failed",
      pagesScraped: 0,
      pagesFailed: 0,
      documentsInserted: 0,
      errorMessage: message,
    }
  }
}

// =============================================================================
// Jobbets livscykel
// =============================================================================

async function createJob(input: CrawlJobInput) {
  const client = getServiceClient()
  const { data, error } = await client
    .from("firecrawl_jobs")
    .insert({
      source_domain: input.sourceDomain,
      conflict_id: input.conflictId ?? null,
      url_pattern: input.urlPattern,
      crawl_mode: input.crawlMode,
      max_depth: input.maxDepth ?? 2,
      include_paths: input.includePaths ?? [],
      exclude_paths: input.excludePaths ?? [],
      status: "running",
    })
    .select()
    .single()
  if (error) throw new Error(`createJob: ${error.message}`)
  return data
}

interface ExecutionResult {
  pagesScraped: number
  pagesFailed: number
  documentsInserted: number
}

interface ScrapedPage {
  url: string
  title: string
  markdown: string
  metadata: Record<string, unknown>
}

async function executeJob(input: CrawlJobInput): Promise<ExecutionResult> {
  const fc = getFirecrawl()
  let pages: ScrapedPage[] = []
  let pagesFailed = 0

  if (input.crawlMode === "scrape") {
    // Firecrawl v2: scrape() kastar vid fel, returnerar Document direkt
    const result = await fc.scrape(input.urlPattern, { formats: ["markdown"] })
    pages = [
      {
        url: input.urlPattern,
        title: result.metadata?.title ?? input.urlPattern,
        markdown: result.markdown ?? "",
        metadata: (result.metadata ?? {}) as Record<string, unknown>,
      },
    ]
  } else if (input.crawlMode === "crawl") {
    // Firecrawl v2: crawl() väntar på completion och returnerar CrawlJob
    const result = await fc.crawl(input.urlPattern, {
      limit: 100,
      maxDiscoveryDepth: input.maxDepth ?? 2,
      includePaths: input.includePaths ?? null,
      excludePaths: input.excludePaths ?? null,
      scrapeOptions: { formats: ["markdown"] },
    })
    if (result.status === "failed") {
      throw new Error(`crawl misslyckades för ${input.urlPattern}`)
    }
    pages = (result.data ?? []).map((p) => ({
      url: p.metadata?.sourceURL ?? p.metadata?.url ?? input.urlPattern,
      title: p.metadata?.title ?? "",
      markdown: p.markdown ?? "",
      metadata: (p.metadata ?? {}) as Record<string, unknown>,
    }))
  } else {
    // map: URL-discovery, inget sidinnehåll
    const result = await fc.map(input.urlPattern)
    return { pagesScraped: result.links?.length ?? 0, pagesFailed: 0, documentsInserted: 0 }
  }

  // Skriv pages till documents
  let inserted = 0
  for (const page of pages) {
    if (!page.url || !page.markdown) {
      pagesFailed += 1
      continue
    }
    try {
      const doc = await upsertDocument({
        url: page.url,
        title: page.title || page.url,
        sourceName: humanizeSource(input.sourceDomain),
        domain: input.sourceDomain,
        publishedDate: parsePublishedDate(page.metadata),
        metadata: page.metadata,
      })
      if (input.conflictId) {
        await linkDocumentToConflict({
          conflictId: input.conflictId,
          documentId: doc.id,
          relevanceScore: 1.0,
          taggedBy: "crawl_target",
        })
      }
      inserted += 1
    } catch (err) {
      console.warn(`[firecrawl] Kunde inte skriva ${page.url}:`, err)
      pagesFailed += 1
    }
  }

  return { pagesScraped: pages.length, pagesFailed, documentsInserted: inserted }
}

async function markJobSuccess(jobId: string, result: ExecutionResult) {
  const client = getServiceClient()
  await client
    .from("firecrawl_jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      pages_scraped: result.pagesScraped,
      pages_failed: result.pagesFailed,
      documents_inserted: result.documentsInserted,
    })
    .eq("id", jobId)
}

async function markJobFailure(jobId: string, errorMessage: string) {
  const client = getServiceClient()
  await client
    .from("firecrawl_jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", jobId)
}

// =============================================================================
// Hjälpare
// =============================================================================

const SOURCE_NAMES: Record<string, string> = {
  "hrw.org": "Human Rights Watch",
  "icrc.org": "ICRC – Internationella Rödakorskommittén",
  "ohchr.org": "OHCHR – FN:s råd för mänskliga rättigheter",
  "sipri.org": "SIPRI",
  "savethechildren.org": "Save the Children",
  "unicef.org": "UNICEF",
  "reliefweb.int": "ReliefWeb (OCHA)",
  "childrenandarmedconflict.un.org": "UN Children and Armed Conflict",
  "acleddata.com": "ACLED",
}

function humanizeSource(domain: string): string {
  return SOURCE_NAMES[domain] ?? domain.replace(/^www\./, "")
}

function parsePublishedDate(metadata: Record<string, unknown>): string | null {
  const candidates = [
    metadata["article:published_time"],
    metadata["publishedTime"],
    metadata["datePublished"],
    metadata["date"],
  ]
  for (const c of candidates) {
    if (typeof c === "string") {
      const d = new Date(c)
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    }
  }
  return null
}

// =============================================================================
// Batch-körning
// =============================================================================

export interface BatchInput {
  conflictId: string
  sources: Array<{
    domain: string
    urlPattern: string
    crawlMode?: CrawlMode
    includePaths?: string[]
    excludePaths?: string[]
  }>
}

const DEFAULT_EXCLUDE = [
  "/donate",
  "/donate/*",
  "/about",
  "/jobs",
  "/contact",
  "/legal",
  "/cookies",
  "/newsletter",
  "/login",
  "/search",
]

/** Kör flera scrapejobb parallellt med begränsad concurrency. */
export async function runConflictBatch(
  input: BatchInput,
  options: { concurrency?: number } = {},
): Promise<CrawlJobResult[]> {
  const { concurrency = 3 } = options
  const results: CrawlJobResult[] = []
  const queue = [...input.sources]

  async function worker() {
    while (queue.length > 0) {
      const source = queue.shift()
      if (!source) return
      const result = await runCrawlJob({
        sourceDomain: source.domain,
        conflictId: input.conflictId,
        urlPattern: source.urlPattern,
        crawlMode: source.crawlMode ?? "crawl",
        maxDepth: 2,
        includePaths: source.includePaths,
        excludePaths: source.excludePaths ?? DEFAULT_EXCLUDE,
      })
      results.push(result)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}
