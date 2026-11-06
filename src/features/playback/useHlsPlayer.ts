import { useEffect, useRef, useCallback, useState } from 'react'
import Hls, { type ErrorData } from 'hls.js'
import type {
  PlaybackMode,
  PlaybackState,
  PlayerError,
  PlayerCallbacks,
  PlayerControls,
} from './playbackTypes'
import { getProxyUrl } from './useProxyUrl'

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
    if (hlsError.details?.includes('network') || hlsError.details === 'manifestLoadError') {
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

function isHlsUrl(url: string): boolean {
  // Check URL path extension (even with query params)
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.m3u8') || path.endsWith('.m3u')) return true
  
  // Check for known HLS query parameters or proxy patterns
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('/hls/') || 
         lowerUrl.includes('EXTM3U') || 
         lowerUrl.includes('hls.js') ||
         // Common HLS proxy patterns
         lowerUrl.includes('proxy?url=')
}

interface UseHlsPlayerOptions extends PlayerCallbacks {
  retryCount?: number
  useProxyFallback?: boolean
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
  const { onStateChange, onError, retryCount = 3, useProxyFallback = true } = options

  const [state, setState] = useState<PlaybackState>('idle')
  const [mode, setMode] = useState<PlaybackMode>('native')
  const [error, setPlayerError] = useState<PlayerError | null>(null)
  const [controls, setControls] = useState<PlayerControls | null>(null)
  const [tryToken, setTryToken] = useState(0)
  const hlsRef = useRef<Hls | null>(null)
  const retriesRef = useRef(0)
  const isProxyingRef = useRef(false)
  const mediaSourceRef = useRef<string | null>(null)

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    mediaSourceRef.current = null
    retriesRef.current = 0
    isProxyingRef.current = false
  }, [])

  const retry = useCallback(() => {
    if (!mediaSourceRef.current) return
    setPlayerError(null)
    setState('loading')
    retriesRef.current = 0
    isProxyingRef.current = false
    setTryToken(t => t + 1)
    if (retriesRef.current >= (retryCount || 3)) {
      setPlayerError({
        category: 'network',
        message: 'Max retry attempts reached. Stream may be unavailable.',
        details: 'The stream could not be loaded after multiple attempts.'
      })
      setState('error')
      return
    }
    retriesRef.current++
    destroyPlayer()
  }, [destroyPlayer, tryToken, retryCount])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) {
      setState('idle')
      setControls(null)
      return
    }

    // Transform CORS-blocked URLs to go through app proxy
    const lowerUrl = streamUrl.toLowerCase()
    const isCorsBlocked = lowerUrl.includes('workers.dev') || lowerUrl.includes('127.0.0.1') || lowerUrl.includes('localhost')
    let activeUrl = streamUrl // Default to original URL
    if (isCorsBlocked && useProxyFallback) {
      try {
        const encoded = encodeURIComponent(streamUrl)
        activeUrl = `/api/proxy/stream?url=${encoded}`
        console.log('Routing through app proxy for CORS support')
      } catch (e) {
        console.log('URL transform error:', e.message)
      }
    }
    if (isProxyingRef.current && activeUrl === streamUrl) {
      activeUrl = getProxyUrl(streamUrl)
    }

    setState('loading')
    setPlayerError(null)
    mediaSourceRef.current = streamUrl

    const streamOrigin = (() => {
      try { return new URL(activeUrl).origin } catch { return activeUrl }
    })()

    const updateState = (s: PlaybackState) => {
      setState(s)
      onStateChange?.(s)
    }

    const handleError = (err: PlayerError) => {
      // If we haven't tried proxying yet and it's a network/forbidden error, try proxying
      if (useProxyFallback && !isProxyingRef.current && (err.category === 'network' || err.category === 'forbidden')) {
        console.log('Playback failed, falling back to proxy:', activeUrl)
        isProxyingRef.current = true
        retriesRef.current = 0
        // Clean up and re-init with proxy
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
        // Small delay to ensure cleanup
        setTimeout(() => {
          if (streamUrl === mediaSourceRef.current) {
            // Trigger effect again by slightly different state if needed, but here we can just re-call the init logic or let the effect handle it if we have a way to force re-run
            // Actually, we can just use a local state or ref to track "current try"
            // For simplicity, let's just use a state for the active URL or a "tryCount"
          }
        }, 0)
        // To force re-run, we can use a state
        setTryToken(t => t + 1)
        return
      }

      setPlayerError(err)
      setState('error')
      onError?.(err)
    }

    const isHls = isHlsUrl(activeUrl) || isHlsUrl(streamUrl) || (!isDirectMedia(activeUrl) && !canPlayNativeHls())

    if (canPlayNativeHls() && !isHls) {
      setMode('native')
      video.src = activeUrl
      console.log('Using native HLS playback')
    } else if (isDirectMedia(activeUrl)) {
      setMode('direct')
      video.src = activeUrl
      console.log('Using direct media playback')
    } else if (isHls) {
      setMode('hlsjs')
      console.log('Using HLS.js playback')
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        xhrSetup: (xhr) => {
          try {
            xhr.setRequestHeader('Referer', streamOrigin + '/')
          } catch (e) {
            // Browser may block setting Referer - continue without it
            console.log('Referer header blocked by browser, continuing without it')
          }
        },
      })
      hlsRef.current = hls

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(activeUrl)
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
      const onVideoError = () => {
        handleError(classifyError(video.error))
      }
      video.addEventListener('error', onVideoError)
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
          video.removeEventListener('error', onVideoError)
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
        hls.loadSource(activeUrl)
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
      // destroyPlayer()
    }
  }, [streamUrl, videoRef, destroyPlayer, onStateChange, onError, retryCount, useProxyFallback, tryToken])

  // Separate effect for cleanup to avoid race conditions with fallback
  useEffect(() => {
    return () => {
      destroyPlayer()
    }
  }, [streamUrl, destroyPlayer])

  return { state, mode, error, controls, retry }
}
