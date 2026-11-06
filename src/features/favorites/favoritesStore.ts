import { create } from 'zustand'
import { saveFavorites, loadFavorites as loadFromDb } from '../storage/indexedDb'

interface FavoritesState {
  favorites: Set<string>
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  setFavorites: (ids: string[]) => void
  getFavorites: () => string[]
  initialize: () => Promise<void>
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(),

  toggleFavorite: (id) => {
    set((state) => {
      const next = new Set(state.favorites)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveFavorites(Array.from(next))
      return { favorites: next }
    })
  },

  isFavorite: (id) => {
    return get().favorites.has(id)
  },

  setFavorites: (ids) => {
    set({ favorites: new Set(ids) })
    saveFavorites(ids)
  },

  getFavorites: () => {
    return Array.from(get().favorites)
  },

  initialize: async () => {
    const ids = await loadFromDb()
    set({ favorites: new Set(ids) })
  },
}))
