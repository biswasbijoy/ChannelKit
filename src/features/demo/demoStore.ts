import { create } from 'zustand'
import { api } from '../api/client'
import { parseM3u } from '../playlist/parseM3u'
import type { Channel } from '../playlist/playlistTypes'

interface DemoState {
  channel: Channel | null
  isLoading: boolean
  error: string | null
  loadDemo: () => Promise<void>
}

export const useDemoStore = create<DemoState>((set) => ({
  channel: null,
  isLoading: false,
  error: null,

  loadDemo: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/public/demo')
      const result = parseM3u(data.content, data.fileName)
      if (result.channels.length > 0) {
        const ch = result.channels[0]
        ch.id = 'demo'
        set({ channel: ch, isLoading: false })
      } else {
        set({ error: 'No channel found in demo file', isLoading: false })
      }
    } catch (err) {
      console.error('Failed to load demo channel:', err)
      set({ error: 'Failed to load demo channel', isLoading: false })
    }
  },
}))
