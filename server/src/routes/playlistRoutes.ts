import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { validateProxyUrl } from '../middleware/validateUrl.js'
import { fetchRemotePlaylist } from '../services/playlistService.js'

const router = Router()

router.post('/playlist/fetch', rateLimit(), validateProxyUrl, async (req, res) => {
  const { url } = req.body as { url: string }

  try {
    const { content, fileName } = await fetchRemotePlaylist(url)
    res.json({ content, fileName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch playlist'
    res.status(502).json({ error: message })
  }
})

export default router
