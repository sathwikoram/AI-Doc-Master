import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, FileText, Calendar, Sparkles, Send, Upload,
  Gavel, BookOpen, Scale, AlertTriangle, CheckCircle,
  MessageSquare, RefreshCw, Plus,
} from 'lucide-react'
import { casesApi, hearingsApi, aiApi } from '../../lib/api'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import AiInsightCard from '../../components/shared/AiInsightCard'
import Modal from '../../components/shared/Modal'
import FileUpload from '../../components/shared/FileUpload'
import { formatDate, formatDateTime, getErrorMessage, CATEGORY_ICONS } from '../../lib/utils'
import { useForm } from 'react-hook-form'

export default function AdvocateCaseDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [tab, setTab]                 = useState('overview')
  const [note, setNote]               = useState('')
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])
  const [hearingOpen, setHearingOpen] = useState(false)
  const [aiLoading, setAiLoading]     = useState({})
  const [aiData, setAiData]           = useState({})

  const { register: hReg, handleSubmit: hSubmit, reset: hReset, formState: { errors: hErr } } = useForm()

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['advocate-case', id],
    queryFn:  () => casesApi.get(id).then(r => r.data),
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['case-docs', id],
    queryFn:  () => casesApi.getDocs(id).then(r => r.data),
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['case-notes', id],
    queryFn:  () => casesApi.getNotes(id).then(r => r.data),
  })

  const { data: hearings = [] } = useQuery({
    queryKey: ['case-hearings', id],
    queryFn:  () => hearingsApi.byCaseId(id).then(r => r.data),
  })

  const addNoteMutation = useMutation({
    mutationFn: () => casesApi.addNote(id, { content: note, is_private: true }),
    onSuccess: () => { queryClient.invalidateQueries(['case-notes', id]); setNote(''); toast.success('Note added') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const scheduleHearingMutation = useMutation({
    mutationFn: (data) => hearingsApi.schedule({ case_id: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['case-hearings', id])
      setHearingOpen(false); hReset()
      toast.success('Hearing scheduled')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      for (const file of uploadFiles) {
        const form = new FormData()
        form.append('file', file)
        form.append('document_type', 'evidence')
        await casesApi.uploadDoc(id, form)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['case-docs', id])
      setUploadOpen(false); setUploadFiles([])
      toast.success('Documents uploaded')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const replaceAdvocateMutation = useMutation({
    mutationFn: (hearingId) => hearingsApi.replaceAdvocate(hearingId, 'Advocate unavailable'),
    onSuccess: () => { queryClient.invalidateQueries(['case-hearings', id]); toast.success('Replacement advocate assigned') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const fetchAi = async (type) => {
    if (!caseData) return
    setAiLoading(p => ({ ...p, [type]: true }))
    try {
      let result
      if (type === 'sections')   result = await aiApi.legalSections({ case_description: caseData.description, category: caseData.category }).then(r => r.data)
      if (type === 'judgements') result = await aiApi.judgements({ case_description: caseData.description, category: caseData.category, top_k: 5 }).then(r => r.data)
      if (type === 'checklist')  result = await aiApi.documentChecklist({ category: caseData.category || 'Civil', description: caseData.description }).then(r => r.data)
      if (type === 'risk')       result = await aiApi.riskAssessment({ case_description: caseData.description, category: caseData.category }).then(r => r.data)
      if (type === 'summary')    result = await aiApi.summarize({ text: caseData.description }).then(r => r.data)
      setAiData(p => ({ ...p, [type]: result }))
    } catch (e) {
      toast.error('AI request failed')
    } finally {
      setAiLoading(p => ({ ...p, [type]: false }))
    }
  }

  if (isLoading) return <FullPageLoader />
  if (!caseData) return <div className="text-center py-16 text-slate-500">Case not found</div>

  const TABS = [
    { id: 'overview',  label: 'Overview',     icon: Scale },
    { id: 'ai',        label: 'AI Research',   icon: Sparkles },
    { id: 'hearings',  label: 'Hearings',      icon: Gavel },
    { id: 'documents', label: 'Documents',     icon: FileText },
    { id: 'notes',     label: 'Notes',         icon: MessageSquare },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/advocate/cases" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={15} /> Back to Cases
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{caseData.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <CaseStatusBadge status={caseData.status} />
              <PriorityBadge priority={caseData.priority} />
              {caseData.category && <span className="badge-blue">{caseData.category}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setHearingOpen(true)} className="btn-secondary btn-sm gap-1.5">
              <Plus size={13} /> Schedule Hearing
            </button>
            <button onClick={() => setUploadOpen(true)} className="btn-primary btn-sm gap-1.5">
              <Upload size={13} /> Upload Doc
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors
              ${tab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Case Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{caseData.description}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Filed', value: formatDate(caseData.created_at) },
              { label: 'Category', value: caseData.category || 'Pending analysis' },
              { label: 'Priority', value: caseData.priority },
              { label: 'Court Location', value: caseData.court_location || '—' },
              { label: 'Court Name', value: caseData.court_name || '—' },
              { label: 'Case Number', value: caseData.case_number || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="card-sm">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
          {caseData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {caseData.tags.map(t => <span key={t} className="badge-slate">{t}</span>)}
            </div>
          )}
          {/* Update case status */}
          <div className="card-sm">
            <p className="text-xs font-semibold text-slate-600 mb-2">Update Case Status</p>
            <div className="flex flex-wrap gap-2">
              {['accepted','in_progress','hearing_scheduled','adjourned','closed_won','closed_lost','closed_settled'].map(s => (
                <button key={s}
                  onClick={() => casesApi.update(id, { status: s }).then(() => {
                    queryClient.invalidateQueries(['advocate-case', id])
                    toast.success(`Status → ${s}`)
                  })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                    ${caseData.status === s
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Research Tab */}
      {tab === 'ai' && (
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { key: 'sections',   label: 'Legal Sections', icon: BookOpen },
              { key: 'judgements', label: 'Judgements',      icon: Gavel },
              { key: 'checklist',  label: 'Doc Checklist',   icon: CheckCircle },
              { key: 'risk',       label: 'Risk Analysis',   icon: AlertTriangle },
              { key: 'summary',    label: 'Case Summary',    icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => fetchAi(key)}
                disabled={aiLoading[key]}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium
                  transition-colors hover:border-emerald-300 hover:bg-emerald-50
                  ${aiData[key] ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
              >
                {aiLoading[key]
                  ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  : <Icon size={16} />
                }
                {label}
              </button>
            ))}
          </div>

          {/* Legal Sections */}
          {aiData.sections && (
            <AiInsightCard title="Applicable Legal Sections">
              <div className="space-y-2.5 mt-2">
                {/* Static sections */}
                {Object.entries(aiData.sections.static_sections || {}).slice(0, 3).map(([type, items]) =>
                  Array.isArray(items) && items.slice(0, 3).map((s, i) => (
                    <div key={`${type}-${i}`} className="p-3 rounded-xl bg-white border border-primary-100">
                      <p className="text-xs font-bold text-primary-700">{s.section}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{s.description}</p>
                      {s.old_ipc && <p className="text-[10px] text-slate-400 mt-0.5">Previously: {s.old_ipc}</p>}
                    </div>
                  ))
                )}
                {/* AI suggestions */}
                {aiData.sections.ai_specific_suggestions?.slice(0, 3).map((s, i) => (
                  <div key={`ai-${i}`} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex justify-between gap-2">
                      <p className="text-xs font-bold text-emerald-700">{s.section} — {s.act}</p>
                      <span className={`badge flex-shrink-0 text-[10px] ${s.applicability === 'prosecution' ? 'badge-green' : 'badge-amber'}`}>{s.applicability}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{s.relevance}</p>
                  </div>
                ))}
              </div>
            </AiInsightCard>
          )}

          {/* Judgements */}
          {aiData.judgements && (
            <AiInsightCard title="Similar Judgements">
              {aiData.judgements.ai_insight && (
                <p className="text-xs text-primary-700 bg-primary-50 p-3 rounded-xl mb-3 leading-relaxed">
                  {aiData.judgements.ai_insight}
                </p>
              )}
              <div className="space-y-2.5">
                {aiData.judgements.similar_judgements?.map((j, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{j.title}</p>
                      <span className="text-[10px] font-bold text-primary-600 flex-shrink-0 bg-primary-50 px-2 py-0.5 rounded-full">
                        {Math.round((j.relevance_score || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{j.court} • {j.year}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{j.snippet}</p>
                    <p className="text-xs font-medium text-emerald-700 mt-1.5">Outcome: {j.outcome}</p>
                  </div>
                ))}
              </div>
            </AiInsightCard>
          )}

          {/* Document Checklist */}
          {aiData.checklist && (
            <AiInsightCard title="Document Checklist">
              <div className="space-y-1.5 mt-2">
                {aiData.checklist.mandatory_documents?.map((d, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-100">
                    <CheckCircle size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AiInsightCard>
          )}

          {/* Risk Assessment */}
          {aiData.risk && (
            <AiInsightCard title="Risk Assessment">
              <div className="grid sm:grid-cols-3 gap-3 mt-2">
                {[
                  { label: 'Complexity', value: aiData.risk.ai_assessment?.complexity_label },
                  { label: 'Est. Timeline', value: `${aiData.risk.ai_assessment?.estimated_timeline_months?.realistic || '?'} months` },
                  { label: 'Settlement', value: aiData.risk.ai_assessment?.settlement_likelihood },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white border border-primary-100 text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>
              {aiData.risk.ai_assessment?.case_strength_indicators && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-success-700 mb-1.5">Strengths</p>
                    {aiData.risk.ai_assessment.case_strength_indicators.strengths?.map((s, i) => (
                      <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1"><span className="text-success-500">✓</span>{s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-danger-600 mb-1.5">Risks</p>
                    {aiData.risk.ai_assessment.case_strength_indicators.key_risks?.map((r, i) => (
                      <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1"><span className="text-danger-500">⚠</span>{r}</p>
                    ))}
                  </div>
                </div>
              )}
            </AiInsightCard>
          )}

          {/* Summary */}
          {aiData.summary && (
            <AiInsightCard title="AI Case Summary">
              <div className="prose prose-sm max-w-none mt-2 text-slate-700 leading-relaxed text-xs whitespace-pre-wrap">
                {aiData.summary.summary}
              </div>
            </AiInsightCard>
          )}
        </div>
      )}

      {/* Hearings Tab */}
      {tab === 'hearings' && (
        <div className="space-y-3">
          <button onClick={() => setHearingOpen(true)} className="btn-primary btn-sm gap-1.5">
            <Plus size={14} /> Schedule Hearing
          </button>
          {hearings.length === 0 ? (
            <div className="card text-center py-10">
              <Gavel size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No hearings scheduled yet</p>
            </div>
          ) : (
            hearings.map(h => (
              <div key={h.id} className="card-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{h.court_name || 'Court Hearing'}</p>
                    <p className="text-xs text-primary-600 font-medium mt-0.5">{formatDateTime(h.scheduled_date)}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                      {h.court_room && <span>Room {h.court_room}</span>}
                      {h.judge_name && <span>Judge: {h.judge_name}</span>}
                    </div>
                    {h.outcome && <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg">{h.outcome}</p>}
                    {h.replaced_advocate_id && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-1.5">
                        ⚠ Advocate was replaced: {h.replacement_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${h.status === 'scheduled' ? 'badge-blue' : h.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>
                      {h.status}
                    </span>
                    {h.status === 'scheduled' && (
                      <button
                        onClick={() => replaceAdvocateMutation.mutate(h.id)}
                        disabled={replaceAdvocateMutation.isPending}
                        className="btn-secondary btn-sm text-[10px] gap-1"
                        title="Mark advocate as unavailable and find replacement"
                      >
                        <RefreshCw size={11} /> Replace
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setUploadOpen(true)} className="btn-primary btn-sm gap-1.5"><Upload size={14} /> Upload</button>
          </div>
          {docs.length === 0 ? (
            <div className="card text-center py-10">
              <FileText size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No documents</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(d => (
                <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-3 p-3.5 card-sm hover:shadow-elevated transition-shadow">
                  <FileText size={18} className="text-primary-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.file_name}</p>
                    <p className="text-xs text-slate-400">{d.document_type} • {formatDate(d.created_at)}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="card">
            <label className="label">Private Note (visible to advocates only)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Legal strategy, reminders…" className="input resize-none" />
            <div className="flex justify-end mt-3">
              <button onClick={() => note.trim() && addNoteMutation.mutate()} disabled={!note.trim()} className="btn-primary btn-sm gap-1.5">
                <Send size={13} /> Add Note
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {notes.length === 0
              ? <p className="text-center text-sm text-slate-400 py-6">No notes yet</p>
              : notes.map(n => (
                  <div key={n.id} className="card-sm">
                    {n.is_private && <span className="badge-amber mb-2 inline-block">Private</span>}
                    <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.created_at)}</p>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* Schedule Hearing Modal */}
      <Modal open={hearingOpen} onClose={() => setHearingOpen(false)} title="Schedule Hearing" size="md">
        <form onSubmit={hSubmit(scheduleHearingMutation.mutate)} className="space-y-4">
          <div>
            <label className="label">Hearing Date & Time</label>
            <input type="datetime-local" {...hReg('scheduled_date', { required: 'Required' })}
              min={new Date().toISOString().slice(0,16)} className={`input ${hErr.scheduled_date ? 'input-error' : ''}`} />
            {hErr.scheduled_date && <p className="error-text">{hErr.scheduled_date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Court Name</label>
              <input {...hReg('court_name')} placeholder="e.g., District Court" className="input" />
            </div>
            <div>
              <label className="label">Court Room</label>
              <input {...hReg('court_room')} placeholder="e.g., Room 3" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Judge Name <span className="text-slate-400 font-normal">(optional)</span></label>
            <input {...hReg('judge_name')} placeholder="Hon. Justice…" className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...hReg('notes')} rows={2} placeholder="Hearing notes…" className="input resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setHearingOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={scheduleHearingMutation.isPending} className="btn-primary gap-1.5">
              <Calendar size={15} /> {scheduleHearingMutation.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Documents">
        <FileUpload onFilesSelected={setUploadFiles} label="Select documents" />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setUploadOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => uploadFiles.length && uploadMutation.mutate()}
            disabled={!uploadFiles.length || uploadMutation.isPending} className="btn-primary gap-1.5">
            <Upload size={15} /> {uploadMutation.isPending ? 'Uploading…' : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
