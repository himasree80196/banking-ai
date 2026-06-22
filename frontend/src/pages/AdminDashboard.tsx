import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/api'
import { AdminStats } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Users, CreditCard, MessageSquare, TrendingUp, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()
  const { data: statsData } = useQuery<{ data: AdminStats }>({ queryKey: ['admin-stats'], queryFn: adminApi.stats })
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.users() })

  const stats: AdminStats | undefined = statsData?.data
  const users = usersData?.data?.users || []

  const toggleUser = useMutation({
    mutationFn: (id: number) => adminApi.toggleUser(id),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }) },
    onError: () => toast.error('Failed to update user'),
  })

  const loanChartData = stats ? [
    { name: 'Approved', value: stats.loans.approved },
    { name: 'Rejected', value: stats.loans.rejected },
  ] : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield size={24} className="text-amber-500" />
        <h1 className="page-header">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.users.total ?? '—'} sub={`${stats?.users.active ?? 0} active`} icon={Users} color="text-blue-600 dark:text-blue-400" />
        <StatCard title="Total Loans" value={stats?.loans.total ?? '—'} sub={`${stats?.loans.approved ?? 0} approved`} icon={CreditCard} color="text-green-600 dark:text-green-400" />
        <StatCard title="Chat Messages" value={stats?.chat.total_messages ?? '—'} sub={`${stats?.chat.total_sessions ?? 0} sessions`} icon={MessageSquare} color="text-purple-600 dark:text-purple-400" />
        <StatCard
          title="Approval Rate"
          value={stats?.loans.total ? `${Math.round((stats.loans.approved / stats.loans.total) * 100)}%` : '—'}
          icon={TrendingUp}
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Loan Approval Distribution</h2>
          {loanChartData.every(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={loanChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-8 text-sm">No loan data yet</p>}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">User Management</h2>
          {usersLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                    {['User', 'Role', 'Joined', 'Status', 'Action'].map(h => (
                      <th key={h} className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.slice(0, 8).map((u: { id: number; full_name: string; email: string; role: string; is_active: boolean; created_at: string }) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">{u.full_name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={u.role === 'admin' ? 'badge-warning' : 'badge-success'}>{u.role}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                      <td className="py-2.5 pr-4">
                        <span className={u.is_active ? 'badge-success' : 'badge-danger'}>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => toggleUser.mutate(u.id)} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
