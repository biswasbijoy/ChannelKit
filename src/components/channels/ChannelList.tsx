import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'
import { ChannelRow } from './ChannelRow'
import { ChannelSearch } from './ChannelSearch'
import { ChannelFilters } from './ChannelFilters'

const ROW_HEIGHT = 56

export function ChannelBrowser() {
  const navigate = useNavigate()
  const channels = usePlaylistStore((s) => s.channels)
  const fileName = usePlaylistStore((s) => s.fileName)
  const groups = usePlaylistStore((s) => s.getGroups())

  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [sortBy, setSortBy] = useState<'original' | 'alpha' | 'group'>('original')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const favoritesSet = useFavoritesStore((s) => s.favorites)

  const filteredChannels = useMemo(() => {
    let list = channels

    if (showFavoritesOnly) {
      list = list.filter((c) => favoritesSet.has(c.id))
    }

    if (selectedGroup) {
      list = list.filter((c) => c.group === selectedGroup)
    }

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
      case 'original':
        break
    }

    return sorted
  }, [channels, search, selectedGroup, sortBy, showFavoritesOnly, favoritesSet])

  const parentRef = {
    current: null as HTMLDivElement | null,
  }
  const setParentRef = (el: HTMLDivElement | null) => {
    parentRef.current = el
  }

  const virtualizer = useVirtualizer({
    count: filteredChannels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (channels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-gray-400 text-lg mb-4">No channels loaded</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Upload a Playlist
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {fileName ?? 'Channels'}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {filteredChannels.length} / {channels.length}
            </span>
          </h1>
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

      <div ref={setParentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const channel = filteredChannels[virtualItem.index]
            if (!channel) return null
            return (
              <div
                key={channel.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ChannelRow channel={channel} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
