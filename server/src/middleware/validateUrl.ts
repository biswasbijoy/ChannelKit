import type { Request, Response, NextFunction } from 'express'
import net from 'net'

const BLOCKED_IPS = new Set([
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'localhost',
])

const PRIVATE_PREFIXES = [
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  // Link-local, including cloud instance metadata endpoints (169.254.169.254 etc.)
  '169.254.',
]

function isPrivateIp(hostname: string): boolean {
  if (BLOCKED_IPS.has(hostname)) return true
  if (net.isIPv6(hostname)) return true
  return PRIVATE_PREFIXES.some((prefix) => hostname.startsWith(prefix))
}

export function validateProxyUrl(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const url = req.method === 'GET' ? req.query.url : req.body?.url

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "url" parameter' })
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
