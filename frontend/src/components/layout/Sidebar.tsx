import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, MessageSquare, CreditCard, History, User, Settings, Shield, X, Building2, ArrowLeftRight } from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps { open: boolean; onClose: () => void }

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/loan', icon: CreditCard, label: 'Loan Predictor' },
  { to: '/loan/compare', icon: ArrowLeftRight, label: 'Loan Comparison' },
  { to: '/loan/history', icon: History, label: 'Loan History' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onClose} />}
      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-30 w-64 bg-banking-navy dark:bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SmartBank AI</p>
              <p className="text-gray-400 text-xs">Banking Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/loan'} onClick={onClose} className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" onClick={onClose} className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mt-2',
              isActive
                ? 'bg-amber-600 text-white'
                : 'text-amber-400 hover:bg-amber-900/30 hover:text-amber-300'
            )}>
              <Shield size={18} />
              Admin Panel
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
