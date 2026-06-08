import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import proxyRoutes from './routes/proxyRoutes.js'
import playlistRoutes from './routes/playlistRoutes.js'
import authRoutes from './routes/authRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import publicRoutes from './routes/publicRoutes.js'

const app = express()
const PORT = process.env.PORT ?? 3001
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/iptv-player'

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api', proxyRoutes)
app.use('/api', playlistRoutes)
app.use('/api', authRoutes)
app.use('/api', settingsRoutes)
app.use('/api', publicRoutes)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
}))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

async function start() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`IPTV Player server running on http://localhost:${PORT}`)
  })
}

start()

export default app
