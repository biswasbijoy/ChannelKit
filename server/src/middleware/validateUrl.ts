import type { Request, Response, NextFunction } from 'express'
import net from 'net'

const BLOCKED_IPS = new Set([
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'localhost',
])

const PRIVATE_RANGES = [
  { prefix: '10.', prefixLen: 3 },
  { prefix: '172.16.', prefixLen: 7 },
  { prefix: '172.17.', prefixLen: 7 },
  { prefix: '172.18.', prefixLen: 7 },
  { prefix: '172.19.', prefixLen: 7 },
  { prefix: '172.20.', prefixLen: 7 },
  { prefix: '172.21.', prefixLen: 7 },
  { prefix: '172.22.', prefixLen: 7 },
  { prefix: '172.23.', prefixLen: 7 },
  { prefix: '172.24.', prefixLen: 7 },
  { prefix: '172.25.', prefixLen: 7 },
  { prefix: '172.26.', prefixLen: 7 },
  { prefix: '172.27.', prefixLen: 7 },
  { prefix: '172.28.', prefixLen: 7 },
  { prefix: '172.29.', prefixLen: 7 },
  { prefix: '172.30.', prefixLen: 7 },
  { prefix: '172.31.', prefixLen: 7 },
  { prefix: '192.168.', prefixLen: 8 },
]

function isPrivateIp(hostname: string): boolean {
  if (BLOCKED_IPS.has(hostname)) return true
  if (net.isIPv6(hostname)) return true
  return PRIVATE_RANGES.some((range) =>
    hostname.startsWith(range.prefix),
  )
}

export function validateProxyUrl(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "url" in request body' })
    return
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    res.status(400).json({ error: 'Invalid URL format' })
    return
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'Only http/https URLs are allowed' })
    return
  }

  if (isPrivateIp(parsed.hostname)) {
    res.status(403).json({ error: 'Access to private/internal IPs is blocked' })
    return
  }

  next()
}
