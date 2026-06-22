import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed'
      toast.error(msg)
    }
  }

  const fillDemo = (role: 'admin' | 'user') => {
    const creds = role === 'admin' ? { email: 'admin@bank.com', password: 'Admin@123' } : { email: 'user@bank.com', password: 'User@123' }
    setValue('email', creds.email); setValue('password', creds.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-navy to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-white/60 mt-2">Sign in to your banking account</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => fillDemo('user')} className="flex-1 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">Demo User</button>
            <button type="button" onClick={() => fillDemo('admin')} className="flex-1 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors">Demo Admin</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" className="input-field pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={18} />}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            No account? <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
