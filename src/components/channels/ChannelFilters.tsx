interface ChannelFiltersProps {
  groups: string[]
  selectedGroup: string
  onGroupChange: (group: string) => void
  sortBy: 'original' | 'alpha' | 'group'
  onSortChange: (sort: 'original' | 'alpha' | 'group') => void
  showFavoritesOnly: boolean
  onFavoritesToggle: () => void
}

export function ChannelFilters({
  groups,
  selectedGroup,
  onGroupChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
}: ChannelFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={selectedGroup}
        onChange={(e) => onGroupChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="">All Groups</option>
        {groups.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      >
        <option value="original">Original Order</option>
        <option value="alpha">A-Z</option>
        <option value="group">By Group</option>
      </select>

      <button
        onClick={onFavoritesToggle}
        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
          showFavoritesOnly
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        {showFavoritesOnly ? '★ Favorites' : '☆ Favorites'}
      </button>
    </div>
  )
}
