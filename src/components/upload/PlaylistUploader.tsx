import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { parseM3u } from '../../features/playlist/parseM3u'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function PlaylistUploader() {
  const navigate = useNavigate()
  const setPlaylist = usePlaylistStore((s) => s.setPlaylist)
  const isLoading = usePlaylistStore((s) => s.isLoading)
  const error = usePlaylistStore((s) => s.error)
  const setLoading = usePlaylistStore((s) => s.setLoading)
  const setError = usePlaylistStore((s) => s.setError)
  const channels = usePlaylistStore((s) => s.channels)

  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const onDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const onClick = () => {
    inputRef.current?.click()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const displayError = localError || error

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {channels.length > 0 ? (
        <div className="text-center">
          <p className="text-green-400 text-lg mb-2">
            ✓ {channels.length} channels loaded
          </p>
          <button
            onClick={() => navigate('/channels')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg transition-colors"
          >
            Browse Channels
          </button>
          <button
            onClick={onClick}
            className="ml-4 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg transition-colors"
          >
            Load Different Playlist
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".m3u,.m3u8"
            onChange={onChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.png" alt="" className="h-10 w-10" />
            <h1 className="text-3xl font-bold">ChannelKit</h1>
          </div>
          <p className="text-gray-400 mb-8">Upload an M3U playlist to get started</p>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={onClick}
            className={`w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
            }`}
          >
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg mb-2">
              {dragOver ? 'Drop your file here' : 'Drag & drop your playlist here'}
            </p>
            <p className="text-sm text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-600 mt-2">Supports .m3u and .m3u8 files up to 50MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".m3u,.m3u8"
            onChange={onChange}
            className="hidden"
          />

          {isLoading && (
            <div className="mt-6 text-blue-400 animate-pulse">
              Parsing playlist...
            </div>
          )}

          {displayError && (
            <div className="mt-6 bg-red-900/50 border border-red-700 rounded-lg p-4 max-w-lg w-full">
              <p className="text-red-300 text-sm">{displayError}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
