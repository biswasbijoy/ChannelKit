import { create } from 'zustand'
import { api } from '../api/client'
import { parseM3u } from './parseM3u'
import type { Channel, ParseResult, PlaylistRecord } from './playlistTypes'

interface PlaylistState {
  channels: Channel[]
  parseResult: ParseResult | null
  fileName: string | null
  isLoading: boolean
  error: string | null

  setPlaylist: (result: ParseResult, fileName: string) => void
  clearPlaylist: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getChannelById: (id: string) => Channel | undefined
  getChannelByIndex: (index: number) => Channel | undefined
  getGroups: () => string[]
  toRecord: () => PlaylistRecord | null
  loadRecord: (record: PlaylistRecord) => void

  saveToServer: () => Promise<void>
  loadFromServer: () => Promise<void>
  loadDefaultPlaylist: () => Promise<void>
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  channels: [],
  parseResult: null,
  fileName: null,
  isLoading: false,
  error: null,

  setPlaylist: (result, fileName) => {
    set({
      channels: result.channels,
      parseResult: result,
      fileName,
      error: result.errors.length > 0
        ? `Parsed with ${result.errors.length} error(s)`
        : null,
      isLoading: false,
    })
  },

  clearPlaylist: () => {
    set({
      channels: [],
      parseResult: null,
      fileName: null,
      error: null,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  getChannelById: (id) => {
    return get().channels.find((c) => c.id === id)
  },

  getChannelByIndex: (index) => {
    return get().channels[index]
  },

  getGroups: () => {
    const groups = new Set(get().channels.map((c) => c.group))
    return Array.from(groups).sort()
  },

  toRecord: () => {
    const state = get()
    if (state.channels.length === 0) return null
    return {
      id: `playlist-${Date.now()}`,
      name: state.fileName ?? 'Imported Playlist',
      channels: state.channels,
      importedAt: Date.now(),
      source: 'file' as const,
      fileName: state.fileName ?? undefined,
    }
  },

  loadRecord: (record) => {
    set({
      channels: record.channels,
      fileName: record.fileName ?? null,
      error: null,
      isLoading: false,
    })
  },

  saveToServer: async () => {
    const state = get()
    if (state.channels.length === 0) return
    try {
      await api.post('/playlists', {
        name: state.fileName ?? 'Imported Playlist',
        channels: state.channels,
        source: 'file',
        fileName: state.fileName ?? undefined,
      })
    } catch (err) {
      console.error('Failed to save playlist to server:', err)
    }
  },

  loadFromServer: async () => {
    const state = get()
    if (state.channels.length > 0) return
    try {
      const listRes = await api.get('/playlists')
      const playlists: Array<{ _id: string }> = listRes.data
      if (playlists.length > 0) {
        const first = playlists[0]
        if (!first) return
        const recentRes = await api.get(`/playlists/${first._id}`)
        const data = recentRes.data
        set({
          channels: data.channels ?? [],
          fileName: data.fileName ?? null,
          error: null,
        })
        return
      }
      await get().loadDefaultPlaylist()
    } catch (err) {
      console.error('Failed to load playlist from server:', err)
    }
  },

  loadDefaultPlaylist: async () => {
    const state = get()
    if (state.channels.length > 0) return
    try {
      const { data } = await api.get('/playlists/default')
      const result = parseM3u(data.content, data.fileName ?? 'bd.m3u')
      set({
        channels: result.channels,
        parseResult: result,
        fileName: data.fileName ?? 'bd.m3u',
        error: result.errors.length > 0 ? `Parsed with ${result.errors.length} error(s)` : null,
        isLoading: false,
      })
    } catch (err) {
      console.error('Failed to load default playlist:', err)
    }
  },
}))
