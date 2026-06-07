import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useAuthStore } from '../../features/auth/authStore'
import { useHlsPlayer } from '../../features/playback/useHlsPlayer'
import { usePreferences } from '../../features/storage/preferences'
import { PlayerControlsBar } from './PlayerControls'
import { PlayerStatus } from './PlayerStatus'
import { ChannelSearch } from '../channels/ChannelSearch'
import { ChannelRow } from '../channels/ChannelRow'

export function StreamingScreen() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null!)
  const channels = usePlaylistStore((s) => s.channels)
  const getChannelById = usePlaylistStore((s) => s.getChannelById)
  const user = useAuthStore((s) => s.user)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [statusCollapsed, setStatusCollapsed] = useState(true)
  const [search, setSearch] = useState('')
  const [pipSupported, setPipSupported] = useState(false)

  const currentChannel = channelId ? getChannelById(channelId) : undefined
  const currentIndex = currentChannel ? channels.indexOf(currentChannel) : -1

  const { volume, muted, setVolume, setMuted } = usePreferences()

  const { state, mode, error, controls, retry } = useHlsPlayer(
    videoRef as React.RefObject<HTMLVideoElement | null>,
    currentChannel?.url ?? null,
    { retryCount: 3 },
  )

  useEffect(() => {
    setPipSupported(document.pictureInPictureEnabled)
  }, [])

  useEffect(() => {
    if (controls && currentChannel) {
      controls.setVolume(muted ? 0 : volume)
      controls.setMuted(muted)
    }
  }, [controls, volume, muted, currentChannel])

  const goToChannel = useCallback((id: string) => {
    navigate(`/watch/${id}`)
  }, [navigate])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goToChannel(channels[currentIndex - 1]?.id ?? '')
    }
  }, [currentIndex, channels, goToChannel])

  const goNext = useCallback(() => {
    if (currentIndex < channels.length - 1) {
      goToChannel(channels[currentIndex + 1]?.id ?? '')
    }
  }, [currentIndex, channels, goToChannel])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'm' || e.key === 'M') setMuted(!muted)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goPrev, goNext, muted, setMuted])

  const toggleFullscreen = useCallback(async () => {
    const el = videoRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch { /* ignore */ }
  }, [])

  const togglePiP = useCallback(async () => {
    const el = videoRef.current
    if (!el) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await el.requestPictureInPicture()
      }
    } catch { /* ignore */ }
  }, [])

  const filteredChannels = search.trim()
    ? channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channels

  if (channels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          {user ? (
            <>
              <p className="text-gray-400 text-lg mb-4">No channels loaded</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Upload a Playlist
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-5">🔒</div>
              <h2 className="text-xl font-bold mb-2">Sign in to Watch</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md">
                Create a free account to upload playlists and stream live TV.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
      {/* Left panel: channel list */}
      <div
        className={`${
          sidebarOpen ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 xl:w-96 flex-col bg-gray-950 border-r border-gray-800 min-h-0`}
      >
        <div className="p-3 border-b border-gray-800 shrink-0">
          <ChannelSearch value={search} onChange={setSearch} />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredChannels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => goToChannel(ch.id)}
              className={`cursor-pointer ${
                ch.id === currentChannel?.id ? 'bg-blue-900/30' : ''
              }`}
            >
              <ChannelRow channel={ch} />
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: player */}
      {currentChannel ? (
        <div className="flex-1 flex flex-col bg-black min-h-0">
          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              onClick={() => {
                if (state === 'playing') controls?.pause()
                else controls?.play()
              }}
            />

            {state === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading stream...</p>
                </div>
              </div>
            )}

            {state === 'error' && error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center max-w-md px-4">
                  <p className="text-red-400 text-lg mb-2">Playback Error</p>
                  <p className="text-gray-400 text-sm mb-4">{error.message}</p>
                  <p className="text-gray-600 text-xs mb-4">
                    Category: {error.category}
                    {error.details && <> — {error.details}</>}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={retry}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                    >
                      Retry
                    </button>
                    {currentIndex > 0 && (
                      <button
                        onClick={goPrev}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                      >
                        Previous Channel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {state === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <p className="text-gray-500 text-sm">Waiting for stream...</p>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <div className="bg-gray-900 px-4 py-2 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold truncate">{currentChannel.name}</h2>
                  <p className="text-xs text-gray-500 truncate">{currentChannel.group}</p>
                </div>
              </div>
            </div>

            <PlayerControlsBar
              state={state}
              volume={volume}
              muted={muted}
              onVolumeChange={setVolume}
              onMutedChange={setMuted}
              onFullscreen={toggleFullscreen}
              onPiP={togglePiP}
              onPrevChannel={currentIndex > 0 ? goPrev : undefined}
              onNextChannel={currentIndex < channels.length - 1 ? goNext : undefined}
              hasPrev={currentIndex > 0}
              hasNext={currentIndex < channels.length - 1}
              pipSupported={pipSupported}
              onPlayPause={() => {
                if (state === 'playing') controls?.pause()
                else controls?.play()
              }}
            />

            <PlayerStatus
              mode={mode}
              error={error}
              streamUrl={currentChannel.url}
              collapsed={statusCollapsed}
              onToggle={() => setStatusCollapsed((p) => !p)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-950 min-h-0">
          <div className="text-center px-6">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-300">
              Select a Channel
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Choose a channel from the list on the left to start watching live TV.
            </p>
          </div>
        </div>
      )}

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((p) => !p)}
        className="lg:hidden fixed bottom-4 right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  )
}
