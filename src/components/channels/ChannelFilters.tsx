import { useRef, useEffect } from 'react'

interface ChannelFiltersProps {
  groups: string[]
  selectedGroup: string
  onGroupChange: (group: string) => void
  sortBy: 'original' | 'alpha' | 'group'
  onSortChange: (sort: 'original' | 'alpha' | 'group') => void
  showFavoritesOnly: boolean
  onFavoritesToggle: () => void
  totalCount: number
  filteredCount: number
}

const sortOptions: { value: 'original' | 'alpha' | 'group'; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'group', label: 'Group' },
]

export function ChannelFilters({
  groups,
  selectedGroup,
  onGroupChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
  totalCount,
  filteredCount,
}: ChannelFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedGroup && scrollRef.current) {
      const btn = scrollRef.current.querySelector(`[data-group="${selectedGroup}"]`)
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedGroup])

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        <button
          data-group=""
          onClick={() => onGroupChange('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !selectedGroup && !showFavoritesOnly
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 border border-gray-700/50'
          }`}
        >
          All
        </button>
        <button
          onClick={onFavoritesToggle}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            showFavoritesOnly
              ? 'bg-yellow-600/90 text-white shadow-sm shadow-yellow-600/30'
              : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 border border-gray-700/50'
          }`}
        >
          <svg viewBox="0 0 24 24" className={`w-3 h-3 ${showFavoritesOnly ? 'fill-white' : 'fill-none stroke-current'}`} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Favorites
        </button>
        <div className="w-px bg-gray-700/50 shrink-0 mx-1" />
        {groups.map((g) => (
          <button
            key={g}
            data-group={g}
            onClick={() => onGroupChange(g === selectedGroup ? '' : g)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              selectedGroup === g
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 border border-gray-700/50'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                sortBy === opt.value
                  ? 'bg-gray-700/80 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {filteredCount}
          {filteredCount !== totalCount ? ` / ${totalCount}` : ''} channels
        </span>
      </div>
    </div>
  )
}
