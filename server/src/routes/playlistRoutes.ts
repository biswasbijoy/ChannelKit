import { Router } from 'express'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { rateLimit } from '../middleware/rateLimit.js'
import { validateProxyUrl } from '../middleware/validateUrl.js'
import { authenticate } from '../middleware/auth.js'
import { Playlist } from '../models/Playlist.js'
import { fetchRemotePlaylist } from '../services/playlistService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PLAYLIST_PATH = resolve(__dirname, '../../data/bd.m3u')

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

router.get('/playlists/default', authenticate, async (_req, res) => {
  try {
    const content = readFileSync(DEFAULT_PLAYLIST_PATH, 'utf-8')
    res.json({ content, fileName: 'bd.m3u' })
  } catch (err) {
    console.error('Read default playlist error:', err)
    res.status(500).json({ error: 'Failed to load default playlist' })
  }
})

router.get('/playlists', authenticate, async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user!.userId as any })
      .select('name source fileName importedAt')
      .sort({ importedAt: -1 })
    res.json(playlists)
  } catch (err) {
    console.error('List playlists error:', err)
    res.status(500).json({ error: 'Failed to fetch playlists' })
  }
})

router.get('/playlists/:id', authenticate, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id as any, userId: req.user!.userId as any })
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }
    res.json(playlist)
  } catch (err) {
    console.error('Get playlist error:', err)
    res.status(500).json({ error: 'Failed to fetch playlist' })
  }
})

router.post('/playlists', authenticate, async (req, res) => {
  const { name, channels, source, fileName } = req.body

  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    res.status(400).json({ error: 'channels array is required' })
    return
  }

  try {
    const playlist = await Playlist.create({
      userId: req.user!.userId,
      name: name ?? 'Imported Playlist',
      channels,
      source: source ?? 'file',
      fileName,
    })
    res.status(201).json({ id: playlist._id.toString(), name: playlist.name, importedAt: playlist.importedAt })
  } catch (err) {
    console.error('Create playlist error:', err)
    res.status(500).json({ error: 'Failed to save playlist' })
  }
})

router.delete('/playlists/:id', authenticate, async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id as any, userId: req.user!.userId as any })
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }
    res.json({ message: 'Playlist deleted' })
  } catch (err) {
    console.error('Delete playlist error:', err)
    res.status(500).json({ error: 'Failed to delete playlist' })
  }
})

export default router
