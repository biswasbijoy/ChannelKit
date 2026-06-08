import { useEffect, useRef, useCallback, useState } from 'react'
import Hls, { type ErrorData } from 'hls.js'
import type {
  PlaybackMode,
  PlaybackState,
  PlayerError,
  PlayerCallbacks,
  PlayerControls,
} from './playbackTypes'

function classifyError(
  hlsError: ErrorData | MediaError | null,
  httpStatus?: number,
): PlayerError {
  if (httpStatus === 404) {
    return { category: 'not-found', message: 'Stream not found (404)' }
  }
  if (httpStatus === 403) {
    return { category: 'forbidden', message: 'Access forbidden (403)' }
  }

  if (hlsError instanceof MediaError) {
    const codes = ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED']
    return { category: 'media', message: codes[hlsError.code] || 'Unknown media error' }
  }

  if (hlsError && 'details' in hlsError) {
    if (hlsError.details?.includes('network')) {
      return { category: 'network', message: 'Network error loading stream' }
    }
    if (hlsError.details?.includes('403')) {
      return { category: 'forbidden', message: 'Access forbidden' }
    }
    if (hlsError.details?.includes('404')) {
      return { category: 'not-found', message: 'Stream not found' }
    }

    const type = 'type' in hlsError ? hlsError.type : 'unknown'
    const details = 'details' in hlsError ? hlsError.details : ''
    return { category: type, message: details || 'An unknown playback error occurred' }
  }

  return { category: 'unknown', message: 'An unknown playback error occurred' }
}

function canPlayNativeHls(): boolean {
  const video = document.createElement('video')
  return video.canPlayType('application/vnd.apple.mpegurl') !== ''
}

function isDirectMedia(url: string): boolean {
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase()
  return ext === 'mp4' || ext === 'webm' || ext === 'ogg' || ext === 'avi' || ext === 'mkv'
}

interface UseHlsPlayerOptions extends PlayerCallbacks {
  retryCount?: number
}

export function useHlsPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  streamUrl: string | null,
  options: UseHlsPlayerOptions = {},
): {
  state: PlaybackState
  mode: PlaybackMode
  error: PlayerError | null
  controls: PlayerControls | null
  retry: () => void
} {
  const { onStateChange, onError, retryCount = 3 } = options

  const [state, setState] = useState<PlaybackState>('idle')
  const [mode, setMode] = useState<PlaybackMode>('native')
  const [error, setPlayerError] = useState<PlayerError | null>(null)
  const [controls, setControls] = useState<PlayerControls | null>(null)

  const hlsRef = useRef<Hls | null>(null)
  const retriesRef = useRef(0)
  const mediaSourceRef = useRef<string | null>(null)

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    mediaSourceRef.current = null
    retriesRef.current = 0
  }, [])

  const retry = useCallback(() => {
    if (!mediaSourceRef.current) return
    setPlayerError(null)
    setState('loading')
    retriesRef.current = 0
    destroyPlayer()
    // will re-init via effect
  }, [destroyPlayer])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) {
      setState('idle')
      setControls(null)
      return
    }

    setState('loading')
    setPlayerError(null)
    mediaSourceRef.current = streamUrl
    retriesRef.current = 0

    const streamOrigin = (() => {
      try { return new URL(streamUrl).origin } catch { return streamUrl }
    })()

    const updateState = (s: PlaybackState) => {
      setState(s)
      onStateChange?.(s)
    }

    const handleError = (err: PlayerError) => {
      setPlayerError(err)
      setState('error')
      onError?.(err)
    }

    if (canPlayNativeHls() || isDirectMedia(streamUrl)) {
      setMode(isDirectMedia(streamUrl) ? 'direct' : 'native')
      video.src = streamUrl
      video.addEventListener('error', () => {
        handleError(classifyError(video.error))
      })
      video.addEventListener('playing', () => updateState('playing'))
      video.addEventListener('pause', () => updateState('paused'))
      video.addEventListener('waiting', () => updateState('loading'))

      setControls({
        play: () => video.play(),
        pause: () => video.pause(),
        setVolume: (v: number) => { video.volume = v },
        setMuted: (m: boolean) => { video.muted = m },
        seek: (t: number) => { video.currentTime = t },
        destroy: () => {
          video.removeAttribute('src')
          video.load()
        },
      })

      video.load()
    } else if (Hls.isSupported()) {
      setMode('hlsjs')
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('Referer', streamOrigin + '/')
        },
      })
      hlsRef.current = hls

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(streamUrl)
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          const err = classifyError(data, data.response?.code)
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR && data.response?.code === 404) {
                hls.startLoad()
                return
              }
              if (retriesRef.current < retryCount) {
                retriesRef.current++
                hls.startLoad()
                return
              }
              handleError(err)
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              handleError(err)
              break
          }
        }
      })

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        updateState('playing')
      })

      hls.attachMedia(video)

      setControls({
        play: () => video.play(),
        pause: () => video.pause(),
        setVolume: (v: number) => { video.volume = v },
        setMuted: (m: boolean) => { video.muted = m },
        seek: (t: number) => { video.currentTime = t },
        destroy: () => {
          hls.destroy()
          hlsRef.current = null
        },
      })

      video.addEventListener('playing', () => updateState('playing'))
      video.addEventListener('pause', () => updateState('paused'))
      video.addEventListener('waiting', () => updateState('loading'))
    } else {
      setMode('error')
      handleError({
        category: 'unsupported',
        message: 'HLS streaming is not supported in this browser',
      })
    }

    return () => {
      destroyPlayer()
    }
  }, [streamUrl, videoRef, destroyPlayer, onStateChange, onError, retryCount])

  return { state, mode, error, controls, retry }
}
