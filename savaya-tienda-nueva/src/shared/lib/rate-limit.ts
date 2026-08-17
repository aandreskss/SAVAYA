// ---------------------------------------------------------------------------
// Rate limiting — Upstash Redis wrapper with graceful fallback for development
// ---------------------------------------------------------------------------
// In development without Upstash configured (no UPSTASH_REDIS_REST_URL env var),
// all rate limit checks pass transparently. In production, Upstash enforces limits.
// If Upstash is unreachable in production, we fail OPEN (allow the request) and log
// the error — crashing the app on a Redis timeout would be worse than missing a limit.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Factory — returns undefined when env vars are not set (dev / CI without Upstash)
// ---------------------------------------------------------------------------

function createRateLimiters() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  const redis = Redis.fromEnv()

  return {
    login: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15m'),
      prefix: 'savaya:rl:login',
    }),
    register: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1h'),
      prefix: 'savaya:rl:register',
    }),
    resetPassword: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1h'),
      prefix: 'savaya:rl:reset-password',
    }),
    checkout: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1h'),
      prefix: 'savaya:rl:checkout',
    }),
    orderCreate: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1h'),
      prefix: 'savaya:rl:order-create',
    }),
    upload: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1h'),
      prefix: 'savaya:rl:upload',
    }),
    search: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1m'),
      prefix: 'savaya:rl:search',
    }),
    publicApi: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1m'),
      prefix: 'savaya:rl:public-api',
    }),
  }
}

export type RateLimiterKey = keyof NonNullable<ReturnType<typeof createRateLimiters>>

// Lazily initialized — avoids crashing on import when env vars are absent.
let _limiters: ReturnType<typeof createRateLimiters> = null

function getLimiters() {
  if (_limiters === undefined || _limiters === null) {
    _limiters = createRateLimiters()
  }
  return _limiters
}

// ---------------------------------------------------------------------------
// Exported map — consumers use this for type-safe access
// ---------------------------------------------------------------------------

export const rateLimiters = new Proxy({} as NonNullable<ReturnType<typeof createRateLimiters>>, {
  get(_target, key: string) {
    return getLimiters()?.[key as RateLimiterKey]
  },
})

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Check rate limit for a given identifier (e.g. IP address or userId).
 *
 * - Returns `{ success: true, remaining: 999, reset: 0 }` if Upstash is not configured (dev).
 * - Returns `{ success: true, ... }` and logs the error if Upstash throws (fail open).
 * - In production with Upstash configured, delegates to the Upstash limiter.
 */
export async function checkRateLimit(
  limiterKey: RateLimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true, remaining: 999, reset: 0 }
  }

  const limiter = getLimiters()?.[limiterKey]
  if (!limiter) {
    return { success: true, remaining: 999, reset: 0 }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (err) {
    // Fail open — log the error but don't block the request
    console.error('[rate-limit] Upstash error (fail open):', err)
    return { success: true, remaining: 0, reset: 0 }
  }
}
