/**
 * Typed Supabase-klient för krigets/-biblioteket.
 *
 * Alla funktioner i krigets/ körs server-side (API routes, cron-jobb).
 * Exporterar en enda service-role-klient — ingen anon-nyckel behövs.
 * Repots befintliga env-variabelnamn används: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Saknad miljövariabel: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

// Typed service-role-klient. Används av alla krigets/-funktioner på servern.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Returnerar service-klienten med browser-guard för skriv-operationer.
 * Funktionen är ett namngivet alias som gör det tydligt att anroparen
 * behöver full åtkomst — och gör det omöjligt att av misstag anropa från klient.
 */
export function getServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServiceClient() får inte anropas i webbläsaren — det skulle exponera service role-nyckeln",
    )
  }
  return supabase
}

// =============================================================================
// Felhantering
// =============================================================================

export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly cause: unknown,
    public readonly hint?: string,
  ) {
    super(message)
    this.name = "SupabaseQueryError"
  }
}

export function unwrap<T>(result: { data: T | null; error: unknown }, ctx: string): T {
  if (result.error) {
    throw new SupabaseQueryError(
      `${ctx}: ${(result.error as Error).message ?? "okänt fel"}`,
      result.error,
    )
  }
  if (result.data === null) {
    throw new SupabaseQueryError(`${ctx}: tomt svar`, null)
  }
  return result.data
}
