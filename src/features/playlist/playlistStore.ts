import { create } from 'zustand'
import { api } from '../api/client'
import { parseM3u, applyBdCategoryMapping } from './parseM3u'
import type { Channel, ParseResult, PlaylistRecord } from './playlistTypes'

interface DefaultEntry {
  code: string
  file: string
}

interface PlaylistState {
  channels: Channel[]
  parseResult: ParseResult | null
  fileName: string | null
  isLoading: boolean
  hasLoaded: boolean
  error: string | null
  availableDefaults: DefaultEntry[]

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
  loadDefaultsList: () => Promise<void>
  loadDefaultPlaylistByCode: (code: string) => Promise<void>
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  channels: [],
  parseResult: null,
  fileName: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
  availableDefaults: [],

  setPlaylist: (result, fileName) => {
    const mapped = applyBdCategoryMapping(result.channels, fileName)
    set({
      channels: mapped,
      parseResult: result,
      fileName,
      error: result.errors.length > 0
        ? `Parsed with ${result.errors.length} error(s)`
        : null,
      isLoading: false,
      hasLoaded: true,
    })
  },

  clearPlaylist: () => {
    set({
      channels: [],
      parseResult: null,
      fileName: null,
      error: null,
      hasLoaded: false,
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
    const mapped = applyBdCategoryMapping(record.channels, record.fileName)
    set({
      channels: mapped,
      fileName: record.fileName ?? null,
      error: null,
      isLoading: false,
      hasLoaded: true,
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
    set({ isLoading: true, error: null })
    await get().loadDefaultsList()
    const state = get()
    if (state.channels.length > 0) {
      set({ isLoading: false, hasLoaded: true })
      return
    }
    try {
      const listRes = await api.get('/playlists')
      const playlists: Array<{ _id: string }> = listRes.data
      if (playlists.length > 0) {
        const first = playlists[0]
        if (!first) return
        const recentRes = await api.get(`/playlists/${first._id}`)
        const data = recentRes.data
        const rawChannels: Channel[] = data.channels ?? []
        const filtered = rawChannels.filter((ch) => !ch.name.includes('(1080p)'))
        const mapped = applyBdCategoryMapping(filtered, data.fileName)
        set({
          channels: mapped,
          fileName: data.fileName ?? null,
          error: null,
          isLoading: false,
          hasLoaded: true,
        })
      } else {
        set({ isLoading: false, hasLoaded: true })
      }
    } catch (err) {
      console.error('Failed to load playlist from server:', err)
      set({ error: 'Failed to load playlist', isLoading: false, hasLoaded: true })
    }
  },

  loadDefaultsList: async () => {
    try {
      const { data } = await api.get('/playlists/defaults')
      set({ availableDefaults: data as DefaultEntry[] })
    } catch (err) {
      console.error('Failed to load defaults list:', err)
    }
  },

  loadDefaultPlaylistByCode: async (code: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/playlists/default/${code}`)
      const result = parseM3u(data.content, data.fileName ?? `${code}.m3u`)
      set({
        channels: result.channels,
        parseResult: result,
        fileName: data.fileName ?? `${code}.m3u`,
        error: result.errors.length > 0 ? `Parsed with ${result.errors.length} error(s)` : null,
        isLoading: false,
        hasLoaded: true,
      })
      get().saveToServer()
    } catch (err) {
      console.error(`Failed to load default playlist "${code}":`, err)
      set({ error: `Failed to load playlist for "${code}"`, isLoading: false, hasLoaded: true })
    }
  },
}))
