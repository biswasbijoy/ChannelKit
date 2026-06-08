import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { validateProxyUrl } from '../middleware/validateUrl.js'
import { proxyStream } from '../services/streamProxyService.js'

const router = Router()

router.get('/proxy/stream', rateLimit(60_000, 120), proxyStream)
router.post('/proxy/stream', rateLimit(60_000, 30), validateProxyUrl, proxyStream)

export default router
