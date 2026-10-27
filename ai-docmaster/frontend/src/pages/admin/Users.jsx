import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Users, Search, Filter, UserCheck, UserX,
  Mail, Phone, Calendar, Shield,
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { RoleBadge } from '../../components/shared/Badge'
import { formatDate, getErrorMessage } from '../../lib/utils'

const ROLE_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Citizens',  value: 'citizen' },
  { label: 'Advocates', value: 'advocate' },
  { label: 'Admins',    value: 'admin' },
]

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [roleFilter,setRole]      = useState('')
  const [toggleId,  setToggleId]  = useState(null)
  const [toggleName, setToggleName] = useState('')
  const [toggleActive, setToggleActive] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn:  () => adminApi.users(roleFilter ? { role: roleFilter } : {}).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => adminApi.toggleUser(id).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success(`User ${data.is_active ? 'activated' : 'deactivated'}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtered = users.filter(u =>
    !search ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''} registered`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: users.length,                              color: 'bg-blue-50   text-blue-700' },
          { label: 'Citizens',  value: users.filter(u => u.role === 'citizen').length,  color: 'bg-primary-50 text-primary-700' },
          { label: 'Advocates', value: users.filter(u => u.role === 'advocate').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Active',    value: users.filter(u => u.is_active).length,           color: 'bg-success-50 text-success-700' },
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
            placeholder="Search by name or email…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setRole(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                ${roleFilter === f.value
                  ? 'bg-slate-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filter." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 font-bold text-sm
                                        flex items-center justify-center flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.full_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail size={10} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                          ${u.is_active ? 'bg-success-500' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-600">
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => {
                          setToggleId(u.id)
                          setToggleName(u.full_name)
                          setToggleActive(u.is_active)
                        }}
                        className={`btn btn-sm gap-1 ${
                          u.is_active
                            ? 'bg-danger-50 text-danger-600 border border-danger-200 hover:bg-danger-100'
                            : 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100'
                        }`}
                      >
                        {u.is_active
                          ? <><UserX size={12} /> Deactivate</>
                          : <><UserCheck size={12} /> Activate</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={() => toggleMutation.mutate(toggleId)}
        title={toggleActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${toggleActive ? 'deactivate' : 'activate'} ${toggleName}?`}
        danger={toggleActive}
      />
    </div>
  )
}
