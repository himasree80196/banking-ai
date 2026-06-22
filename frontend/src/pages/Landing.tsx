import { useNavigate } from 'react-router-dom'
import { Building2, Shield, Zap, TrendingUp, MessageSquare, CreditCard, ChevronRight, CheckCircle } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-banking-navy via-banking-blue to-primary-900 text-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold">SmartBank AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">Sign In</button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold rounded-lg transition-colors">Get Started</button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
          <Zap size={14} className="text-yellow-400" />
          AI-Powered Banking Assistant
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Smart Banking<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-cyan-300">Powered by AI</span>
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Get instant loan eligibility predictions, personalized financial guidance from our AI assistant, and comprehensive banking insights — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => navigate('/register')} className="flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-primary-500/30">
            Start Free <ChevronRight size={20} />
          </button>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg backdrop-blur-sm transition-all duration-200">
            Sign In
          </button>
        </div>
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { icon: MessageSquare, title: 'AI Banking Chat', desc: 'Ask any banking question — get instant, intelligent answers powered by advanced LLMs.' },
            { icon: CreditCard, title: 'Loan Eligibility', desc: 'ML-powered prediction with approval probability, risk scoring, and recommendations.' },
            { icon: TrendingUp, title: 'Financial Insights', desc: 'Track your loan history, analyze trends, and make data-driven financial decisions.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                <Icon size={24} className="text-primary-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
          {['FDIC Insured', '256-bit Encryption', '24/7 AI Support', 'Zero Hidden Fees'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle size={16} className="text-green-400" />
              {f}
            </div>
          ))}
        </div>
      </div>
      <footer className="border-t border-white/10 py-6 text-center text-white/40 text-sm">
        <p>© 2024 SmartBank AI. Built with FastAPI + React + scikit-learn</p>
      </footer>
    </div>
  )
}
