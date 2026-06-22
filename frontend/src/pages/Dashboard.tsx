import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { loanApi, chatApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, CreditCard, TrendingUp, TrendingDown, Plus, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' : color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: loanData } = useQuery({ queryKey: ['loan-history'], queryFn: () => loanApi.history(1, 5) })
  const { data: sessionsData } = useQuery({ queryKey: ['chat-sessions'], queryFn: () => chatApi.sessions() })

  const loans = loanData?.data?.predictions || []
  const sessions = sessionsData?.data || []
  const approved = loans.filter((l: { is_eligible: boolean }) => l.is_eligible).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's an overview of your banking activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Loan Applications" value={loans.length} subtitle={`${approved} approved`} icon={CreditCard} color="text-blue-600 dark:text-blue-400" />
        <StatCard title="Approval Rate" value={loans.length ? `${Math.round((approved / loans.length) * 100)}%` : '—'} subtitle="Based on your applications" icon={TrendingUp} color="text-green-600 dark:text-green-400" />
        <StatCard title="Chat Sessions" value={sessions.length} subtitle="Total conversations" icon={MessageSquare} color="text-purple-600 dark:text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Loan Applications</h2>
            <button onClick={() => navigate('/loan/history')} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></button>
          </div>
          {loans.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CreditCard size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No loan applications yet</p>
              <button onClick={() => navigate('/loan')} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus size={14} />Apply Now</button>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((l: { id: number; loan_amount: number; is_eligible: boolean; approval_probability: number; created_at: string }) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    {l.is_eligible ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">${l.loan_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{format(new Date(l.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <span className={l.is_eligible ? 'badge-success' : 'badge-danger'}>{l.is_eligible ? 'Approved' : 'Rejected'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Chat Sessions</h2>
            <button onClick={() => navigate('/chat')} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">Open chat <ChevronRight size={14} /></button>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No chat history yet</p>
              <button onClick={() => navigate('/chat')} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus size={14} />Start Chat</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((s: { id: number; title: string; message_count?: number; updated_at: string }) => (
                <div key={s.id} onClick={() => navigate('/chat')} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <MessageSquare size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.message_count || 0} messages · {format(new Date(s.updated_at), 'MMM d')}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Need a loan? Check eligibility instantly</h3>
            <p className="text-primary-100 text-sm mt-1">Our ML model analyzes 13 factors for accurate predictions</p>
          </div>
          <button onClick={() => navigate('/loan')} className="flex-shrink-0 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-sm">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  )
}
