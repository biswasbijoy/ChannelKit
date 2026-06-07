import { create } from 'zustand'
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
}))
