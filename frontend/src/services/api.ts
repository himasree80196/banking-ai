import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; username: string; full_name: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
}

// User
export const userApi = {
  me: () => api.get('/users/me'),
  update: (data: { full_name?: string; phone?: string; avatar_url?: string }) =>
    api.put('/users/me', data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/users/me/change-password', { current_password, new_password }),
}

// Chat
export const chatApi = {
  sessions: () => api.get('/chat/sessions'),
  session: (id: number) => api.get(`/chat/sessions/${id}`),
  send: (content: string, session_id?: number) =>
    api.post('/chat/send', { content, session_id }),
  deleteSession: (id: number) => api.delete(`/chat/sessions/${id}`),
}

// Loan
export const loanApi = {
  predict: (data: object) => api.post('/loan/predict', data),
  history: (page = 1, page_size = 10, eligible_only?: boolean) => {
    const params: Record<string, unknown> = { page, page_size }
    if (eligible_only !== undefined) params.eligible_only = eligible_only
    return api.get('/loan/history', { params })
  },
  detail: (id: number) => api.get(`/loan/history/${id}`),
}

// Admin
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (page = 1, page_size = 20) => api.get('/admin/users', { params: { page, page_size } }),
  toggleUser: (id: number) => api.put(`/admin/users/${id}/toggle-active`),
  loans: (page = 1, page_size = 20) => api.get('/admin/loans', { params: { page, page_size } }),
  auditLogs: (page = 1, page_size = 50) => api.get('/admin/audit-logs', { params: { page, page_size } }),
}
