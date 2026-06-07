import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 30

export function rateLimit(
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    let entry = store.get(key)

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(key, entry)
    }

    entry.count++

    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)))
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please slow down.' })
      return
    }

    next()
  }
}
