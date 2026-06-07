import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { Settings } from '../models/Settings.js'

const router = Router()

router.get('/settings', authenticate, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user!.userId as any })
    if (!settings) {
      settings = await Settings.create({ userId: req.user!.userId as any })
    }
    res.json({ volume: settings.volume, muted: settings.muted })
  } catch (err) {
    console.error('Get settings error:', err)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

router.put('/settings', authenticate, async (req, res) => {
  const { volume, muted } = req.body

  if (volume !== undefined && (typeof volume !== 'number' || volume < 0 || volume > 1)) {
    res.status(400).json({ error: 'volume must be a number between 0 and 1' })
    return
  }

  if (muted !== undefined && typeof muted !== 'boolean') {
    res.status(400).json({ error: 'muted must be a boolean' })
    return
  }

  try {
    const update: Record<string, unknown> = {}
    if (volume !== undefined) update.volume = volume
    if (muted !== undefined) update.muted = muted

    const result = await Settings.findOneAndUpdate(
      { userId: req.user!.userId as any },
      { $set: update },
      { new: true, upsert: true },
    )
    if (!result) {
      res.status(500).json({ error: 'Failed to update settings' })
      return
    }
    res.json({ volume: result.volume, muted: result.muted })
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
