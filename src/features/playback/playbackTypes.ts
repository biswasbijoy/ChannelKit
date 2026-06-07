export type PlaybackMode = 'hlsjs' | 'native' | 'direct' | 'error'

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerError {
  category: 'network' | 'cors' | 'not-found' | 'forbidden' | 'unsupported' | 'unknown'
  message: string
  details?: string
}

export interface PlayerCallbacks {
  onStateChange?: (state: PlaybackState) => void
  onError?: (error: PlayerError) => void
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
}

export interface PlayerControls {
  play: () => void
  pause: () => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  seek: (time: number) => void
  destroy: () => void
}
