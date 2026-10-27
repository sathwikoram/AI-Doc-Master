import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function AiInsightCard({ title = 'AI Insight', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-primary-800">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-primary-400" /> : <ChevronDown size={16} className="text-primary-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
