import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { getCountryName, getFlagImageUrl } from '../../features/countries/iso3166'

export function CountryPicker() {
  const availableDefaults = usePlaylistStore((s) => s.availableDefaults)
  const loadDefaultPlaylistByCode = usePlaylistStore((s) => s.loadDefaultPlaylistByCode)
  const isLoading = usePlaylistStore((s) => s.isLoading)

  if (availableDefaults.length === 0) return null

  return (
    <section className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Choose a Country</h2>
        <p className="text-gray-500 text-sm mb-8">
          Pick a default playlist to start watching instantly
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {availableDefaults.map((entry) => {
            const name = entry.code === 'others' ? 'Other Channels' : (getCountryName(entry.code) ?? entry.code.toUpperCase())
            const isOthers = entry.code === 'others'
            return (
              <button
                key={entry.code}
                onClick={() => loadDefaultPlaylistByCode(entry.code)}
                disabled={isLoading}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-3 rounded-xl border border-gray-700/50 transition-all hover:scale-105"
              >
                {isOthers ? (
                  <svg className="w-7 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <img
                    src={getFlagImageUrl(entry.code)}
                    alt={name}
                    className="w-7 h-5 rounded object-cover"
                  />
                )}
                <span className="font-medium">{name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
