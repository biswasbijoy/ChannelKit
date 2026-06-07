import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { HomeScreen } from '../components/layout/HomeScreen'
import { ChannelBrowser } from '../components/channels/ChannelList'
import { StreamingScreen } from '../components/player/VideoPlayer'
import { SettingsScreen } from '../components/layout/SettingsScreen'
import { GuideScreen } from '../components/epg/GuideScreen'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'

export function App() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/channels" element={<ChannelBrowser />} />
          <Route path="/watch/:channelId" element={<StreamingScreen />} />
          <Route path="/guide" element={<GuideScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </AppShell>
  )
}
