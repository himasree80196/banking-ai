import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, ArrowLeftRight, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import clsx from 'clsx'

interface Scenario {
  label: string
  principal: number
  annual_rate: number
  tenure_months: number
}

interface ComputedScenario extends Scenario {
  monthly_emi: number
  total_payment: number
  total_interest: number
  color: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const PALETTE = ['blue', 'emerald', 'amber', 'red', 'violet']

function computeEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths
  const r = annualRate / 12 / 100
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { label: 'Scenario A', principal: 50000, annual_rate: 7.5, tenure_months: 60 },
  { label: 'Scenario B', principal: 50000, annual_rate: 9.0, tenure_months: 48 },
]

export default function LoanComparison() {
  const [computed, setComputed] = useState<ComputedScenario[]>([])

  const { register, control, handleSubmit, watch } = useForm<{ scenarios: Scenario[] }>({
    defaultValues: { scenarios: DEFAULT_SCENARIOS },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'scenarios' })

  const onCompare = (data: { scenarios: Scenario[] }) => {
    const results: ComputedScenario[] = data.scenarios.map((s, i) => {
      const p = Number(s.principal)
      const r = Number(s.annual_rate)
      const t = Number(s.tenure_months)
      const emi = computeEMI(p, r, t)
      return {
        ...s,
        principal: p, annual_rate: r, tenure_months: t,
        monthly_emi: emi,
        total_payment: emi * t,
        total_interest: emi * t - p,
        color: COLORS[i % COLORS.length],
      }
    })
    setComputed(results)
  }

  const barData = computed.map(s => ({
    name: s.label,
    'Monthly EMI': Math.round(s.monthly_emi),
    'Total Interest': Math.round(s.total_interest),
    'Principal': Math.round(s.principal),
  }))

  const amortizationData = computed.length > 0 ? Array.from({ length: Math.max(...computed.map(s => s.tenure_months)) }, (_, mo) => {
    const point: Record<string, number> = { month: mo + 1 }
    computed.forEach(s => {
      const r = s.annual_rate / 12 / 100
      let balance = s.principal
      for (let i = 0; i < mo && i < s.tenure_months; i++) {
        const interest = balance * r
        const principal = s.monthly_emi - interest
        balance = Math.max(0, balance - principal)
      }
      point[s.label] = Math.round(balance)
    })
    return point
  }).filter((_, i) => i % Math.max(1, Math.floor(Math.max(...computed.map(s => s.tenure_months)) / 12)) === 0) : []

  const radarData = computed.length > 0 ? [
    { metric: 'Low EMI', ...Object.fromEntries(computed.map(s => [s.label, Math.round((1 - (s.monthly_emi - Math.min(...computed.map(x => x.monthly_emi))) / (Math.max(...computed.map(x => x.monthly_emi)) - Math.min(...computed.map(x => x.monthly_emi)) + 1)) * 100)])) },
    { metric: 'Low Interest', ...Object.fromEntries(computed.map(s => [s.label, Math.round((1 - (s.total_interest - Math.min(...computed.map(x => x.total_interest))) / (Math.max(...computed.map(x => x.total_interest)) - Math.min(...computed.map(x => x.total_interest)) + 1)) * 100)])) },
    { metric: 'Short Tenure', ...Object.fromEntries(computed.map(s => [s.label, Math.round((1 - (s.tenure_months - Math.min(...computed.map(x => x.tenure_months))) / (Math.max(...computed.map(x => x.tenure_months)) - Math.min(...computed.map(x => x.tenure_months)) + 1)) * 100)])) },
    { metric: 'Low Rate', ...Object.fromEntries(computed.map(s => [s.label, Math.round((1 - (s.annual_rate - Math.min(...computed.map(x => x.annual_rate))) / (Math.max(...computed.map(x => x.annual_rate)) - Math.min(...computed.map(x => x.annual_rate)) + 0.01)) * 100)])) },
    { metric: 'Affordable', ...Object.fromEntries(computed.map(s => [s.label, Math.round(100 - (s.monthly_emi / s.principal) * 1000)])) },
  ] : []

  const best = computed.length > 0 ? computed.reduce((a, b) => a.total_interest < b.total_interest ? a : b) : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header flex items-center gap-2"><ArrowLeftRight size={24} className="text-primary-600" />Loan Comparison</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Compare up to 5 loan scenarios side-by-side with interactive charts</p>
      </div>

      {/* Input Panel */}
      <form onSubmit={handleSubmit(onCompare)} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Loan Scenarios</h2>
          {fields.length < 5 && (
            <button type="button" onClick={() => append({ label: `Scenario ${String.fromCharCode(65 + fields.length)}`, principal: 50000, annual_rate: 8.0, tenure_months: 60 })} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
              <Plus size={14} />Add Scenario
            </button>
          )}
        </div>
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <label className="label text-xs">Label</label>
                <input {...register(`scenarios.${i}.label`)} className="input-field py-2 text-sm" style={{ borderColor: COLORS[i % COLORS.length] + '80' }} />
              </div>
              <div>
                <label className="label text-xs">Loan Amount ($)</label>
                <input {...register(`scenarios.${i}.principal`)} type="number" min={1000} step={1000} className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="label text-xs">Annual Rate (%)</label>
                <input {...register(`scenarios.${i}.annual_rate`)} type="number" min={0.1} max={50} step={0.1} className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="label text-xs">Tenure (months)</label>
                <input {...register(`scenarios.${i}.tenure_months`)} type="number" min={1} max={360} step={1} className="input-field py-2 text-sm" />
              </div>
              <div className="flex items-end">
                {fields.length > 1 ? (
                  <button type="button" onClick={() => remove(i)} className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm border border-red-200 dark:border-red-800">
                    <Trash2 size={14} />Remove
                  </button>
                ) : <div />}
              </div>
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary mt-4 w-full py-3 flex items-center justify-center gap-2">
          <ArrowLeftRight size={16} />Compare Scenarios
        </button>
      </form>

      {/* Results */}
      {computed.length > 0 && (
        <>
          {/* Summary Cards */}
          {best && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl flex items-center gap-3">
              <TrendingDown size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>{best.label}</strong> saves the most — lowest total interest at <strong>${fmt(best.total_interest)}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {computed.map((s, i) => (
              <div key={i} className="card border-t-4" style={{ borderTopColor: s.color }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{s.label}</h3>
                  {best?.label === s.label && <span className="badge-success text-xs ml-auto">Best</span>}
                </div>
                <dl className="space-y-2 text-sm">
                  {[
                    { icon: DollarSign, label: 'Monthly EMI', value: `$${fmt(s.monthly_emi)}`, highlight: true },
                    { icon: DollarSign, label: 'Principal', value: `$${fmt(s.principal)}` },
                    { icon: DollarSign, label: 'Total Interest', value: `$${fmt(s.total_interest)}`, negative: true },
                    { icon: DollarSign, label: 'Total Payment', value: `$${fmt(s.total_payment)}` },
                    { icon: Calendar, label: 'Rate / Tenure', value: `${s.annual_rate}% / ${s.tenure_months}mo` },
                  ].map(({ icon: Icon, label, value, highlight, negative }) => (
                    <div key={label} className={clsx('flex items-center justify-between py-1.5', highlight ? 'border-b border-gray-100 dark:border-gray-800 pb-2 mb-1' : '')}>
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Icon size={12} />{label}</span>
                      <span className={clsx('font-semibold', highlight ? 'text-lg' : '', negative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>{value}</span>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">EMI & Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${fmt(v)}`, '']} />
                  <Legend />
                  <Bar dataKey="Monthly EMI" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Total Interest" fill="#ef4444" radius={[3,3,0,0]} />
                  <Bar dataKey="Principal" fill="#10b981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Outstanding Balance Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={amortizationData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${fmt(v)}`, 'Balance']} />
                  <Legend />
                  {computed.map((s, i) => (
                    <Line key={s.label} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {computed.length >= 2 && (
              <div className="card lg:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Scenario Radar Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {computed.map((s, i) => (
                      <Radar key={s.label} name={s.label} dataKey={s.label} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2} />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 text-center mt-2">Higher score = better for that dimension</p>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Comparison Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Metric</th>
                    {computed.map((s, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: s.color }}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: 'Loan Amount', fn: (s: ComputedScenario) => `$${fmt(s.principal)}` },
                    { label: 'Interest Rate', fn: (s: ComputedScenario) => `${s.annual_rate}%` },
                    { label: 'Tenure', fn: (s: ComputedScenario) => `${s.tenure_months} months (${(s.tenure_months/12).toFixed(1)} yrs)` },
                    { label: 'Monthly EMI', fn: (s: ComputedScenario) => `$${fmt(s.monthly_emi)}`, highlight: true },
                    { label: 'Total Interest', fn: (s: ComputedScenario) => `$${fmt(s.total_interest)}`, negative: true },
                    { label: 'Total Payment', fn: (s: ComputedScenario) => `$${fmt(s.total_payment)}` },
                    { label: 'Interest %', fn: (s: ComputedScenario) => `${((s.total_interest / s.total_payment) * 100).toFixed(1)}%` },
                  ].map(({ label, fn, highlight, negative }) => {
                    const values = computed.map(s => ({ s, val: fn(s) }))
                    return (
                      <tr key={label} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-500 font-medium">{label}</td>
                        {values.map(({ s, val }, j) => (
                          <td key={j} className={clsx('px-4 py-3 font-semibold', highlight ? 'text-gray-900 dark:text-white text-base' : negative ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
