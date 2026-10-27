import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Sparkles, BookOpen, Gavel, FileCheck, AlertTriangle,
  FileText, Send, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { aiApi } from '../../lib/api'
import AiInsightCard from '../../components/shared/AiInsightCard'
import { getErrorMessage } from '../../lib/utils'

const TOOLS = [
  { id: 'classify',   label: 'Case Classification', icon: Sparkles,      color: 'bg-violet-50 text-violet-600',  border: 'border-violet-200' },
  { id: 'sections',   label: 'Legal Sections',       icon: BookOpen,      color: 'bg-blue-50 text-blue-600',     border: 'border-blue-200' },
  { id: 'judgements', label: 'Similar Judgements',   icon: Gavel,         color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
  { id: 'checklist',  label: 'Document Checklist',   icon: FileCheck,     color: 'bg-amber-50 text-amber-600',   border: 'border-amber-200' },
  { id: 'risk',       label: 'Risk Assessment',       icon: AlertTriangle, color: 'bg-red-50 text-red-600',       border: 'border-red-200' },
  { id: 'summarize',  label: 'Document Summary',      icon: FileText,      color: 'bg-slate-50 text-slate-600',   border: 'border-slate-200' },
]

export default function AiAssistant() {
  const [activeTool, setActiveTool] = useState('classify')
  const [input, setInput]           = useState('')
  const [category, setCategory]     = useState('')
  const [results, setResults]       = useState({})
  const [loading, setLoading]       = useState({})

  const run = async (toolId) => {
    if (!input.trim()) { toast.error('Please enter a case description first'); return }
    setLoading(p => ({ ...p, [toolId]: true }))
    try {
      let data
      const desc = input.trim()
      if (toolId === 'classify')   data = await aiApi.classify({ description: desc }).then(r => r.data)
      if (toolId === 'sections')   data = await aiApi.legalSections({ case_description: desc, category: category || undefined }).then(r => r.data)
      if (toolId === 'judgements') data = await aiApi.judgements({ case_description: desc, category: category || undefined, top_k: 5 }).then(r => r.data)
      if (toolId === 'checklist')  data = await aiApi.documentChecklist({ category: category || 'Civil', description: desc }).then(r => r.data)
      if (toolId === 'risk')       data = await aiApi.riskAssessment({ case_description: desc, category: category || undefined }).then(r => r.data)
      if (toolId === 'summarize')  data = await aiApi.summarize({ text: desc }).then(r => r.data)
      setResults(p => ({ ...p, [toolId]: data }))
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(p => ({ ...p, [toolId]: false }))
    }
  }

  const runAll = async () => {
    if (!input.trim()) { toast.error('Please enter a case description first'); return }
    for (const tool of TOOLS) await run(tool.id)
  }

  const clearAll = () => { setResults({}); setInput(''); setCategory('') }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={22} className="text-emerald-600" /> AI Legal Research Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter a case description and run AI tools to get legal insights instantly.
          </p>
        </div>
        {Object.keys(results).length > 0 && (
          <button onClick={clearAll} className="btn-secondary btn-sm gap-1.5">
            <RotateCcw size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="card space-y-4">
        <div>
          <label className="label">Case Description</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={5}
            placeholder="Describe the case in detail. The more information you provide, the better the AI analysis.

Example: My client was terminated from employment after 8 years of service without any notice period or severance pay. The employer claims misconduct but no formal inquiry was conducted. Client has salary slips and appointment letter as evidence..."
            className="input resize-none leading-relaxed"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-40">
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Case category (optional, e.g. Criminal)"
              className="input text-sm"
            />
          </div>
          <button
            onClick={runAll}
            disabled={!input.trim() || Object.values(loading).some(Boolean)}
            className="btn-primary gap-2"
          >
            {Object.values(loading).some(Boolean)
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
              : <><Sparkles size={16} /> Run All AI Tools</>
            }
          </button>
        </div>
      </div>

      {/* Tool buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {TOOLS.map(({ id, label, icon: Icon, color, border }) => (
          <button
            key={id}
            onClick={() => run(id)}
            disabled={loading[id] || !input.trim()}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium
              transition-all hover:shadow-sm disabled:opacity-40
              ${results[id] ? `${border} ${color}` : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            {loading[id]
              ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Icon size={18} />
            }
            <span className="text-center leading-tight">{label}</span>
            {results[id] && <span className="text-[9px] font-bold text-green-600">✓ Done</span>}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <ClassifyResult data={results.classify} />
        <SectionsResult data={results.sections} />
        <JudgementsResult data={results.judgements} />
        <ChecklistResult data={results.checklist} />
        <RiskResult data={results.risk} />
        <SummaryResult data={results.summarize} />
      </div>
    </div>
  )
}

// ── Result sub-components ──────────────────────────────────────────────────────

function ClassifyResult({ data }) {
  if (!data) return null
  return (
    <AiInsightCard title="Case Classification Result">
      <div className="grid sm:grid-cols-3 gap-3 mt-3">
        <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
          <p className="text-xs text-slate-500">Category</p>
          <p className="text-sm font-bold text-primary-700 mt-0.5">{data.category}</p>
        </div>
        {data.sub_category && (
          <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
            <p className="text-xs text-slate-500">Sub-Category</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{data.sub_category}</p>
          </div>
        )}
        <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">
            {Math.round((data.confidence || 0) * 100)}%
          </p>
        </div>
      </div>
      {data.keywords_matched?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-xs text-slate-500 mr-1">Matched:</span>
          {data.keywords_matched.map(k => (
            <span key={k} className="badge-blue text-[10px]">{k}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-2">Method: {data.method}</p>
    </AiInsightCard>
  )
}

function SectionsResult({ data }) {
  if (!data) return null
  const aiSuggestions = data.ai_specific_suggestions || []
  const staticSections = data.static_sections || {}
  return (
    <AiInsightCard title="Applicable Legal Sections">
      {aiSuggestions.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI-Specific Suggestions</p>
          {aiSuggestions.map((s, i) => (
            <div key={i} className="p-3 bg-white rounded-xl border border-primary-100">
              <div className="flex justify-between gap-2 flex-wrap">
                <p className="text-xs font-bold text-primary-700">{s.section}</p>
                <span className={`badge text-[10px] ${s.applicability === 'prosecution' ? 'badge-green' : s.applicability === 'defense' ? 'badge-amber' : 'badge-blue'}`}>
                  {s.applicability}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.act}</p>
              {s.relevance && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.relevance}</p>}
            </div>
          ))}
        </div>
      )}
      {Object.entries(staticSections).length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">General Sections for {data.category}</p>
          {Object.entries(staticSections).flatMap(([type, items]) =>
            Array.isArray(items) ? items.slice(0, 3).map((s, i) => (
              <div key={`${type}-${i}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700">{s.section}</span>
                  <span className="text-xs text-slate-500 ml-2">— {s.description}</span>
                </div>
                {s.old_ipc && <span className="text-[10px] text-slate-400">{s.old_ipc}</span>}
              </div>
            )) : []
          )}
        </div>
      )}
    </AiInsightCard>
  )
}

function JudgementsResult({ data }) {
  if (!data) return null
  return (
    <AiInsightCard title="Similar Judgements (RAG Search)">
      {data.ai_insight && (
        <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 mt-3 mb-3">
          <p className="text-xs font-semibold text-primary-700 mb-1">AI Insight</p>
          <p className="text-xs text-primary-800 leading-relaxed">{data.ai_insight}</p>
        </div>
      )}
      <div className="space-y-2.5">
        {(data.similar_judgements || []).map((j, i) => (
          <div key={i} className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800 flex-1">{j.title}</p>
              <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full flex-shrink-0">
                {Math.round((j.relevance_score || 0) * 100)}% match
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{j.court} • {j.year}</p>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">{j.snippet}</p>
            <p className="text-xs font-medium text-emerald-700 mt-1.5 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
              {j.outcome}
            </p>
            {j.sections?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {j.sections.map(s => <span key={s} className="badge-slate text-[10px]">{s}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </AiInsightCard>
  )
}

function ChecklistResult({ data }) {
  if (!data) return null
  return (
    <AiInsightCard title="Document Checklist">
      <div className="space-y-1.5 mt-3">
        {data.mandatory_documents?.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Mandatory</p>
            {data.mandatory_documents.map((d, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-success-500 text-sm flex-shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.purpose}</p>
                </div>
              </div>
            ))}
          </>
        )}
        {data.optional_documents?.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-3 mb-2">Optional</p>
            {data.optional_documents.map((d, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-sm flex-shrink-0 mt-0.5">○</span>
                <div>
                  <p className="text-xs font-medium text-slate-700">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.purpose}</p>
                </div>
              </div>
            ))}
          </>
        )}
        {data.ai_additional_documents?.length > 0 && (
          <>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mt-3 mb-2">AI Additional Suggestions</p>
            {data.ai_additional_documents.map((d, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-500 text-sm flex-shrink-0 mt-0.5">✦</span>
                <div>
                  <p className="text-xs font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.purpose}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </AiInsightCard>
  )
}

function RiskResult({ data }) {
  if (!data) return null
  const ai = data.ai_assessment || {}
  return (
    <AiInsightCard title="Risk Assessment">
      <div className="grid sm:grid-cols-3 gap-3 mt-3">
        {[
          { label: 'Complexity', value: ai.complexity_label },
          { label: 'Timeline (Realistic)', value: `${ai.estimated_timeline_months?.realistic || '?'} months` },
          { label: 'Settlement Likelihood', value: ai.settlement_likelihood },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 bg-white rounded-xl border border-slate-100 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{value || '—'}</p>
          </div>
        ))}
      </div>
      {ai.case_strength_indicators && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs font-semibold text-success-700 mb-2">Case Strengths</p>
            {ai.case_strength_indicators.strengths?.map((s, i) => (
              <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1.5">
                <span className="text-success-500 mt-0.5 flex-shrink-0">✓</span>{s}
              </p>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-danger-600 mb-2">Key Risks</p>
            {ai.case_strength_indicators.key_risks?.map((r, i) => (
              <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1.5">
                <span className="text-danger-500 mt-0.5 flex-shrink-0">⚠</span>{r}
              </p>
            ))}
          </div>
        </div>
      )}
      {ai.recommended_first_steps?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Recommended Steps</p>
          <ol className="space-y-1.5">
            {ai.recommended_first_steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-3 italic">{data.disclaimer}</p>
    </AiInsightCard>
  )
}

function SummaryResult({ data }) {
  if (!data) return null
  return (
    <AiInsightCard title="Document / Case Summary">
      <div className="mt-3 p-4 bg-white rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {data.summary}
      </div>
    </AiInsightCard>
  )
}
