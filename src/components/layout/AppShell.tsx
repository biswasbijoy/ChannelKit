import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useAuthStore } from '../../features/auth/authStore'
import { useDemoStore } from '../../features/demo/demoStore'
import { getCountryFlagAndName, getFlagImageUrl, getCountryName } from '../../features/countries/iso3166'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const channels = usePlaylistStore((s) => s.channels)
  const fileName = usePlaylistStore((s) => s.fileName)
  const availableDefaults = usePlaylistStore((s) => s.availableDefaults)
  const loadDefaultPlaylistByCode = usePlaylistStore((s) => s.loadDefaultPlaylistByCode)
  const isLoading = usePlaylistStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const loadFromServer = usePlaylistStore((s) => s.loadFromServer)
  const [countryOpen, setCountryOpen] = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const loadDemo = useDemoStore((s) => s.loadDemo)
  const clearPlaylist = usePlaylistStore((s) => s.clearPlaylist)

  useEffect(() => {
    if (user) {
      loadFromServer()
    } else {
      clearPlaylist()
      loadDemo()
    }
  }, [user, loadFromServer, loadDemo, clearPlaylist])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasPlaylist = channels.length > 0
  const isWatchPage = location.pathname.startsWith('/watch/')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const displayCountry = fileName ? getCountryFlagAndName(fileName) : null

  const demoChannel = useDemoStore((s) => s.channel)

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/channels', label: 'Channels', show: !!user && hasPlaylist },
    { to: '/settings', label: 'Settings', show: !!user },
  ]

  return (
    <div className={`flex flex-col h-screen ${isWatchPage ? 'overflow-hidden' : ''}`}>
      <header className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ChannelKit" className="h-8 w-8" />
            <span className="text-xl font-bold text-blue-400">ChannelKit</span>
          </Link>
          <div className="flex items-center gap-4">
            {navLinks
              .filter((l) => l.show && !isAuthPage)
              .map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    location.pathname === link.to
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            {user && availableDefaults.length > 0 && (
              <div ref={countryRef} className="relative">
                <button
                  onClick={() => setCountryOpen((p) => !p)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors border border-gray-700/50"
                >
                  {displayCountry ? (
                    <>
                      <img
                        src={getFlagImageUrl(displayCountry.code)}
                        alt={displayCountry.name}
                        className="w-5 h-3.5 rounded object-cover"
                      />
                      <span>{displayCountry.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Pick Country</span>
                  )}
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${countryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {countryOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
                    {availableDefaults.map((entry) => {
                      const name = getCountryName(entry.code) ?? entry.code.toUpperCase()
                      const isActive = fileName?.startsWith(entry.code)
                      return (
                        <button
                          key={entry.code}
                          onClick={() => {
                            loadDefaultPlaylistByCode(entry.code)
                            setCountryOpen(false)
                          }}
                          disabled={isLoading}
                          className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-gray-700 ${
                            isActive ? 'bg-blue-900/30 text-blue-300' : 'text-gray-200'
                          }`}
                        >
                          <img src={getFlagImageUrl(entry.code)} alt={name} className="w-5 h-3.5 rounded object-cover" />
                          <span>{name}</span>
                          {isActive && <span className="ml-auto text-blue-400 text-xs">Active</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {!isAuthPage && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-700">
                {user ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">{user.name}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
      <main className={`flex-1 flex flex-col min-h-0 ${isWatchPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  )
}
