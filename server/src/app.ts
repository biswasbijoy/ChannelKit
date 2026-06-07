import express from 'express'
import proxyRoutes from './routes/proxyRoutes.js'
import playlistRoutes from './routes/playlistRoutes.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json({ limit: '1mb' }))

app.use('/api', proxyRoutes)
app.use('/api', playlistRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`IPTV Player server running on http://localhost:${PORT}`)
})

export default app
