import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { Settings } from '../models/Settings.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-do-not-use-in-prod'
const TOKEN_EXPIRY = '7d'

router.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    res.status(400).json({ error: 'email, password, and name are required' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const user = await User.create({ email, password, name })
    await Settings.create({ userId: user._id as any })

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

    res.status(201).json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password')
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ id: user._id.toString(), email: user.email, name: user.name })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

export default router
