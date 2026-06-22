import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Building2, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric & underscores only'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

type FormData = z.infer<typeof schema>

export default function Register() {
  const { register: registerUser, login } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ email: data.email, username: data.username, full_name: data.full_name, password: data.password })
      await login(data.email, data.password)
      toast.success('Account created! Welcome to SmartBank AI')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-navy to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-white/60 mt-2">Join SmartBank AI today</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: 'full_name' as const, label: 'Full Name', type: 'text', placeholder: 'John Doe' },
              { name: 'username' as const, label: 'Username', type: 'text', placeholder: 'johndoe' },
              { name: 'email' as const, label: 'Email', type: 'email', placeholder: 'you@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input {...register(name)} type={type} placeholder={placeholder} className="input-field" />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
              </div>
            ))}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input {...register('confirm_password')} type="password" placeholder="••••••••" className="input-field" />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {isSubmitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
