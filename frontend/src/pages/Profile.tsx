import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { userApi } from '../services/api'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'
import { format } from 'date-fns'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const qc = useQueryClient()

  const { register: regProfile, handleSubmit: handleProfile, formState: { isDirty: pDirty } } = useForm({
    defaultValues: { full_name: user?.full_name || '', phone: user?.phone || '' },
  })

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch } = useForm<{ current_password: string; new_password: string; confirm: string }>()

  const updateMutation = useMutation({
    mutationFn: (data: { full_name: string; phone: string }) => userApi.update(data),
    onSuccess: () => { toast.success('Profile updated'); refreshUser() },
    onError: () => toast.error('Update failed'),
  })

  const pwMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => userApi.changePassword(data.current_password, data.new_password),
    onSuccess: () => { toast.success('Password changed'); resetPw() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Password change failed'
      toast.error(msg)
    },
  })

  const onPwSubmit = (data: { current_password: string; new_password: string; confirm: string }) => {
    if (data.new_password !== data.confirm) { toast.error('Passwords do not match'); return }
    pwMutation.mutate({ current_password: data.current_password, new_password: data.new_password })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-header">Profile</h1>
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={user?.role === 'admin' ? 'badge-warning' : 'badge-success'}>{user?.role}</span>
              {user?.is_verified && <span className="badge-success">Verified</span>}
            </div>
          </div>
        </div>
        {user?.last_login && (
          <p className="text-xs text-gray-400 mt-4">Last login: {format(new Date(user.last_login), 'PPpp')}</p>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['profile', 'password'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'profile' ? <User size={16} /> : <Lock size={16} />}
            {t === 'profile' ? 'Edit Profile' : 'Change Password'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleProfile((d) => updateMutation.mutate(d))} className="card space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...regProfile('full_name')} className="input-field" />
          </div>
          <div>
            <label className="label">Username</label>
            <input value={user?.username} disabled className="input-field opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...regProfile('phone')} type="tel" placeholder="+1-555-0100" className="input-field" />
          </div>
          <button type="submit" disabled={!pDirty || updateMutation.isPending} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePw(onPwSubmit)} className="card space-y-4">
          {[
            { name: 'current_password' as const, label: 'Current Password' },
            { name: 'new_password' as const, label: 'New Password' },
            { name: 'confirm' as const, label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input {...regPw(name, { required: true })} type="password" className="input-field" />
            </div>
          ))}
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary flex items-center gap-2">
            <Lock size={16} />
            {pwMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
