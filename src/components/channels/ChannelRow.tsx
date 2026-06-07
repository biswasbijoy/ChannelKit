import { useNavigate } from 'react-router-dom'
import type { Channel } from '../../features/playlist/playlistTypes'
import { useFavoritesStore } from '../../features/favorites/favoritesStore'

interface ChannelCardProps {
  channel: Channel
}

function ChannelCardInner({ channel, dense = false }: ChannelCardProps & { dense?: boolean }) {
  const navigate = useNavigate()
  const isFavorite = useFavoritesStore((s) => s.isFavorite)
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)

  const fav = isFavorite(channel.id)

  return (
    <div
      onClick={() => navigate(`/watch/${channel.id}`)}
      className={`group flex items-center gap-3 cursor-pointer transition-all duration-200 ${
        dense
          ? 'px-4 py-2.5 hover:bg-gray-800/60'
          : 'bg-gray-900/50 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3'
      }`}
    >
      <div className="relative flex-shrink-0">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt=""
            className="w-11 h-11 rounded-lg object-contain bg-gray-800/80"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={`w-11 h-11 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-500 ${channel.logo ? 'hidden' : ''}`}>
          TV
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-100 truncate group-hover:text-white transition-colors">
          {channel.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-500 truncate">{channel.group}</span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(channel.id)
        }}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/60 transition-colors"
        title={fav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 transition-colors ${
            fav ? 'fill-yellow-400 stroke-yellow-400' : 'fill-none stroke-gray-500 hover:stroke-gray-300'
          }`}
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </button>
    </div>
  )
}

export function ChannelCard(props: ChannelCardProps) {
  return <ChannelCardInner {...props} dense={false} />
}

export function ChannelRow(props: ChannelCardProps) {
  return <ChannelCardInner {...props} dense={true} />
}
