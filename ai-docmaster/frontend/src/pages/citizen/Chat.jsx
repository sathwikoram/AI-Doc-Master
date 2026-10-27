import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react'
import { aiApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import { formatDateTime } from '../../lib/utils'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  'What happens after an FIR is filed?',
  'How do I get bail for a non-bailable offence?',
  'What is a consumer complaint and how to file one?',
  'Explain the divorce process in India',
  'What documents do I need for a property dispute?',
  'How long does a criminal case take in India?',
]

export default function CitizenChat() {
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm your AI legal assistant. I can help you understand legal procedures, explain your rights, and guide you through the legal process.\n\n**What would you like to know?**",
    created_at: new Date().toISOString(),
  }])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mutation = useMutation({
    mutationFn: (msg) => aiApi.chat({ message: msg }).then(r => r.data),
    onSuccess: (data, msg) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response, created_at: new Date().toISOString() },
      ])
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', created_at: new Date().toISOString() },
      ])
    },
  })

  const send = (text = input.trim()) => {
    if (!text) return
    setMessages(prev => [...prev, { role: 'user', content: text, created_at: new Date().toISOString() }])
    setInput('')
    mutation.mutate(text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">AI Legal Assistant</h1>
          <p className="text-xs text-slate-500">Powered by AI — Not a substitute for legal advice</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1
              ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${m.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
              {m.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                    li: ({children}) => <li className="ml-4 list-disc">{children}</li>,
                    ul: ({children}) => <ul className="my-1 space-y-0.5">{children}</ul>,
                  }}
                >{m.content}</ReactMarkdown>
              ) : m.content}
              <p className={`text-[10px] mt-1.5 ${m.role === 'user' ? 'text-white/60 text-right' : 'text-slate-400'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Bot size={15} className="text-slate-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                       style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only shown when no conversation yet) */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 mb-3">
          <p className="text-xs text-slate-500 mb-2 font-medium">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full
                           hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          placeholder="Ask any legal question… (Enter to send, Shift+Enter for new line)"
          className="input flex-1 resize-none py-3"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || mutation.isPending}
          className="btn-primary self-stretch px-4 rounded-xl"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center flex-shrink-0">
        AI responses are for guidance only. Consult a qualified advocate for legal advice.
      </p>
    </div>
  )
}
