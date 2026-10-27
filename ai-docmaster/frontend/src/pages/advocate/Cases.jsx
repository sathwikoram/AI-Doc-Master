import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, Briefcase, CheckCircle, XCircle } from 'lucide-react'
import { casesApi } from '../../lib/api'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import { formatDate, CATEGORY_ICONS, getErrorMessage } from '../../lib/utils'

const STATUS_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'lawyer_assigned' },
  { label: 'Active',   value: 'in_progress' },
  { label: 'Hearing',  value: 'hearing_scheduled' },
  { label: 'Closed',   value: 'closed_won' },
]

export default function AdvocateCases() {
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('')
  const queryClient = useQueryClient()

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['advocate-cases', tab],
    queryFn:  () => casesApi.list(tab ? { status: tab } : {}).then(r => r.data),
  })

  const acceptMutation = useMutation({
    mutationFn: (id) => casesApi.update(id, { status: 'accepted' }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['advocate-cases'])
      toast.success('Case accepted!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => casesApi.update(id, { status: 'rejected' }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['advocate-cases'])
      toast.success('Case rejected')
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
        title="My Cases"
        subtitle={`${cases.length} case${cases.length !== 1 ? 's' : ''} assigned`}
      />

      {/* Tabs + search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases…" className="input pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${tab === t.value ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No cases found" description="Cases assigned to you will appear here." />
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
                        <span className="text-lg">{CATEGORY_ICONS[c.category] || '⚖️'}</span>
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1 max-w-xs">{c.title}</p>
                          {c.case_number && <p className="text-xs text-slate-400">#{c.case_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-600">{c.category || '—'}</td>
                    <td className="table-cell"><PriorityBadge priority={c.priority} /></td>
                    <td className="table-cell"><CaseStatusBadge status={c.status} /></td>
                    <td className="table-cell text-slate-500">{formatDate(c.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link to={`/advocate/cases/${c.id}`} className="btn-secondary btn-sm">View</Link>
                        {c.status === 'lawyer_assigned' && (
                          <>
                            <button
                              onClick={() => acceptMutation.mutate(c.id)}
                              disabled={acceptMutation.isPending}
                              className="btn-sm bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 btn gap-1"
                            >
                              <CheckCircle size={13} /> Accept
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(c.id)}
                              disabled={rejectMutation.isPending}
                              className="btn-sm bg-danger-50 text-danger-600 border border-danger-200 hover:bg-danger-100 btn gap-1"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
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
    </div>
  )
}
