import { useNavigate } from 'react-router-dom'
import type { Channel } from '../../features/playlist/playlistTypes'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'

interface ChannelRowProps {
  channel: Channel
}

export function ChannelRow({ channel }: ChannelRowProps) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavoritesStore()

  const fav = isFavorite(channel.id)

  return (
    <div
      onClick={() => navigate(`/watch/${channel.id}`)}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800/50"
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(channel.id)
        }}
        className="flex-shrink-0 text-lg"
        title={fav ? 'Remove from favorites' : 'Add to favorites'}
      >
        {fav ? '★' : '☆'}
      </button>

      {channel.logo ? (
        <img
          src={channel.logo}
          alt=""
          className="w-8 h-8 rounded object-contain bg-gray-900 flex-shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
          TV
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{channel.name}</p>
        <p className="text-xs text-gray-500 truncate">{channel.group}</p>
      </div>
    </div>
  )
}
