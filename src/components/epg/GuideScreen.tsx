import { useEpgStore } from '../../features/epg/epgStore'
import { ProgramGuide } from './ProgramGuide'
import { EpgUploader } from '../upload/EpgUploader'

export function GuideScreen() {
  const epgChannels = useEpgStore((s) => s.channels)
  const clearEpgData = useEpgStore((s) => s.clearEpgData)

  if (epgChannels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-2">Program Guide</h1>
        <p className="text-gray-400 mb-6">
          Upload an XMLTV EPG file to see program information
        </p>
        <div className="w-full max-w-md">
          <EpgUploader />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Program Guide</h1>
        <div className="flex gap-2">
          <button
            onClick={clearEpgData}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
          >
            Clear EPG
          </button>
        </div>
      </div>
      <ProgramGuide epgChannels={epgChannels} />
    </div>
  )
}
