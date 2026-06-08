import { useRef, useState } from 'react'
import { useAuthStore } from '../../features/auth/authStore'
import { api } from '../../features/api/client'
import { usePreferences } from '../../features/storage/preferences'
import { useTheme } from '../../features/theme/useTheme'

type Theme = 'system' | 'dark' | 'light'

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: '💻' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
]

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, setTheme } = useTheme()
  const { volume, muted, setVolume, setMuted } = usePreferences()

  const [name, setName] = useState(user?.name ?? '')
  const originalName = user?.name ?? ''
  const nameChanged = name !== originalName
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordsMatch = newPassword === confirmPassword
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const { data } = await api.put('/auth/me', { name })
      setUser(data)
      setSaveMsg('Profile updated')
    } catch (err: any) {
      setSaveMsg(err.response?.data?.error ?? 'Failed to update profile')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const handleChangePassword = async () => {
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      setPasswordMsg('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordMsg(err.response?.data?.error ?? 'Failed to update password')
    } finally {
      setSavingPassword(false)
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const avatar = reader.result as string
        const { data } = await api.put('/auth/avatar', { avatar })
        setUser(data)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 w-full space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Profile</h2>
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div
                onClick={() => avatarRef.current?.click()}
                className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden cursor-pointer ring-2 ring-gray-700 hover:ring-blue-500 transition-all flex items-center justify-center"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-500">
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <button
                onClick={() => avatarRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Change photo
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving || !nameChanged}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg === 'Profile updated' ? 'text-green-400' : 'text-red-400'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Password */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                confirmPassword && !passwordsMatch
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="Re-enter new password"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !passwordsMatch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
            {passwordMsg && (
              <span className={`text-sm ${passwordMsg === 'Password updated' ? 'text-green-400' : 'text-red-400'}`}>
                {passwordMsg}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Theme</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex flex-wrap gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 justify-center ${
                  theme === opt.value
                    ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                    : 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span>{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Playback */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Playback</h2>
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Default Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full accent-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
              className="accent-blue-500"
            />
            Start muted
          </label>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="text-lg font-semibold mb-3">About</h2>
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
          <p className="flex items-center gap-1.5"><img src="/logo.png" alt="" className="h-4 w-4" /> ChannelKit v1.0.0</p>
          <p>This app plays streams from user-provided M3U playlists.</p>
          <p>Users are responsible for the content they access.</p>
        </div>
      </section>
    </div>
  )
}
