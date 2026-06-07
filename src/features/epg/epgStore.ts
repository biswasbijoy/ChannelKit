import { create } from 'zustand'
import type { EpgChannel, EpgParseResult } from './epgTypes'

interface EpgState {
  channels: EpgChannel[]
  parseResult: EpgParseResult | null
  isLoading: boolean
  error: string | null

  setEpgData: (result: EpgParseResult) => void
  clearEpgData: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getCurrentProgram: (channelId: string, channelName: string) => { title: string; start: Date; end: Date } | null
  getNextProgram: (channelId: string, channelName: string) => { title: string; start: Date; end: Date } | null
}

export const useEpgStore = create<EpgState>((set, get) => ({
  channels: [],
  parseResult: null,
  isLoading: false,
  error: null,

  setEpgData: (result) => {
    set({
      channels: result.channels,
      parseResult: result,
      error: result.errors.length > 0
        ? `EPG parsed with ${result.errors.length} error(s)`
        : null,
      isLoading: false,
    })
  },

  clearEpgData: () => {
    set({ channels: [], parseResult: null, error: null })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  getCurrentProgram: (channelId, channelName) => {
    const now = new Date()
    const epgCh = get().channels.find(
      (ch) => ch.id === channelId || ch.name === channelName,
    )
    if (!epgCh) return null
    const current = epgCh.entries.find(
      (e) => e.start <= now && e.end > now,
    )
    return current ? { title: current.title, start: current.start, end: current.end } : null
  },

  getNextProgram: (channelId, channelName) => {
    const now = new Date()
    const epgCh = get().channels.find(
      (ch) => ch.id === channelId || ch.name === channelName,
    )
    if (!epgCh) return null
    const next = epgCh.entries.find((e) => e.start > now)
    return next ? { title: next.title, start: next.start, end: next.end } : null
  },
}))
