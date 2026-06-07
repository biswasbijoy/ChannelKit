import { useMemo, useState } from 'react'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import type { EpgChannel } from '../../features/epg/epgTypes'

interface ProgramGuideProps {
  epgChannels: EpgChannel[]
}

export function ProgramGuide({ epgChannels }: ProgramGuideProps) {
  const channels = usePlaylistStore((s) => s.channels)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  const now = useMemo(() => new Date(), [])

  const matchedEpg = useMemo(() => {
    return epgChannels
      .map((epgCh) => {
        const match = channels.find(
          (c) => c.tvgId === epgCh.id || c.tvgName === epgCh.name,
        )
        return { epg: epgCh, channel: match ?? null }
      })
      .filter((item) => item.channel !== null)
  }, [epgChannels, channels])

  const currentEntries = useMemo(() => {
    return matchedEpg.map((item) => {
      const current = item.epg.entries.find(
        (e) => e.start <= now && e.end > now,
      )
      const next = item.epg.entries.find((e) => e.start > now)
      return { ...item, current, next }
    })
  }, [matchedEpg, now])

  if (epgChannels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-400">No EPG data loaded</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-bold mb-4">Program Guide</h2>
      {currentEntries.length === 0 && (
        <p className="text-gray-500 text-sm">
          No EPG data matches your channels. Check that your playlist has tvg-id or tvg-name attributes.
        </p>
      )}
      <div className="space-y-2">
        {currentEntries.map(({ epg, channel, current, next }) => (
          <div
            key={epg.id}
            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() =>
              setSelectedChannel(selectedChannel === epg.id ? null : epg.id)
            }
          >
            <div className="flex items-center gap-2 mb-1">
              {channel?.logo && (
                <img
                  src={channel.logo}
                  alt=""
                  className="w-6 h-6 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <span className="font-medium text-sm">
                {channel?.name ?? epg.name}
              </span>
            </div>

            {current && (
              <div className="text-sm">
                <span className="text-green-400 font-medium">Now:</span>{' '}
                {current.title}
                <span className="text-gray-500 text-xs ml-2">
                  {formatTime(current.start)} — {formatTime(current.end)}
                </span>
              </div>
            )}

            {next && selectedChannel === epg.id && (
              <div className="text-sm text-gray-400 mt-1">
                <span className="text-blue-400 font-medium">Next:</span>{' '}
                {next.title}
                <span className="text-gray-600 text-xs ml-2">
                  {formatTime(next.start)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
