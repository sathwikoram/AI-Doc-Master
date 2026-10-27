import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, FolderOpen, Eye } from 'lucide-react'
import { casesApi, advocatesApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { formatDate, CATEGORY_ICONS, getErrorMessage } from '../../lib/utils'

const STATUS_FILTERS = [
  { label: 'All',           value: '' },
  { label: 'Pending',       value: 'pending' },
  { label: 'AI Analyzed',   value: 'ai_analyzed' },
  { label: 'Assigned',      value: 'lawyer_assigned' },
  { label: 'Active',        value: 'in_progress' },
  { label: 'Hearing',       value: 'hearing_scheduled' },
  { label: 'Closed (Won)',  value: 'closed_won' },
  { label: 'Closed (Lost)', value: 'closed_lost' },
  { label: 'Settled',       value: 'closed_settled' },
]

export default function AdminCases() {
  const queryClient = useQueryClient()
  const [search,    setSearch]  = useState('')
  const [statusF,   setStatus]  = useState('')
  const [viewCase,  setViewCase] = useState(null)
  const [assignId,  setAssignId] = useState(null)
  const [selectedAdv, setSelAdv] = useState('')

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['admin-cases', statusF],
    queryFn:  () => casesApi.list(statusF ? { status: statusF } : {}).then(r => r.data),
  })

  const { data: advocates = [] } = useQuery({
    queryKey: ['advocates-list'],
    queryFn:  () => advocatesApi.list({ available_only: true }).then(r => r.data),
  })

  const assignMutation = useMutation({
    mutationFn: ({ caseId, advId }) => casesApi.assign(caseId, advId).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-cases'])
      setAssignId(null); setSelAdv('')
      toast.success('Advocate assigned successfully')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtered = cases.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Case Management"
        subtitle={`${cases.length} case${cases.length !== 1 ? 's' : ''} total`}
      />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Pending',  count: cases.filter(c => c.status === 'pending').length,        color: 'bg-slate-100 text-slate-700' },
          { label: 'Active',   count: cases.filter(c => c.status === 'in_progress').length,    color: 'bg-blue-50 text-blue-700' },
          { label: 'Hearing',  count: cases.filter(c => c.status === 'hearing_scheduled').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Won',      count: cases.filter(c => c.status === 'closed_won').length,     color: 'bg-success-50 text-success-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`px-4 py-2 rounded-xl ${color} border border-current/10`}>
            <span className="text-sm font-bold">{count}</span>
            <span className="text-xs ml-1.5 opacity-70">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases…"
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.slice(0, 6).map(f => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${statusF === f.value
                  ? 'bg-slate-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No cases found" description="Try adjusting your filters." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Case</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Filed</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[c.category] || '⚖️'}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate max-w-[200px]">{c.title}</p>
                          {c.case_number && (
                            <p className="text-xs text-slate-400">#{c.case_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-600">{c.category || '—'}</td>
                    <td className="table-cell"><PriorityBadge priority={c.priority} /></td>
                    <td className="table-cell"><CaseStatusBadge status={c.status} /></td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(c.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewCase(c)} className="btn-secondary btn-sm gap-1">
                          <Eye size={12} /> View
                        </button>
                        {!c.advocate_id && (
                          <button
                            onClick={() => setAssignId(c.id)}
                            className="btn btn-sm bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100"
                          >
                            Assign Advocate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case detail modal */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title="Case Details" size="lg">
        {viewCase && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">{viewCase.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <CaseStatusBadge status={viewCase.status} />
                  <PriorityBadge priority={viewCase.priority} />
                  {viewCase.category && <span className="badge-blue">{viewCase.category}</span>}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">
                {viewCase.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Filed',          value: formatDate(viewCase.created_at) },
                { label: 'Category',       value: viewCase.category || '—' },
                { label: 'Court Location', value: viewCase.court_location || '—' },
                { label: 'Case Number',    value: viewCase.case_number || '—' },
                { label: 'Advocate',       value: viewCase.advocate_id ? 'Assigned' : 'Not Assigned' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {viewCase.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewCase.tags.map(t => <span key={t} className="badge-slate">{t}</span>)}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign advocate modal */}
      <Modal open={!!assignId} onClose={() => { setAssignId(null); setSelAdv('') }} title="Assign Advocate" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Advocate</label>
            <select
              value={selectedAdv}
              onChange={e => setSelAdv(e.target.value)}
              className="input"
            >
              <option value="">Choose an advocate…</option>
              {advocates.map(a => (
                <option key={a.id} value={a.id}>
                  {a.user_name} — {(a.practice_areas || []).join(', ')} ({a.win_rate}% win)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => { setAssignId(null); setSelAdv('') }} className="btn-secondary">Cancel</button>
          <button
            onClick={() => selectedAdv && assignMutation.mutate({ caseId: assignId, advId: selectedAdv })}
            disabled={!selectedAdv || assignMutation.isPending}
            className="btn-primary"
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
