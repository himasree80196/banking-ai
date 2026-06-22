import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import { authApi, userApi } from '../services/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: { email: string; username: string; full_name: string; password: string }) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await userApi.me()
      setUser(res.data)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { access_token, refresh_token, user: userData } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const register = async (data: { email: string; username: string; full_name: string; password: string }) => {
    await authApi.register(data)
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user,
      login, logout, register, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
