import type { PlaybackMode, PlayerError } from '../../features/playback/playbackTypes'

interface PlayerStatusProps {
  mode: PlaybackMode
  error: PlayerError | null
  streamUrl: string
  collapsed: boolean
  onToggle: () => void
}

export function PlayerStatus({
  mode,
  error,
  streamUrl,
  collapsed,
  onToggle,
}: PlayerStatusProps) {
  const host = (() => {
    try {
      return new URL(streamUrl).host
    } catch {
      return 'unknown'
    }
  })()

  const modeLabel = {
    hlsjs: 'HLS.js',
    native: 'Native HLS',
    direct: 'Direct',
    error: 'Error',
  }[mode]

  return (
    <div className="bg-gray-900 border-t border-gray-800">
      <button
        onClick={onToggle}
        className="w-full px-4 py-1.5 text-xs text-gray-500 hover:text-gray-300 flex items-center justify-between"
      >
        <span>Playback Status</span>
        <span>{collapsed ? '▲' : '▼'}</span>
      </button>
      {!collapsed && (
        <div className="px-4 pb-2 text-xs text-gray-400 space-y-1 font-mono">
          <div className="flex gap-2">
            <span className="text-gray-500">Host:</span>
            <span>{host}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">Mode:</span>
            <span
              className={
                mode === 'error' ? 'text-red-400' : mode === 'hlsjs' ? 'text-green-400' : 'text-blue-400'
              }
            >
              {modeLabel}
            </span>
          </div>
          {error && (
            <div className="flex gap-2">
              <span className="text-gray-500">Error:</span>
              <span className="text-red-400">{error.category}: {error.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
