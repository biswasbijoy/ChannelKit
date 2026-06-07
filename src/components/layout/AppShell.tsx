import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePlaylistStore } from '../../features/playlist/playlistStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const channels = usePlaylistStore((s) => s.channels)
  const hasPlaylist = channels.length > 0
  const isWatchPage = location.pathname.startsWith('/watch/')

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/channels', label: 'Channels', show: hasPlaylist },
    { to: '/guide', label: 'Guide', show: true },
    { to: '/settings', label: 'Settings', show: true },
  ]

  return (
    <div className={`flex flex-col ${isWatchPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <header className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-bold text-blue-400">
            IPTV Player
          </Link>
          <div className="flex gap-4">
            {navLinks
              .filter((l) => l.show)
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
        </nav>
      </header>
      <main className={`flex-1 flex flex-col min-h-0 ${isWatchPage ? 'overflow-hidden' : ''}`}>
        {children}
      </main>
    </div>
  )
}
