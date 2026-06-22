import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Globe, Bell, Shield } from 'lucide-react'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-header">Settings</h1>

      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Sun size={18} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-500">Switch between light and dark themes</p>
          </div>
          <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={16} className="text-gray-400" /> : <Sun size={16} className="text-amber-500" />}
            <p className="text-sm text-gray-600 dark:text-gray-400">Current: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong> mode</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={18} className="text-primary-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
        </div>
        {[
          { label: 'Loan Status Updates', desc: 'Get notified when loan status changes', default: true },
          { label: 'Chat Notifications', desc: 'New message alerts', default: false },
          { label: 'Weekly Summary', desc: 'Weekly financial activity report', default: true },
        ].map(({ label, desc, default: on }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${on ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-green-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <p>Two-Factor Authentication</p>
            <span className="badge-warning">Coming Soon</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <p>Active Sessions</p>
            <span className="badge-success">1 active</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Language & Region</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Language</label>
            <select className="input-field"><option>English (US)</option><option>Spanish</option><option>French</option><option>Arabic</option></select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input-field"><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option><option>INR (₹)</option></select>
          </div>
        </div>
      </div>
    </div>
  )
}
