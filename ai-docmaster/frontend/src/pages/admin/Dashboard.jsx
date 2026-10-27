import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Scale, FolderOpen, Calendar, TrendingUp,
  CheckCircle, Clock, ArrowRight, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts'
import { adminApi } from '../../lib/api'
import StatCard from '../../components/shared/StatCard'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import { formatDate, CATEGORY_ICONS } from '../../lib/utils'

const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => adminApi.stats().then(r => r.data),
  })

  const { data: recentCases = [] } = useQuery({
    queryKey: ['admin-recent-cases'],
    queryFn:  () => adminApi.recentCases().then(r => r.data),
  })

  const { data: pendingAdvocates = [] } = useQuery({
    queryKey: ['admin-pending-advocates'],
    queryFn:  () => adminApi.pendingAdvocates().then(r => r.data),
  })

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          color="blue"
          subtitle="Registered citizens"
        />
        <StatCard
          title="Advocates"
          value={stats?.total_advocates ?? 0}
          icon={Scale}
          color="green"
          subtitle={`${stats?.verified_advocates ?? 0} verified`}
        />
        <StatCard
          title="Total Cases"
          value={stats?.total_cases ?? 0}
          icon={FolderOpen}
          color="purple"
          subtitle={`${stats?.active_cases ?? 0} active`}
        />
        <StatCard
          title="Upcoming Hearings"
          value={stats?.upcoming_hearings ?? 0}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cases Won"
          value={stats?.closed_won ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Active Cases"
          value={stats?.active_cases ?? 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Pending Verification"
          value={pendingAdvocates.length}
          icon={AlertCircle}
          color="red"
          subtitle="Advocates to verify"
        />
        <StatCard
          title="Verified Advocates"
          value={stats?.verified_advocates ?? 0}
          icon={Scale}
          color="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Monthly cases bar chart */}
        <div className="lg:col-span-3 card">
          <h2 className="section-title mb-4">Monthly Cases (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.monthly_cases ?? []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by category pie chart */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-4">Cases by Category</h2>
          {(stats?.cases_by_category ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.cases_by_category}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                >
                  {stats.cases_by_category.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(val, name) => [val, name]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="section-title">Recent Cases</h2>
            <Link to="/admin/cases" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCases.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50">
                <span className="text-base">{CATEGORY_ICONS[c.category] || '⚖️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.category || '—'} • {formatDate(c.created_at)}</p>
                </div>
                <span className={`badge flex-shrink-0
                  ${c.status?.startsWith('closed') ? 'badge-green'
                    : c.status === 'pending' ? 'badge-slate'
                    : 'badge-blue'}`}>
                  {c.status?.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
            {recentCases.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No cases yet</p>
            )}
          </div>
        </div>

        {/* Pending Advocate Verifications */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="section-title">Pending Verifications</h2>
            <Link to="/admin/advocates" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingAdvocates.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {a.bar_council_number}
                  </p>
                  <p className="text-xs text-slate-400">{a.city || '—'} • {formatDate(a.created_at)}</p>
                </div>
                <Link
                  to="/admin/advocates"
                  className="btn-secondary btn-sm text-xs"
                >
                  Review
                </Link>
              </div>
            ))}
            {pendingAdvocates.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">All advocates verified ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
