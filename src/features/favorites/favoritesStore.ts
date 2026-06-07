import { create } from 'zustand'

interface FavoritesState {
  favorites: Set<string>
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  loadFavorites: (ids: string[]) => void
  getFavorites: () => string[]
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
      return { favorites: next }
    })
  },

  isFavorite: (id) => {
    return get().favorites.has(id)
  },

  loadFavorites: (ids) => {
    set({ favorites: new Set(ids) })
  },

  getFavorites: () => {
    return Array.from(get().favorites)
  },
}))
