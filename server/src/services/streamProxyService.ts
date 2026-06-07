import type { Request, Response } from 'express'

const PROXY_TIMEOUT_MS = 30_000

export async function proxyStream(req: Request, res: Response) {
  const { url } = req.body as { url: string }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)

    const response = await fetch(url, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
        'User-Agent': 'IPTV-Player/1.0',
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

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    const contentRange = response.headers.get('content-range')
    if (contentRange) {
      res.setHeader('Content-Range', contentRange)
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
