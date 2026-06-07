import { describe, it, expect, beforeEach } from 'vitest'
import { useFavoritesStore } from '../features/favorites/favoritesStore'

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: new Set() })
  })

  it('starts empty', () => {
    expect(useFavoritesStore.getState().getFavorites()).toEqual([])
  })

  it('toggles a favorite', () => {
    useFavoritesStore.getState().toggleFavorite('ch-1')
    expect(useFavoritesStore.getState().isFavorite('ch-1')).toBe(true)

    useFavoritesStore.getState().toggleFavorite('ch-1')
    expect(useFavoritesStore.getState().isFavorite('ch-1')).toBe(false)
  })

  it('loads favorites from array', () => {
    useFavoritesStore.getState().loadFavorites(['ch-1', 'ch-2'])
    expect(useFavoritesStore.getState().isFavorite('ch-1')).toBe(true)
    expect(useFavoritesStore.getState().isFavorite('ch-2')).toBe(true)
    expect(useFavoritesStore.getState().isFavorite('ch-3')).toBe(false)
  })

  it('handles multiple favorites', () => {
    useFavoritesStore.getState().toggleFavorite('ch-1')
    useFavoritesStore.getState().toggleFavorite('ch-2')
    useFavoritesStore.getState().toggleFavorite('ch-3')

    const favs = useFavoritesStore.getState().getFavorites()
    expect(favs).toHaveLength(3)
    expect(favs).toContain('ch-1')
    expect(favs).toContain('ch-2')
    expect(favs).toContain('ch-3')
  })
})
