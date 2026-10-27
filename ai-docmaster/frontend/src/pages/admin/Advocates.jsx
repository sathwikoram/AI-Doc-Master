import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Scale, Search, CheckCircle, XCircle, Star,
  MapPin, Briefcase, Award, Filter,
} from 'lucide-react'
import { advocatesApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import Modal from '../../components/shared/Modal'
import { formatDate, getErrorMessage } from '../../lib/utils'

const FILTER_OPTIONS = [
  { label: 'All',           value: '' },
  { label: 'Verified',      value: 'verified' },
  { label: 'Unverified',    value: 'unverified' },
  { label: 'Available',     value: 'available' },
]

export default function AdminAdvocates() {
  const queryClient = useQueryClient()
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('')
  const [viewAdv,     setViewAdv]     = useState(null)
  const [verifyId,    setVerifyId]    = useState(null)
  const [verifyName,  setVerifyName]  = useState('')
  const [verifying,   setVerifying]   = useState(true)

  const { data: advocates = [], isLoading } = useQuery({
    queryKey: ['admin-advocates'],
    queryFn:  () => advocatesApi.list({}).then(r => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, v }) => advocatesApi.verify(id, v).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-advocates'])
      queryClient.invalidateQueries(['admin-pending-advocates'])
      toast.success(`Advocate ${data.is_verified ? 'verified' : 'unverified'}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtered = advocates.filter(a => {
    const matchSearch = !search ||
      (a.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      a.bar_council_number.toLowerCase().includes(search.toLowerCase()) ||
      (a.city || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === '' ? true
      : filter === 'verified'   ? a.is_verified
      : filter === 'unverified' ? !a.is_verified
      : filter === 'available'  ? a.is_available
      : true
    return matchSearch && matchFilter
  })

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Advocate Management"
        subtitle={`${advocates.length} advocate${advocates.length !== 1 ? 's' : ''} registered`}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: advocates.length,                               color: 'bg-slate-100 text-slate-700' },
          { label: 'Verified',   value: advocates.filter(a => a.is_verified).length,    color: 'bg-success-50 text-success-700' },
          { label: 'Pending',    value: advocates.filter(a => !a.is_verified).length,   color: 'bg-amber-50 text-amber-700' },
          { label: 'Available',  value: advocates.filter(a => a.is_available).length,   color: 'bg-blue-50 text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color} border border-current/10`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
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
            placeholder="Search by name, bar number, city…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${filter === f.value
                  ? 'bg-slate-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Scale} title="No advocates found" description="Try adjusting your search or filter." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Advocate</th>
                  <th className="table-header">Bar Council No.</th>
                  <th className="table-header">Practice Areas</th>
                  <th className="table-header">Stats</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm
                                        flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {a.user_picture
                            ? <img src={a.user_picture} alt="" className="w-full h-full object-cover" />
                            : a.user_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{a.user_name || '—'}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {a.city || '—'}{a.state ? `, ${a.state}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-lg">
                        {a.bar_council_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(a.practice_areas || []).slice(0, 2).map(p => (
                          <span key={p} className="badge-blue text-[10px]">{p}</span>
                        ))}
                        {(a.practice_areas || []).length > 2 && (
                          <span className="badge-slate text-[10px]">+{a.practice_areas.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <p className="flex items-center gap-1">
                          <Briefcase size={10} /> {a.total_cases} cases
                        </p>
                        <p className="flex items-center gap-1">
                          <Star size={10} className="text-amber-500" /> {a.rating?.toFixed(1)} rating
                        </p>
                        <p className="flex items-center gap-1">
                          <Award size={10} /> {a.win_rate}% win
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`badge text-[10px] ${a.is_verified ? 'badge-green' : 'badge-amber'}`}>
                          {a.is_verified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                        <span className={`badge text-[10px] ${a.is_available ? 'badge-blue' : 'badge-slate'}`}>
                          {a.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewAdv(a)}
                          className="btn-secondary btn-sm text-xs"
                        >
                          View
                        </button>
                        {!a.is_verified ? (
                          <button
                            onClick={() => {
                              setVerifyId(a.id)
                              setVerifyName(a.user_name || a.bar_council_number)
                              setVerifying(true)
                            }}
                            className="btn btn-sm bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 gap-1"
                          >
                            <CheckCircle size={12} /> Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setVerifyId(a.id)
                              setVerifyName(a.user_name || a.bar_council_number)
                              setVerifying(false)
                            }}
                            className="btn btn-sm bg-danger-50 text-danger-600 border border-danger-200 hover:bg-danger-100 gap-1"
                          >
                            <XCircle size={12} /> Revoke
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

      {/* Advocate detail modal */}
      <Modal open={!!viewAdv} onClose={() => setViewAdv(null)} title="Advocate Details" size="lg">
        {viewAdv && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-xl
                              flex items-center justify-center overflow-hidden">
                {viewAdv.user_picture
                  ? <img src={viewAdv.user_picture} alt="" className="w-full h-full object-cover" />
                  : viewAdv.user_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{viewAdv.user_name}</p>
                <p className="text-sm text-slate-500">{viewAdv.user_email}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`badge text-[10px] ${viewAdv.is_verified ? 'badge-green' : 'badge-amber'}`}>
                    {viewAdv.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Bar Council No.', value: viewAdv.bar_council_number },
                { label: 'Qualification',   value: viewAdv.qualification || '—' },
                { label: 'Experience',      value: `${viewAdv.years_of_experience} years` },
                { label: 'Location',        value: `${viewAdv.city || '—'}, ${viewAdv.state || '—'}` },
                { label: 'Court Location',  value: viewAdv.court_location || '—' },
                { label: 'Total Cases',     value: viewAdv.total_cases },
                { label: 'Cases Won',       value: viewAdv.won_cases },
                { label: 'Win Rate',        value: `${viewAdv.win_rate}%` },
                { label: 'Rating',          value: `${viewAdv.rating?.toFixed(1)} / 5.0` },
                { label: 'Languages',       value: (viewAdv.languages || []).join(', ') || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Practice Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {(viewAdv.practice_areas || []).map(p => (
                  <span key={p} className="badge-blue">{p}</span>
                ))}
              </div>
            </div>
            {viewAdv.profile_bio && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Bio</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">{viewAdv.profile_bio}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify confirm */}
      <ConfirmDialog
        open={!!verifyId}
        onClose={() => setVerifyId(null)}
        onConfirm={() => verifyMutation.mutate({ id: verifyId, v: verifying })}
        title={verifying ? 'Verify Advocate' : 'Revoke Verification'}
        message={`Are you sure you want to ${verifying ? 'verify' : 'revoke verification for'} ${verifyName}?`}
        danger={!verifying}
      />
    </div>
  )
}
