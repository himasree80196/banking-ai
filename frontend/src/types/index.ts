export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: 'user' | 'admin'
  is_active: boolean
  is_verified: boolean
  phone?: string
  avatar_url?: string
  created_at: string
  last_login?: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  tokens_used: number
  created_at: string
}

export interface ChatSession {
  id: number
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
  messages: ChatMessage[]
  message_count?: number
}

export interface LoanInput {
  age: number
  gender: string
  employment_status: string
  occupation: string
  monthly_income: number
  existing_emi: number
  loan_amount: number
  loan_tenure: number
  credit_score: number
  marital_status: string
  dependents: number
  education: string
  residential_status: string
}

export interface LoanResult {
  id: number
  is_eligible: boolean
  approval_probability: number
  risk_score: number
  explanation: string
  recommendations: string[]
  created_at: string
}

export interface LoanHistoryItem {
  id: number
  loan_amount: number
  loan_tenure: number
  credit_score: number
  monthly_income: number
  is_eligible: boolean
  approval_probability: number
  risk_score: number
  created_at: string
}

export interface AdminStats {
  users: { total: number; active: number }
  loans: { total: number; approved: number; rejected: number }
  chat: { total_messages: number; total_sessions: number }
}
