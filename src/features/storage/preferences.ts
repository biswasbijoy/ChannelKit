import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'iptv-player-preferences'

interface Preferences {
  volume: number
  muted: boolean
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as Partial<Preferences>
      return {
        volume: typeof data.volume === 'number' ? data.volume : 0.5,
        muted: typeof data.muted === 'boolean' ? data.muted : false,
      }
    }
  } catch {
    // ignore
  }
  return { volume: 0.5, muted: false }
}

function savePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences)

  useEffect(() => {
    savePreferences(prefs)
  }, [prefs])

  const setVolume = useCallback((volume: number) => {
    setPrefs((p) => ({ ...p, volume: Math.max(0, Math.min(1, volume)) }))
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    setPrefs((p) => ({ ...p, muted }))
  }, [])

  return {
    volume: prefs.volume,
    muted: prefs.muted,
    setVolume,
    setMuted,
  }
}
