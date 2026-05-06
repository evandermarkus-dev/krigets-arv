export function log(level: "info" | "warn" | "error", event: Record<string, unknown>): void {
  console[level](JSON.stringify({ ts: new Date().toISOString(), level, ...event }))
}
