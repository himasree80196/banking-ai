import { Menu, Sun, Moon, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps { onMenuClick: () => void }

export default function Header({ onMenuClick }: HeaderProps) {
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden md:block">AI Smart Banking Assistant</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block font-medium">{user?.full_name}</span>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
