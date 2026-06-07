import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { parseM3u } from '../../features/playlist/parseM3u'

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
  const fileName = usePlaylistStore((s) => s.fileName)

  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)

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
        navigate('/channels')
      } else {
        setLocalError('No valid channels found in the playlist')
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }, [navigate, setPlaylist, setError, setLoading])

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

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToHow = () => {
    howRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const displayError = localError || error
  const hasPlaylist = channels.length > 0

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="text-6xl mb-6">📺</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ChannelKit
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-3 max-w-2xl mx-auto">
            Your favorite live TV channels, organized and streamed in one place.
          </p>
          <p className="text-sm text-gray-600 mb-10 max-w-xl mx-auto">
            Upload your M3U playlist and instantly browse, search, and watch thousands of channels
            with a sleek, responsive player.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={hasPlaylist ? () => navigate('/channels') : scrollToUpload}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
            >
              {hasPlaylist ? 'Browse Channels' : 'Get Started'}
            </button>
            {!hasPlaylist && (
              <button
                onClick={scrollToHow}
                className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-lg transition-all hover:scale-105 border border-gray-700"
              >
                How It Works
              </button>
            )}
          </div>
          {hasPlaylist && (
            <p className="mt-6 text-green-400 text-sm">
              ✓ {channels.length} channels loaded{fileName ? ` from ${fileName}` : ''}
            </p>
          )}
        </div>
      </section>

      {/* How It Works */}
      {!hasPlaylist && (
        <section ref={howRef} className="bg-gray-950 border-t border-gray-800">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-14">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: '01', title: 'Upload Your Playlist', desc: 'Drag & drop your .m3u or .m3u8 file, or pick it from your device. Files up to 50MB supported.', icon: '📤' },
                { step: '02', title: 'Browse & Search', desc: 'All your channels are instantly organized. Search by name, filter by group, or sort to find what you want.', icon: '🔍' },
                { step: '03', title: 'Watch & Enjoy', desc: 'Click any channel to start watching. Fullscreen, PiP, volume controls, and keyboard shortcuts included.', icon: '▶' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-xs font-mono text-blue-500 mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-gray-950/50 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-20">
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

      {/* Upload Section */}
      {!hasPlaylist && (
        <section ref={uploadRef} className="bg-gray-950 border-t border-gray-800">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Watch?</h2>
            <p className="text-gray-500 text-sm mb-10">
              Drop your playlist below and start streaming in seconds.
            </p>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={onClick}
              className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
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
      )}

      {/* Loaded state */}
      {hasPlaylist && (
        <section className="bg-gray-950 border-t border-gray-800">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Playlist Loaded</h2>
            <p className="text-gray-400 mb-3">
              {channels.length} channels ready to watch
              {fileName ? <span className="text-gray-600"> from {fileName}</span> : ''}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/channels')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Browse Channels
              </button>
              <button
                onClick={() => navigate(`/watch/${channels[0]?.id}`)}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all hover:scale-105 border border-gray-700"
              >
                Start Watching
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-gray-600">
          <p className="mb-1">ChannelKit &mdash; IPTV streaming app</p>
          <p>Users are responsible for the content they access.</p>
        </div>
      </footer>
    </div>
  )
}
