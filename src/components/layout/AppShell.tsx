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
  const [menuOpen, setMenuOpen] = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const hasPlaylist = channels.length > 0
  const isWatchPage = location.pathname.startsWith('/watch/')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const displayCountry = fileName ? getCountryFlagAndName(fileName) : null

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/channels', label: 'Channels', show: !!user && hasPlaylist },
    { to: '/settings', label: 'Settings', show: !!user },
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className={`flex flex-col h-screen ${isWatchPage ? 'overflow-hidden' : ''}`}>
      <header className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={closeMenu}>
            <img src="/logo.png" alt="ChannelKit" className="h-8 w-8" />
            <span className="text-lg sm:text-xl font-bold text-blue-400">ChannelKit</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2">
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
            </div>

            <div className="hidden lg:flex items-center gap-2">
              {user && availableDefaults.length > 0 && (
                <div ref={countryRef} className="relative">
                  <button
                    onClick={() => setCountryOpen((p) => !p)}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors border border-gray-700/50"
                  >
                    {displayCountry ? (
                      <>
                        {displayCountry.code === 'others' ? (
                          <svg className="w-5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <img src={getFlagImageUrl(displayCountry.code)} alt={displayCountry.name} className="w-5 h-3.5 rounded object-cover" />
                        )}
                        <span className="hidden xl:inline">{displayCountry.name}</span>
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
                        const name = entry.code === 'others' ? 'Other Channels' : (getCountryName(entry.code) ?? entry.code.toUpperCase())
                        const isActive = fileName?.startsWith(entry.code)
                        const isOthers = entry.code === 'others'
                        return (
                          <button
                            key={entry.code}
                            onClick={() => {
                              loadDefaultPlaylistByCode(entry.code)
                              setCountryOpen(false)
                            }}
                            disabled={isLoading}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-gray-700 ${isActive ? 'bg-blue-900/30 text-blue-300' : 'text-gray-200'}`}
                          >
                            {isOthers ? (
                              <svg className="w-5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <img src={getFlagImageUrl(entry.code)} alt={name} className="w-5 h-3.5 rounded object-cover shrink-0" />
                            )}
                            <span className="truncate">{name}</span>
                            {isActive && <span className="ml-auto text-blue-400 text-xs shrink-0">Active</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isAuthPage && (
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-700">
                  {user ? (
                    <>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-400 truncate max-w-[120px]">{user.name}</span>
                      </div>
                      <button onClick={logout} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Login</Link>
                      <Link to="/signup" className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors">Sign Up</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMenu}>
          <div className="absolute inset-0 bg-black/50" />
          <div ref={menuRef} className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 space-y-1">
              {navLinks
                .filter((l) => l.show && !isAuthPage)
                .map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className={`block px-4 py-3 rounded-lg text-sm transition-colors ${
                      location.pathname === link.to
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>

            <div className="border-t border-gray-800 p-4 space-y-3">
              {user && availableDefaults.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Playlists</p>
                  {availableDefaults.map((entry) => {
                    const name = entry.code === 'others' ? 'Other Channels' : (getCountryName(entry.code) ?? entry.code.toUpperCase())
                    const isActive = fileName?.startsWith(entry.code)
                    const isOthers = entry.code === 'others'
                    return (
                      <button
                        key={entry.code}
                        onClick={() => { loadDefaultPlaylistByCode(entry.code); closeMenu() }}
                        disabled={isLoading}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-800 ${isActive ? 'bg-blue-900/30 text-blue-300' : 'text-gray-200'}`}
                      >
                        {isOthers ? (
                          <svg className="w-5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <img src={getFlagImageUrl(entry.code)} alt={name} className="w-5 h-3.5 rounded object-cover shrink-0" />
                        )}
                        <span className="truncate">{name}</span>
                        {isActive && <span className="ml-auto text-blue-400 text-xs shrink-0">Active</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="border-t border-gray-800 pt-3 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { logout(); closeMenu() }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors">
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">Login</Link>
                    <Link to="/signup" onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white text-center transition-colors">Sign Up</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col min-h-0 ${isWatchPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  )
}
