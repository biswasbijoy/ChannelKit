import type { PlaybackState } from '../../features/playback/playbackTypes'

interface PlayerControlsProps {
  state: PlaybackState
  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void
  onFullscreen: () => void
  onPiP: () => void
  onPrevChannel?: () => void
  onNextChannel?: () => void
  hasPrev: boolean
  hasNext: boolean
  pipSupported: boolean
  onPlayPause?: () => void
}

export function PlayerControlsBar({
  state,
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
  onFullscreen,
  onPiP,
  onPrevChannel,
  onNextChannel,
  hasPrev,
  hasNext,
  pipSupported,
  onPlayPause,
}: PlayerControlsProps) {
  const isPlayable = state === 'playing' || state === 'paused'

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/90 backdrop-blur">
      <button
        onClick={onPlayPause}
        disabled={!isPlayable}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 text-lg"
        title={state === 'playing' ? 'Pause' : 'Play'}
      >
        {state === 'playing' ? '⏸' : '▶'}
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onMutedChange(!muted)}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-sm"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            onVolumeChange(v)
            if (v > 0 && muted) onMutedChange(false)
          }}
          className="w-20 accent-blue-500"
        />
      </div>

      <div className="flex-1" />

      {onPrevChannel && (
        <button
          onClick={onPrevChannel}
          disabled={!hasPrev}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 text-sm"
          title="Previous channel"
        >
          ⏮
        </button>
      )}
      {onNextChannel && (
        <button
          onClick={onNextChannel}
          disabled={!hasNext}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 text-sm"
          title="Next channel"
        >
          ⏭
        </button>
      )}

      {pipSupported && (
        <button
          onClick={onPiP}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-sm"
          title="Picture-in-Picture"
        >
          🖼
        </button>
      )}

      <button
        onClick={onFullscreen}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-sm"
        title="Fullscreen"
      >
        ⛶
      </button>
    </div>
  )
}
