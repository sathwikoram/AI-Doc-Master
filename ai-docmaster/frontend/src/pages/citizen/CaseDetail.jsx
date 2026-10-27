import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, FileText, MessageSquare, Calendar, Sparkles,
  Upload, Send, Scale, CheckCircle, AlertTriangle, BookOpen, Gavel,
} from 'lucide-react'
import { casesApi, hearingsApi } from '../../lib/api'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import AiInsightCard from '../../components/shared/AiInsightCard'
import { formatDate, formatDateTime, getErrorMessage } from '../../lib/utils'
import FileUpload from '../../components/shared/FileUpload'
import Modal from '../../components/shared/Modal'

export default function CaseDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab]     = useState('overview')
  const [note, setNote]               = useState('')
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn:  () => casesApi.get(id).then(r => r.data),
    refetchInterval: (data) => data?.status === 'pending' || data?.status === 'ai_analyzed' ? 5000 : false,
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
    mutationFn: () => casesApi.addNote(id, { content: note, is_private: false }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['case-notes', id])
      setNote('')
      toast.success('Note added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      for (const file of uploadFiles) {
        const form = new FormData()
        form.append('file', file)
        form.append('document_type', 'supporting')
        await casesApi.uploadDoc(id, form)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['case-docs', id])
      setUploadOpen(false)
      setUploadFiles([])
      toast.success('Documents uploaded')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <FullPageLoader />
  if (!caseData) return <div className="text-center py-16 text-slate-500">Case not found</div>

  const ai = caseData.ai_analysis || {}

  const TABS = [
    { id: 'overview',  label: 'Overview',   icon: Scale },
    { id: 'ai',        label: 'AI Analysis', icon: Sparkles },
    { id: 'documents', label: 'Documents',   icon: FileText },
    { id: 'hearings',  label: 'Hearings',    icon: Calendar },
    { id: 'notes',     label: 'Notes',       icon: MessageSquare },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/citizen/cases" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={15} /> Back to Cases
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{caseData.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <CaseStatusBadge status={caseData.status} />
              <PriorityBadge priority={caseData.priority} />
              {caseData.category && (
                <span className="badge-blue">{caseData.category}</span>
              )}
              {caseData.case_number && (
                <span className="text-xs text-slate-400">#{caseData.case_number}</span>
              )}
            </div>
          </div>
          <button onClick={() => setUploadOpen(true)} className="btn-secondary btn-sm gap-1.5 flex-shrink-0">
            <Upload size={14} /> Upload Doc
          </button>
        </div>
      </div>

      {/* AI analyzing banner */}
      {caseData.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 border border-primary-200">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-primary-700 font-medium">
            AI is analyzing your case… This usually takes 10-30 seconds.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors
              ${activeTab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Case Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{caseData.description}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card-sm">
              <p className="text-xs text-slate-500 mb-1">Filed on</p>
              <p className="text-sm font-medium text-slate-800">{formatDate(caseData.created_at)}</p>
            </div>
            <div className="card-sm">
              <p className="text-xs text-slate-500 mb-1">Court Location</p>
              <p className="text-sm font-medium text-slate-800">{caseData.court_location || '—'}</p>
            </div>
            {caseData.court_name && (
              <div className="card-sm">
                <p className="text-xs text-slate-500 mb-1">Court</p>
                <p className="text-sm font-medium text-slate-800">{caseData.court_name}</p>
              </div>
            )}
            {caseData.advocate_id && (
              <div className="card-sm">
                <p className="text-xs text-slate-500 mb-1">Assigned Advocate</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Scale size={14} className="text-primary-500" /> Advocate Assigned
                </p>
              </div>
            )}
          </div>
          {caseData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {caseData.tags.map(t => (
                <span key={t} className="badge-slate">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Analysis */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {!ai.classification && (
            <div className="card text-center py-10 text-slate-500 text-sm">
              AI analysis is pending. Check back shortly.
            </div>
          )}

          {ai.classification && (
            <AiInsightCard title="Case Classification">
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 rounded-xl bg-white border border-primary-100">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{ai.classification.category}</p>
                </div>
                {ai.classification.sub_category && (
                  <div className="p-3 rounded-xl bg-white border border-primary-100">
                    <p className="text-xs text-slate-500">Sub-Category</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{ai.classification.sub_category}</p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-white border border-primary-100">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{Math.round((ai.classification.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-1.5 bg-primary-500 rounded-full"
                        style={{ width: `${Math.round((ai.classification.confidence || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AiInsightCard>
          )}

          {ai.sections?.ai_specific_suggestions?.length > 0 && (
            <AiInsightCard title="Applicable Legal Sections">
              <div className="space-y-2.5 mt-2">
                {ai.sections.ai_specific_suggestions.slice(0,5).map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-primary-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-primary-700">{s.section}</p>
                        <p className="text-xs text-slate-500">{s.act}</p>
                      </div>
                      <span className={`badge flex-shrink-0 ${
                        s.applicability === 'prosecution' ? 'badge-green' :
                        s.applicability === 'defense' ? 'badge-amber' : 'badge-blue'
                      }`}>{s.applicability}</span>
                    </div>
                    {s.relevance && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{s.relevance}</p>}
                  </div>
                ))}
              </div>
            </AiInsightCard>
          )}

          {ai.document_checklist?.mandatory_documents?.length > 0 && (
            <AiInsightCard title="Document Checklist">
              <div className="mt-2 space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Mandatory Documents</p>
                {ai.document_checklist.mandatory_documents.map((d, i) => (
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

          {ai.risk_assessment?.ai_assessment && (
            <AiInsightCard title="Risk Assessment">
              <div className="grid sm:grid-cols-3 gap-3 mt-2">
                <div className="p-3 rounded-xl bg-white border border-primary-100 text-center">
                  <p className="text-xs text-slate-500">Complexity</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {ai.risk_assessment.ai_assessment.complexity_label}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-primary-100 text-center">
                  <p className="text-xs text-slate-500">Est. Timeline</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {ai.risk_assessment.ai_assessment.estimated_timeline_months?.realistic} months
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-primary-100 text-center">
                  <p className="text-xs text-slate-500">Settlement</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {ai.risk_assessment.ai_assessment.settlement_likelihood}
                  </p>
                </div>
              </div>
              {ai.risk_assessment.ai_assessment.recommended_first_steps?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Recommended First Steps</p>
                  <ol className="space-y-1.5">
                    {ai.risk_assessment.ai_assessment.recommended_first_steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </AiInsightCard>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</p>
            <button onClick={() => setUploadOpen(true)} className="btn-primary btn-sm gap-1.5">
              <Upload size={14} /> Upload
            </button>
          </div>
          {docs.length === 0 ? (
            <div className="card text-center py-10">
              <FileText size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(d => (
                <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-3 p-3.5 card-sm hover:shadow-elevated transition-shadow">
                  <FileText size={20} className="text-primary-500 flex-shrink-0" />
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

      {/* Tab: Hearings */}
      {activeTab === 'hearings' && (
        <div className="space-y-3">
          {hearings.length === 0 ? (
            <div className="card text-center py-10">
              <Calendar size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No hearings scheduled</p>
            </div>
          ) : (
            hearings.map(h => (
              <div key={h.id} className="card-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Gavel size={18} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {h.court_name || 'Court Hearing'}
                    </p>
                    <span className={`badge ${h.status === 'scheduled' ? 'badge-blue' : h.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-xs text-primary-600 font-medium mt-0.5">{formatDateTime(h.scheduled_date)}</p>
                  {h.judge_name && <p className="text-xs text-slate-500 mt-0.5">Judge: {h.judge_name}</p>}
                  {h.outcome && <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg">{h.outcome}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="card">
            <label className="label">Add a note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Write a note about this case…"
              className="input resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => note.trim() && addNoteMutation.mutate()}
                disabled={!note.trim() || addNoteMutation.isPending}
                className="btn-primary btn-sm gap-1.5"
              >
                <Send size={13} /> Add Note
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">No notes yet</p>
            ) : (
              notes.map(n => (
                <div key={n.id} className="card-sm">
                  <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Documents" size="md">
        <FileUpload
          onFilesSelected={setUploadFiles}
          label="Select documents to upload"
        />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setUploadOpen(false)} className="btn-secondary">Cancel</button>
          <button
            onClick={() => uploadFiles.length && uploadMutation.mutate()}
            disabled={!uploadFiles.length || uploadMutation.isPending}
            className="btn-primary gap-1.5"
          >
            <Upload size={15} />
            {uploadMutation.isPending ? 'Uploading…' : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
