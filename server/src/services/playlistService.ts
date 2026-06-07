import { validateProxyUrl } from '../middleware/validateUrl.js'

const MAX_PLAYLIST_SIZE = 50 * 1024 * 1024 // 50MB
const FETCH_TIMEOUT_MS = 30_000

export async function fetchRemotePlaylist(url: string): Promise<{
  content: string
  fileName: string
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_PLAYLIST_SIZE) {
      throw new Error('Playlist too large')
    }

    const text = await response.text()

    if (text.length > MAX_PLAYLIST_SIZE) {
      throw new Error('Playlist too large')
    }

    const fileName =
      url.split('/').pop()?.split('?')[0] ?? 'remote-playlist.m3u'

    return { content: text, fileName }
  } finally {
    clearTimeout(timeout)
  }
}
