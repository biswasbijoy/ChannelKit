import { create } from 'zustand'
import { api } from '../api/client'

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
}

function loadFromStorage(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem('iptv-token')
    const userRaw = localStorage.getItem('iptv-user')
    return {
      token,
      user: userRaw ? JSON.parse(userRaw) : null,
    }
  } catch {
    return { user: null, token: null }
  }
}

function saveToStorage(token: string | null, user: User | null) {
  if (token) {
    localStorage.setItem('iptv-token', token)
  } else {
    localStorage.removeItem('iptv-token')
  }
  if (user) {
    localStorage.setItem('iptv-user', JSON.stringify(user))
  } else {
    localStorage.removeItem('iptv-user')
  }
}

const initial = loadFromStorage()

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      saveToStorage(data.token, data.user)
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err: any) {
      const message = err.response?.data?.error ?? 'Login failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { email, password, name })
      saveToStorage(data.token, data.user)
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (err: any) {
      const message = err.response?.data?.error ?? 'Registration failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  logout: () => {
    saveToStorage(null, null)
    set({ user: null, token: null })
  },

  checkAuth: async () => {
    const { token } = loadFromStorage()
    if (!token) {
      set({ user: null, token: null })
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      const user: User = { id: data.id, email: data.email, name: data.name, avatar: data.avatar ?? null }
      saveToStorage(token, user)
      set({ user, token })
    } catch {
      saveToStorage(null, null)
      set({ user: null, token: null })
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => {
    const token = localStorage.getItem('iptv-token')
    saveToStorage(token, user)
    set({ user })
  },
}))
