import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'
import { useAuthStore } from '../../features/auth/authStore'
import { getCountryFlagAndName, getFlagImageUrl } from '../../features/countries/iso3166'
import { ChannelRow } from './ChannelRow'
import { ChannelSearch } from './ChannelSearch'
import { ChannelFilters } from './ChannelFilters'

export function ChannelBrowser() {
  const navigate = useNavigate()
  const channels = usePlaylistStore((s) => s.channels)
  const user = useAuthStore((s) => s.user)
  const fileName = usePlaylistStore((s) => s.fileName)
  const groups = useMemo(() => {
    const g = new Set(channels.map((c) => c.group))
    return Array.from(g).sort()
  }, [channels])

  const displayCountry = fileName ? getCountryFlagAndName(fileName) : null

  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [sortBy, setSortBy] = useState<'original' | 'alpha' | 'group'>('original')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const favoritesSet = useFavoritesStore((s) => s.favorites)

  const filteredChannels = useMemo(() => {
    let list = channels
    if (showFavoritesOnly) list = list.filter((c) => favoritesSet.has(c.id))
    if (selectedGroup) list = list.filter((c) => c.group === selectedGroup)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.tvgName.toLowerCase().includes(q),
      )
    }
    const sorted = [...list]
    switch (sortBy) {
      case 'alpha':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'group':
        sorted.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
        break
    }
    return sorted
  }, [channels, search, selectedGroup, sortBy, showFavoritesOnly, favoritesSet])

  if (channels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {user ? (
          <>
            <p className="text-gray-400 text-lg mb-4">No channels loaded</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Upload a Playlist
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-5">🔒</div>
            <h2 className="text-xl font-bold mb-2">Sign in Required</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md">
              Create a free account to upload playlists and browse channels.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/signup"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {displayCountry ? (
              <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-950/70 via-gray-900/70 to-blue-950/70 px-4 py-2 rounded-xl border border-indigo-500/15 shadow-lg shadow-blue-500/5 animate-glow">
                <img src={getFlagImageUrl(displayCountry.code)} alt={displayCountry.name} className="w-9 h-7 rounded-sm object-cover shadow-md ring-1 ring-white/10" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
                  {displayCountry.name}
                </h1>
              </div>
            ) : (
              <h1 className="text-xl font-bold">Channels</h1>
            )}
            <span className="text-sm text-gray-500 ml-1">
              {filteredChannels.length} / {channels.length}
            </span>
          </div>
        </div>
        <ChannelSearch value={search} onChange={setSearch} />
        <ChannelFilters
          groups={groups}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={() => setShowFavoritesOnly((p) => !p)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChannels.map((ch) => (
          <ChannelRow key={ch.id} channel={ch} />
        ))}
      </div>
    </div>
  )
}
