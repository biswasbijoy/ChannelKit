import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useDemoStore } from '../../features/demo/demoStore'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'
import { useAuthStore } from '../../features/auth/authStore'
import { getCountryFlagAndName, getFlagImageUrl } from '../../features/countries/iso3166'
import { ChannelCard } from './ChannelRow'
import { ChannelSearch } from './ChannelSearch'
import { ChannelFilters } from './ChannelFilters'

export function ChannelBrowser() {
  const channels = usePlaylistStore((s) => s.channels)
  const user = useAuthStore((s) => s.user)
  const fileName = usePlaylistStore((s) => s.fileName)
  const demoChannel = useDemoStore((s) => s.channel)
  const groups = useMemo(() => [...new Set(channels.map((c) => c.group))].sort(), [channels])
  const displayCountry = fileName ? getCountryFlagAndName(fileName) : null
  const favoritesSet = useFavoritesStore((s) => s.favorites)

  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [sortBy, setSortBy] = useState<'original' | 'alpha' | 'group'>('original')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

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

  const isGuest = !user
  const displayChannels = isGuest
    ? (demoChannel ? [demoChannel] : [])
    : filteredChannels

  const emptyMessage = displayChannels.length === 0

  if (emptyMessage) {
    return (
      <div className="flex-1 flex flex-col min-h-0 items-center justify-center p-6 text-center">
        {user ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Channels Loaded</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md">
              Use the country picker in the navbar or go to the homepage to upload a playlist.
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Sign in Required</h2>
            <p className="text-gray-500 text-sm mb-4 max-w-md">
              Create a free account to browse and upload playlists.
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
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800/60">
        <div className="px-5 pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-4">
            {displayCountry ? (
              <div className="flex items-center gap-2.5 shrink-0">
                <img
                  src={getFlagImageUrl(displayCountry.code)}
                  alt={displayCountry.name}
                  className="w-8 h-6 rounded-sm object-cover shadow-sm ring-1 ring-white/10"
                />
                <h1 className="text-base font-bold text-gray-100">{displayCountry.name}</h1>
              </div>
            ) : (
              <h1 className="text-lg font-bold shrink-0">Channels</h1>
            )}
            <ChannelSearch value={search} onChange={setSearch} />
          </div>
          {user && channels.length > 0 && (
            <ChannelFilters
              groups={groups}
              selectedGroup={selectedGroup}
              onGroupChange={setSelectedGroup}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showFavoritesOnly={showFavoritesOnly}
              onFavoritesToggle={() => setShowFavoritesOnly((p) => !p)}
              totalCount={channels.length}
              filteredCount={filteredChannels.length}
            />
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        {!user && demoChannel && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-gray-900/40 to-purple-950/40 border border-blue-500/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">Demo Channel — no account required</p>
              <Link to="/signup" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Sign up for full access →
              </Link>
            </div>
            <ChannelCard channel={demoChannel} />
          </div>
        )}
        {user && filteredChannels.length > 0 ? (
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredChannels.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        ) : user && filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No channels match your search</p>
            <button
              onClick={() => { setSearch(''); setSelectedGroup(''); setShowFavoritesOnly(false) }}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : !user && !demoChannel ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 text-sm">Loading demo channel...</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
