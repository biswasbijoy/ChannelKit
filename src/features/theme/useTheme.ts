import { useCallback, useEffect, useState } from 'react'

type Theme = 'system' | 'dark' | 'light'

const STORAGE_KEY = 'iptv-theme'

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'system' || raw === 'dark' || raw === 'light') return raw
  } catch { }
  return 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(loadTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  return { theme, setTheme }
}
