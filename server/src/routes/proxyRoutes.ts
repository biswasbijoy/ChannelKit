import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { validateProxyUrl } from '../middleware/validateUrl.js'
import { proxyStream } from '../services/streamProxyService.js'

const router = Router()

// Rate limit: 30 requests per minute per IP
router.post('/proxy/stream', rateLimit(), validateProxyUrl, proxyStream)

export default router
