import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useAuthStore } from '../../features/auth/authStore'
import { parseM3u } from '../../features/playlist/parseM3u'
import { CountryPicker } from '../countries/CountryPicker'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const categories = [
  { name: 'Sports', icon: '⚽', gradient: 'from-green-600 to-emerald-900' },
  { name: 'News', icon: '📰', gradient: 'from-blue-600 to-indigo-900' },
  { name: 'Movies', icon: '🎬', gradient: 'from-purple-600 to-violet-900' },
  { name: 'Music', icon: '🎵', gradient: 'from-pink-600 to-rose-900' },
  { name: 'Documentary', icon: '🎥', gradient: 'from-amber-600 to-orange-900' },
  { name: 'Kids', icon: '🧸', gradient: 'from-teal-600 to-cyan-900' },
]

export function HomeScreen() {
  const navigate = useNavigate()
  const channels = usePlaylistStore((s) => s.channels)
  const setPlaylist = usePlaylistStore((s) => s.setPlaylist)
  const isLoading = usePlaylistStore((s) => s.isLoading)
  const error = usePlaylistStore((s) => s.error)
  const setLoading = usePlaylistStore((s) => s.setLoading)
  const setError = usePlaylistStore((s) => s.setError)
  const saveToServer = usePlaylistStore((s) => s.saveToServer)
  const loadFromServer = usePlaylistStore((s) => s.loadFromServer)
  const user = useAuthStore((s) => s.user)

  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadFromServer()
    }
  }, [user])

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)
    setError(null)
    if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
      setLocalError('Please select a valid .m3u or .m3u8 file')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setLocalError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 50MB`)
      return
    }
    setLoading(true)
    try {
      const text = await file.text()
      const result = parseM3u(text, file.name)
      setPlaylist(result, file.name)
      if (result.channels.length > 0) {
        if (localStorage.getItem('iptv-token')) {
          await saveToServer()
        }
        navigate('/channels')
      } else {
        setLocalError('No valid channels found in the playlist')
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }, [navigate, setPlaylist, setError, setLoading, saveToServer])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const onClick = () => inputRef.current?.click()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const displayError = localError || error
  const hasPlaylist = channels.length > 0
  const showUpload = user && !hasPlaylist
  const showAuthPrompt = !user && !hasPlaylist

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
          <img src="/logo.png" alt="ChannelKit" className="h-16 w-16 mx-auto mb-4 drop-shadow-[0_0_12px_rgba(0,0,0,0.3)]" />
          <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ChannelKit
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
            Your favorite live TV channels, organized and streamed in one place.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {hasPlaylist ? (
              <>
                <button
                  onClick={() => navigate('/channels')}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
                >
                  Browse Channels
                </button>
                <button
                  onClick={() => navigate(`/watch/${channels[0]?.id}`)}
                  className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-lg transition-all hover:scale-105 border border-gray-700"
                >
                  Start Watching
                </button>
              </>
            ) : user ? (
              <button
                onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
              >
                Upload Playlist
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/watch/demo"
                  className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-lg transition-all hover:scale-105 border border-gray-700"
                >
                  Watch SomoyTV
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="text-sm text-gray-500 mt-6 max-w-lg mx-auto">
              Sign up to watch many live TV channels and access all features. No credit card required.
            </p>
          )}
          {hasPlaylist && (
            <p className="mt-6 text-green-400 text-sm">
              ✓ {channels.length} channels loaded
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-950/50 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Explore Categories
          </h2>
          <p className="text-gray-500 text-sm text-center mb-12 max-w-md mx-auto">
            IPTV playlists typically include channels from all these categories and more.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className={`bg-gradient-to-br ${cat.gradient} rounded-xl p-6 text-center hover:scale-105 transition-transform cursor-default`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth prompt for logged-out users */}
      {showAuthPrompt && (
        <section className="bg-gray-950 border-t border-gray-800">
          <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-center">
            <div className="text-5xl mb-5">🔒</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Sign in to Start Watching</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
              Create a free account to upload your playlist and stream live TV channels. Your playlists and preferences are saved securely.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/signup"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all hover:scale-105 border border-gray-700"
              >
                I Already Have an Account
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Country picker + Upload for logged-in users without a playlist */}
      {showUpload && (
        <>
          <CountryPicker />
          <section ref={uploadRef} className="bg-gray-950 border-t border-gray-800">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Or Upload Your Own</h2>
              <p className="text-gray-500 text-sm mb-8 sm:mb-10">
                Drop your .m3u playlist below and start streaming in seconds.
              </p>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={onClick}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-400 bg-blue-900/20 scale-[1.02]'
                    : 'border-gray-700 hover:border-gray-500 bg-gray-900/40 hover:bg-gray-900/60'
                }`}
              >
                <div className="text-5xl mb-5">📁</div>
                <p className="text-xl mb-2 font-medium">
                  {dragOver ? 'Drop your file here' : 'Drag & drop your playlist'}
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                <p className="text-xs text-gray-600">
                  Supports <span className="font-mono text-gray-500">.m3u</span> and{' '}
                  <span className="font-mono text-gray-500">.m3u8</span> &middot; up to 50MB
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".m3u,.m3u8"
                onChange={onChange}
                className="hidden"
              />
              {isLoading && (
                <div className="mt-8 text-blue-400 animate-pulse flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Parsing playlist...
                </div>
              )}
              {displayError && (
                <div className="mt-8 bg-red-900/40 border border-red-800 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-red-300 text-sm">{displayError}</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-gray-600">
          <img src="/logo.png" alt="" className="h-4 w-4 inline-block align-middle -mt-0.5" /> ChannelKit &mdash; IPTV streaming app
        </div>
      </footer>
    </div>
  )
}
