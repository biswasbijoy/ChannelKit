import { type ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'
import { useAuthStore } from '../../features/auth/authStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const channels = usePlaylistStore((s) => s.channels)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const loadFromServer = usePlaylistStore((s) => s.loadFromServer)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      loadFromServer()
    }
  }, [user, loadFromServer])

  const hasPlaylist = channels.length > 0
  const isWatchPage = location.pathname.startsWith('/watch/')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/channels', label: 'Channels', show: hasPlaylist },

    { to: '/settings', label: 'Settings', show: true },
  ]

  return (
    <div className={`flex flex-col ${isWatchPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <header className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-bold text-blue-400">
            IPTV Player
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
            {!isAuthPage && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-700">
                {user ? (
                  <>
                    <span className="text-sm text-gray-400">{user.name}</span>
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
      <main className={`flex-1 flex flex-col min-h-0 ${isWatchPage ? 'overflow-hidden' : ''}`}>
        {children}
      </main>
    </div>
  )
}
