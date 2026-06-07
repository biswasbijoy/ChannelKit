import { Router } from 'express'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../../data')

const router = Router()

router.get('/public/demo', (_req, res) => {
  try {
    const filePath = resolve(DATA_DIR, 'SomoyTV.m3u')
    const content = readFileSync(filePath, 'utf-8')
    res.json({ content, fileName: 'SomoyTV.m3u' })
  } catch (err) {
    console.error('Read demo channel error:', err)
    res.status(404).json({ error: 'Demo channel not found' })
  }
})

export default router
