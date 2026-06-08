import type { Request, Response } from 'express'
import { URL } from 'url'

const PROXY_TIMEOUT_MS = 30_000
const M3U8_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegurl', 'audio/mpegurl', 'audio/x-mpegurl']
const API_BASE = '/api/proxy/stream?url='

function isM3u8Content(contentType: string | null, url: string): boolean {
  if (contentType && M3U8_TYPES.some((t) => contentType.includes(t))) return true
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  return path.endsWith('.m3u8') || path.endsWith('.m3u')
}

function resolveUrl(base: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href
  } catch {
    return maybeRelative
  }
}

function rewriteM3u8(body: string, baseUrl: string): string {
  const lines = body.split('\n')
  const rewritten = lines.map((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('#EXT-X-KEY:')) {
      return trimmed.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
        const resolved = resolveUrl(baseUrl, uri)
        const encoded = encodeURIComponent(resolved)
        return `URI="${API_BASE}${encoded}"`
      })
    }

    if (trimmed.startsWith('#')) return line

    if (trimmed === '') return line

    const resolved = resolveUrl(baseUrl, trimmed)
    const encoded = encodeURIComponent(resolved)
    return `${API_BASE}${encoded}`
  })
  return rewritten.join('\n')
}

export async function proxyStream(req: Request, res: Response) {
  const rawUrl = (req.query.url as string) || (req.body?.url as string)

  if (!rawUrl) {
    res.status(400).json({ error: 'Missing "url" parameter' })
    return
  }

  let parsedUrl: string
  try {
    parsedUrl = decodeURIComponent(rawUrl)
    new URL(parsedUrl)
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)

    const origin = new URL(parsedUrl).origin

    const response = await fetch(parsedUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': origin + '/',
        'Accept': '*/*',
        ...(req.headers.range ? { Range: req.headers.range as string } : {}),
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok && response.status !== 206) {
      res.status(response.status).json({
        error: `Upstream server responded with ${response.status}`,
      })
      return
    }

    const contentType = response.headers.get('content-type')

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    if (isM3u8Content(contentType, parsedUrl)) {
      const body = await response.text()
      const rewritten = rewriteM3u8(body, parsedUrl)
      res.setHeader('Content-Length', Buffer.byteLength(rewritten, 'utf-8').toString())
      res.status(response.status === 206 ? 206 : 200)
      res.send(rewritten)
      return
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    const contentRange = response.headers.get('content-range')
    if (contentRange) {
      res.setHeader('Content-Range', contentRange)
    }

    const acceptRanges = response.headers.get('accept-ranges')
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges)
    }

    if (response.status === 206) {
      res.status(206)
    }

    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            res.end()
            return
          }
          res.write(value)
        }
      }
      pump().catch((err) => {
        if (!res.headersSent) {
          res.status(502).json({ error: 'Stream error' })
        }
      })
    } else {
      res.end()
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      res.status(504).json({ error: 'Upstream timeout' })
      return
    }
    res.status(502).json({ error: 'Failed to fetch upstream stream' })
  }
}
