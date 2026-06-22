import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loanApi } from '../services/api'
import { LoanResult } from '../types'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, ChevronRight, RotateCcw, DollarSign, IndianRupee, ArrowLeftRight } from 'lucide-react'
import clsx from 'clsx'

const USD_TO_INR = 84
type Currency = 'USD' | 'INR'

function toUSD(value: number, currency: Currency): number {
  return currency === 'INR' ? Math.round(value / USD_TO_INR) : value
}

function convertHint(value: number, currency: Currency): string {
  if (!value || isNaN(value)) return ''
  if (currency === 'INR') return `≈ $${Math.round(value / USD_TO_INR).toLocaleString('en-US')}`
  return `≈ ₹${Math.round(value * USD_TO_INR).toLocaleString('en-IN')}`
}

const schema = z.object({
  age: z.coerce.number().int().min(18).max(80),
  gender: z.enum(['Male', 'Female', 'Other']),
  employment_status: z.enum(['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired']),
  occupation: z.string().min(1, 'Required'),
  monthly_income: z.coerce.number().positive('Must be positive'),
  existing_emi: z.coerce.number().min(0),
  loan_amount: z.coerce.number().positive('Must be positive'),
  loan_tenure: z.coerce.number().int().min(1).max(360),
  credit_score: z.coerce.number().int().min(300).max(900),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  dependents: z.coerce.number().int().min(0).max(10),
  education: z.enum(['High School', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other']),
  residential_status: z.enum(['Owned', 'Rented', 'Mortgaged', 'Parental']),
})
type FormData = z.infer<typeof schema>

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function CurrencyToggle({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
      <button type="button" onClick={() => onChange('USD')}
        className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          currency === 'USD' ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm'
            : 'text-gray-500 hover:text-gray-700')}>
        <DollarSign size={14} /> USD
      </button>
      <ArrowLeftRight size={12} className="text-gray-400" />
      <button type="button" onClick={() => onChange('INR')}
        className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          currency === 'INR' ? 'bg-white dark:bg-gray-700 text-orange-700 dark:text-orange-300 shadow-sm'
            : 'text-gray-500 hover:text-gray-700')}>
        <IndianRupee size={14} /> INR
      </button>
    </div>
  )
}

function MoneyInput({ register, name, currency, step, min, watchValue }:
  { register: any; name: keyof FormData; currency: Currency; step?: number; min?: number; watchValue: number }) {
  const symbol = currency === 'INR' ? '₹' : '$'
  const hint = convertHint(watchValue, currency)
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">{symbol}</span>
      <input {...register(name)} type="number" min={min ?? 0}
        step={step ?? (currency === 'INR' ? 1000 : 100)} className="input-field pl-7" />
      {hint && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 pointer-events-none">{hint}</span>
      )}
    </div>
  )
}

function ResultPanel({ result, onReset }: { result: LoanResult; onReset: () => void }) {
  const pct = Math.round(result.approval_probability * 100)
  return (
    <div className="animate-slide-up space-y-6">
      <div className={clsx('card border-2', result.is_eligible ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-red-400 bg-red-50 dark:bg-red-900/10')}>
        <div className="flex items-center gap-4">
          {result.is_eligible ? <CheckCircle size={48} className="text-green-500 flex-shrink-0" /> : <XCircle size={48} className="text-red-500 flex-shrink-0" />}
          <div>
            <h2 className={clsx('text-2xl font-bold', result.is_eligible ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
              {result.is_eligible ? 'Loan Approved!' : 'Loan Not Approved'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{result.explanation}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { label: 'Approval Probability', value: `${pct}%`, color: pct >= 50 ? 'text-green-600' : 'text-red-600', bar: pct, barColor: pct >= 50 ? 'bg-green-500' : 'bg-red-500' },
            { label: 'Risk Score', value: result.risk_score.toFixed(0), color: result.risk_score < 40 ? 'text-green-600' : result.risk_score < 60 ? 'text-yellow-600' : 'text-red-600', sub: result.risk_score < 40 ? 'Low Risk' : result.risk_score < 60 ? 'Medium Risk' : 'High Risk' },
          ].map(({ label, value, color, bar, barColor, sub }) => (
            <div key={label} className="text-center p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={clsx('text-3xl font-bold', color)}>{value}</p>
              {bar !== undefined && <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2"><div className={clsx('h-2 rounded-full', barColor)} style={{ width: `${bar}%` }} /></div>}
              {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" />Recommendations</h3>
        <ul className="space-y-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <ChevronRight size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />{r}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onReset} className="btn-secondary w-full flex items-center justify-center gap-2"><RotateCcw size={16} />New Application</button>
    </div>
  )
}

export default function LoanPredictor() {
  const [result, setResult] = useState<LoanResult | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { existing_emi: 0, dependents: 0 },
  })

  const watchedIncome = watch('monthly_income') || 0
  const watchedEmi = watch('existing_emi') || 0
  const watchedLoan = watch('loan_amount') || 0

  const mutation = useMutation({
    mutationFn: (data: FormData) => loanApi.predict({
      ...data,
      monthly_income: toUSD(data.monthly_income, currency),
      existing_emi: toUSD(data.existing_emi, currency),
      loan_amount: toUSD(data.loan_amount, currency),
    }),
    onSuccess: (res) => setResult(res.data),
    onError: () => toast.error('Prediction failed. Please try again.'),
  })

  if (result) return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="page-header mb-6">Prediction Result</h1>
      <ResultPanel result={result} onReset={() => { setResult(null); reset() }} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-header">Loan Eligibility Predictor</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Fill in your details for an instant AI-powered eligibility assessment</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <CurrencyToggle currency={currency} onChange={(c) => { setCurrency(c); reset({ ...watch(), monthly_income: undefined as any, existing_emi: 0, loan_amount: undefined as any }) }} />
            <p className="text-xs text-gray-400">{currency === 'INR' ? 'Rate: 1 USD = ₹84' : 'Rate: ₹84 = 1 USD'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Personal Info */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Age" error={errors.age?.message}><input {...register('age')} type="number" min={18} max={80} className="input-field" /></Field>
            <Field label="Gender" error={errors.gender?.message}>
              <select {...register('gender')} className="input-field"><option value="">Select...</option>{['Male','Female','Other'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Marital Status" error={errors.marital_status?.message}>
              <select {...register('marital_status')} className="input-field"><option value="">Select...</option>{['Single','Married','Divorced','Widowed'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Dependents" error={errors.dependents?.message}><input {...register('dependents')} type="number" min={0} max={10} className="input-field" /></Field>
            <Field label="Education" error={errors.education?.message}>
              <select {...register('education')} className="input-field"><option value="">Select...</option>{['High School','Diploma','Bachelor','Master','PhD','Other'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Residential Status" error={errors.residential_status?.message}>
              <select {...register('residential_status')} className="input-field"><option value="">Select...</option>{['Owned','Rented','Mortgaged','Parental'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
          </div>
        </div>

        {/* Employment & Income */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Employment & Income</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employment Status" error={errors.employment_status?.message}>
              <select {...register('employment_status')} className="input-field"><option value="">Select...</option>{['Employed','Self-Employed','Unemployed','Student','Retired'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Occupation" error={errors.occupation?.message}><input {...register('occupation')} type="text" placeholder="Software Engineer" className="input-field" /></Field>
            <Field label={`Monthly Income (${currency})`} error={errors.monthly_income?.message}>
              <MoneyInput register={register} name="monthly_income" currency={currency} step={currency === 'INR' ? 5000 : 100} min={0} watchValue={Number(watchedIncome)} />
            </Field>
            <Field label={`Existing EMI (${currency})`} error={errors.existing_emi?.message}>
              <MoneyInput register={register} name="existing_emi" currency={currency} step={currency === 'INR' ? 1000 : 50} min={0} watchValue={Number(watchedEmi)} />
            </Field>
          </div>
        </div>

        {/* Loan Details */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Loan Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`Loan Amount (${currency})`} error={errors.loan_amount?.message}>
              <MoneyInput register={register} name="loan_amount" currency={currency} step={currency === 'INR' ? 50000 : 1000} min={currency === 'INR' ? 50000 : 1000} watchValue={Number(watchedLoan)} />
            </Field>
            <Field label="Loan Tenure (months)" error={errors.loan_tenure?.message}><input {...register('loan_tenure')} type="number" min={1} max={360} className="input-field" /></Field>
            <Field label="Credit Score (300–900)" error={errors.credit_score?.message}><input {...register('credit_score')} type="number" min={300} max={900} className="input-field" /></Field>
          </div>
          {currency === 'INR' && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <IndianRupee size={12} />
                INR amounts are auto-converted to USD (÷ 84) before processing. Blue hint shows the equivalent USD value.
              </p>
            </div>
          )}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2">
          {mutation.isPending ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</> : 'Check Eligibility'}
        </button>
      </form>
    </div>
  )
}