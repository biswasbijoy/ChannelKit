import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PlaylistUploader } from '../components/upload/PlaylistUploader'
import { ChannelBrowser } from '../components/channels/ChannelList'
import { StreamingScreen } from '../components/player/VideoPlayer'
import { SettingsScreen } from '../components/layout/SettingsScreen'
import { GuideScreen } from '../components/epg/GuideScreen'

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<PlaylistUploader />} />
        <Route path="/channels" element={<ChannelBrowser />} />
        <Route path="/watch/:channelId" element={<StreamingScreen />} />
        <Route path="/guide" element={<GuideScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
