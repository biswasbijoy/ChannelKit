import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { usePreferences } from '../../features/storage/preferences'
import { useEpgStore } from '../../features/epg/epgStore'
import { EpgUploader } from '../upload/EpgUploader'

export function SettingsScreen() {
  const clearPlaylist = usePlaylistStore((s) => s.clearPlaylist)
  const channels = usePlaylistStore((s) => s.channels)
  const epgChannels = useEpgStore((s) => s.channels)
  const clearEpgData = useEpgStore((s) => s.clearEpgData)
  const { volume, muted, setVolume, setMuted } = usePreferences()

  return (
    <div className="max-w-2xl mx-auto p-6 w-full">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Playback</h2>
        <div className="space-y-4 bg-gray-900 rounded-lg p-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Default Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full accent-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
              className="accent-blue-500"
            />
            Start muted
          </label>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Playlist</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">
            {channels.length > 0
              ? `${channels.length} channels loaded`
              : 'No playlist loaded'}
          </p>
          {channels.length > 0 && (
            <button
              onClick={clearPlaylist}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Clear Playlist
            </button>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">EPG / Program Guide</h2>
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <EpgUploader />
          {epgChannels.length > 0 && (
            <button
              onClick={clearEpgData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Clear EPG Data ({epgChannels.length} channels)
            </button>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">About</h2>
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
          <p>IPTV Player v1.0.0</p>
          <p>This app plays streams from user-provided M3U playlists.</p>
          <p>Users are responsible for the content they access.</p>
        </div>
      </section>
    </div>
  )
}
