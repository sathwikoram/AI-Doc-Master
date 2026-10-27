import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, FolderOpen } from 'lucide-react'
import { casesApi } from '../../lib/api'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import { formatDate, CATEGORY_ICONS } from '../../lib/utils'

const STATUS_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Active',    value: 'in_progress' },
  { label: 'Scheduled', value: 'hearing_scheduled' },
  { label: 'Closed',    value: 'closed_won' },
]

export default function MyCases() {
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatus] = useState('')

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['citizen-cases', statusFilter],
    queryFn:  () => casesApi.list(statusFilter ? { status: statusFilter } : {}).then(r => r.data),
  })

  const filtered = cases.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="My Cases"
        subtitle={`${cases.length} case${cases.length !== 1 ? 's' : ''} total`}
        action={
          <Link to="/citizen/cases/new" className="btn-primary">
            <Plus size={16} /> New Case
          </Link>
        }
      />

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
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${statusFilter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases found"
          description={search ? 'Try a different search term.' : 'Submit your first case to get started.'}
          action={!search && <Link to="/citizen/cases/new" className="btn-primary btn-sm"><Plus size={14} />Submit Case</Link>}
        />
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
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-base flex-shrink-0">
                          {CATEGORY_ICONS[c.category] || '⚖️'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1 max-w-xs">{c.title}</p>
                          {c.case_number && <p className="text-xs text-slate-400">#{c.case_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-slate-600">{c.category || '—'}</span>
                    </td>
                    <td className="table-cell"><PriorityBadge priority={c.priority} /></td>
                    <td className="table-cell"><CaseStatusBadge status={c.status} /></td>
                    <td className="table-cell text-slate-500">{formatDate(c.created_at)}</td>
                    <td className="table-cell">
                      <Link to={`/citizen/cases/${c.id}`} className="btn-secondary btn-sm">
                        View
                      </Link>
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
