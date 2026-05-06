type BreakerState = "closed" | "open" | "half-open"

interface BreakerRecord {
  state: BreakerState
  failures: number
  openedAt: number | null
}

const FAILURE_THRESHOLD = 3
const RESET_MS = 30_000

const breakers: Record<string, BreakerRecord> = {}

function getBreaker(name: string): BreakerRecord {
  if (!breakers[name]) {
    breakers[name] = { state: "closed", failures: 0, openedAt: null }
  }
  return breakers[name]
}

function recordSuccess(b: BreakerRecord) {
  b.failures = 0
  b.state = "closed"
  b.openedAt = null
}

function recordFailure(b: BreakerRecord) {
  b.failures += 1
  if (b.failures >= FAILURE_THRESHOLD) {
    b.state = "open"
    b.openedAt = Date.now()
  }
}

/**
 * Wraps `fn` with a named circuit breaker. Returns `fallback` immediately when
 * the circuit is open, letting the dependency recover without being hammered.
 */
export async function withBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const b = getBreaker(name)

  if (b.state === "open") {
    const elapsed = Date.now() - (b.openedAt ?? 0)
    if (elapsed >= RESET_MS) {
      b.state = "half-open"
    } else {
      return fallback
    }
  }

  try {
    const result = await fn()
    recordSuccess(b)
    return result
  } catch {
    recordFailure(b)
    return fallback
  }
}
