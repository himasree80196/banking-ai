import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loanApi } from '../services/api'
import { LoanHistoryItem } from '../types'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import clsx from 'clsx'

export default function LoanHistory() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<boolean | undefined>(undefined)
  const { data, isLoading } = useQuery({
    queryKey: ['loan-history', page, filter],
    queryFn: () => loanApi.history(page, 10, filter),
  })

  const predictions: LoanHistoryItem[] = data?.data?.predictions || []
  const total = data?.data?.total || 0
  const totalPages = Math.ceil(total / 10)

  const chartData = predictions.map(p => ({
    id: `#${p.id}`,
    probability: Math.round(p.approval_probability * 100),
    eligible: p.is_eligible,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Loan History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filter === undefined ? '' : String(filter)} onChange={e => { setFilter(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1) }} className="input-field py-2 text-sm w-40">
            <option value="">All</option>
            <option value="true">Approved Only</option>
            <option value="false">Rejected Only</option>
          </select>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Approval Probability by Application</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Approval Probability']} />
              <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.eligible ? '#22c55e' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-40" />
            <p>No loan applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['ID', 'Date', 'Amount', 'Tenure', 'Credit Score', 'Income', 'Probability', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {predictions.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{p.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${p.loan_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.loan_tenure}mo</td>
                    <td className="px-4 py-3">
                      <span className={clsx('font-semibold', p.credit_score >= 700 ? 'text-green-600 dark:text-green-400' : p.credit_score >= 600 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')}>{p.credit_score}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">${p.monthly_income.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-16">
                          <div className={clsx('h-1.5 rounded-full', p.is_eligible ? 'bg-green-500' : 'bg-red-500')} style={{ width: `${Math.round(p.approval_probability * 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium">{Math.round(p.approval_probability * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_eligible ? (
                        <span className="badge-success flex items-center gap-1"><CheckCircle size={12} />Approved</span>
                      ) : (
                        <span className="badge-danger flex items-center gap-1"><XCircle size={12} />Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40"><ChevronLeft size={14} />Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40">Next<ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
