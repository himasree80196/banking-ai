import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../services/api'
import { ChatMessage, ChatSession } from '../types'
import toast from 'react-hot-toast'
import { Send, Plus, Trash2, MessageSquare, Copy, Check, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import clsx from 'clsx'

// ← CHANGED: Added greeting, INR, and more useful quick-start suggestions
const SUGGESTED = [
  { label: '👋 Say Hello', text: 'Hi! How can you help me?' },
  { label: '🏦 Loan Eligibility', text: 'What factors affect my loan eligibility?' },
  { label: '📈 Credit Score', text: 'How can I improve my credit score quickly?' },
  { label: '💰 Home Loan Docs', text: 'What documents are needed for a home loan?' },
  { label: '₹ INR to USD', text: 'How does INR to USD conversion work for loans?' },
  { label: '📊 EMI Calculation', text: 'Explain the difference between EMI and bullet repayment' },
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        <Bot size={14} />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className={clsx('flex items-end gap-2 mb-4 group', isUser && 'flex-row-reverse')}>
      <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
        isUser ? 'bg-gray-600' : 'bg-primary-600')}>
        {isUser ? 'U' : <Bot size={14} />}
      </div>
      <div className={clsx('max-w-[75%] relative', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx('px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed',
          isUser ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm')}>
          {isUser
            ? <p className="whitespace-pre-wrap">{msg.content}</p>
            : <div className="prose-banking"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
          }
        </div>
        <div className={clsx('flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-xs text-gray-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
          <button onClick={copy} className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors">
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const [activeSession, setActiveSession] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  const { data: sessionsData } = useQuery({ queryKey: ['chat-sessions'], queryFn: () => chatApi.sessions() })
  const sessions: ChatSession[] = sessionsData?.data || []

  const { data: sessionData } = useQuery({
    queryKey: ['chat-session', activeSession],
    queryFn: () => chatApi.session(activeSession!),
    enabled: !!activeSession,
  })

  useEffect(() => { if (sessionData?.data?.messages) setLocalMessages(sessionData.data.messages) }, [sessionData])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [localMessages, isTyping])

  const sendMutation = useMutation({
    mutationFn: (data: { content: string; session_id?: number }) => chatApi.send(data.content, data.session_id),
    onMutate: (data) => {
      const tempMsg: ChatMessage = { id: Date.now(), role: 'user', content: data.content, tokens_used: 0, created_at: new Date().toISOString() }
      setLocalMessages(prev => [...prev, tempMsg])
      setIsTyping(true)
    },
    onSuccess: (res) => {
      const { session_id, message, reply } = res.data
      setActiveSession(session_id)
      setLocalMessages(prev => [...prev.filter(m => !(m.id > 1000000)), message, reply])
      setIsTyping(false)
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
    onError: () => { setIsTyping(false); toast.error('Failed to send message.') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteSession(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-sessions'] }); setActiveSession(null); setLocalMessages([]) },
  })

  const handleSend = () => {
    const content = input.trim()
    if (!content || sendMutation.isPending) return
    setInput('')
    sendMutation.mutate({ content, session_id: activeSession || undefined })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] gap-4 animate-fade-in">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2 hidden md:flex">
        <button onClick={() => { setActiveSession(null); setLocalMessages([]) }} className="btn-primary flex items-center justify-center gap-2 py-2.5">
          <Plus size={16} />New Chat
        </button>
        <div className="card flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-2">Conversations</p>
          {sessions.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No conversations yet.<br />Start by saying hi!</p>}
          {sessions.map(s => (
            <div key={s.id} onClick={() => { setActiveSession(s.id); setLocalMessages([]) }}
              className={clsx('group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                activeSession === s.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300')}>
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="text-xs truncate">{s.title}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(s.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">SmartBank AI Assistant</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />Online — ask me anything!
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {localMessages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <Bot size={30} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">How can I help you today?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
                Ask me anything — greetings, loan info, EMI, credit score, or INR/USD conversions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED.map(s => (
                  <button key={s.text} onClick={() => { setInput(s.text); inputRef.current?.focus() }}
                    className="text-left text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 text-gray-600 dark:text-gray-400 transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {localMessages.map(m => <MessageBubble key={m.id} msg={m} />)}
          {isTyping && <TypingIndicator />}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say hi, ask about loans, EMI, credit score, INR/USD..."
              rows={Math.min(5, Math.max(1, input.split('\n').length))}
              className="flex-1 input-field resize-none min-h-[44px] max-h-36 py-3 leading-tight" />
            <button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending}
              className="btn-primary p-3 flex-shrink-0 aspect-square disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send &nbsp;·&nbsp;
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}