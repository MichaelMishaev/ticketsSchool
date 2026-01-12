import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
    blocked: boolean
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(options: {
  windowMs: number
  maxAttempts: number
  blockDurationMs?: number
}) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const key = `${req.nextUrl.pathname}:${ip}`

    const now = Date.now()
    const record = store[key]

    // Check if blocked
    if (record?.blocked && record.resetAt > now) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() }
        }
      )
    }

    // Initialize or reset window
    if (!record || record.resetAt < now) {
      store[key] = {
        count: 1,
        resetAt: now + options.windowMs,
        blocked: false
      }
      return null
    }

    // Increment count
    record.count++

    // Check if limit exceeded
    if (record.count > options.maxAttempts) {
      record.blocked = true
      record.resetAt = now + (options.blockDurationMs || options.windowMs)

      console.warn('[Rate Limit] Account temporarily locked', {
        ip,
        path: req.nextUrl.pathname,
        attempts: record.count
      })

      return NextResponse.json(
        { error: 'יותר מדי ניסיונות. החשבון נעול זמנית.' },
        { status: 429 }
      )
    }

    return null
  }
}
