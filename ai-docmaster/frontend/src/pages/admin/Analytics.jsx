import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Award, Users, Scale } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import PageHeader from '../../components/shared/PageHeader'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function AdminAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => adminApi.stats().then(r => r.data),
  })

  if (isLoading) return <FullPageLoader />

  const monthly      = stats?.monthly_cases ?? []
  const byCategory   = stats?.cases_by_category ?? []

  // Derive win rate data from category (mock enrichment for display)
  const categoryWithRate = byCategory.map((c, i) => ({
    ...c,
    win_rate: Math.floor(45 + Math.random() * 40),
    advocates: Math.floor(1 + Math.random() * 8),
  }))

  // Status distribution
  const statusData = [
    { name: 'Active',   value: stats?.active_cases ?? 0,  color: '#6366f1' },
    { name: 'Won',      value: stats?.closed_won ?? 0,    color: '#22c55e' },
    { name: 'Total',    value: stats?.total_cases ?? 0,   color: '#94a3b8' },
  ].filter(d => d.value > 0)

  const kpiCards = [
    {
      title: 'Case Resolution Rate',
      value: stats?.total_cases
        ? `${Math.round((stats.closed_won / stats.total_cases) * 100)}%`
        : '—',
      icon: Award,
      color: 'text-emerald-600 bg-emerald-50',
      description: 'Closed-won / total cases',
    },
    {
      title: 'Avg Cases per Advocate',
      value: stats?.verified_advocates
        ? (stats.total_cases / stats.verified_advocates).toFixed(1)
        : '—',
      icon: Scale,
      color: 'text-primary-600 bg-primary-50',
      description: 'Total cases / verified advocates',
    },
    {
      title: 'Verification Rate',
      value: stats?.total_advocates
        ? `${Math.round((stats.verified_advocates / stats.total_advocates) * 100)}%`
        : '—',
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
      description: 'Verified / total advocates',
    },
    {
      title: 'Platform Activity',
      value: stats?.upcoming_hearings ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      description: 'Upcoming hearings scheduled',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Platform-wide statistics and trends"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ title, value, icon: Icon, color, description }) => (
          <div key={title} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <div className="card">
        <h2 className="section-title mb-1">Monthly Case Volume</h2>
        <p className="section-subtitle mb-4">Number of cases filed per month</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
              cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#colorCases)"
              name="Cases Filed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown + status pie */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Cases by category bar */}
        <div className="lg:col-span-3 card">
          <h2 className="section-title mb-1">Cases by Legal Category</h2>
          <p className="section-subtitle mb-4">Distribution across practice areas</p>
          {byCategory.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No case data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} width={140} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Cases" radius={[0, 6, 6, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status donut */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-1">Case Status Overview</h2>
          <p className="section-subtitle mb-4">Current status distribution</p>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Platform summary table */}
      <div className="card">
        <h2 className="section-title mb-4">Platform Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Metric</th>
                <th className="table-header">Count</th>
                <th className="table-header">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Total Registered Users',       value: stats?.total_users ?? 0,          note: 'Citizens + Advocates + Admins' },
                { metric: 'Verified Advocates',           value: stats?.verified_advocates ?? 0,   note: `Out of ${stats?.total_advocates ?? 0} registered` },
                { metric: 'Total Cases Filed',            value: stats?.total_cases ?? 0,          note: 'All time' },
                { metric: 'Active Cases',                 value: stats?.active_cases ?? 0,         note: 'In progress / scheduled' },
                { metric: 'Cases Successfully Closed',   value: stats?.closed_won ?? 0,           note: 'Closed won' },
                { metric: 'Upcoming Hearings',            value: stats?.upcoming_hearings ?? 0,    note: 'Scheduled future hearings' },
              ].map(({ metric, value, note }) => (
                <tr key={metric} className="table-row">
                  <td className="table-cell font-medium text-slate-800">{metric}</td>
                  <td className="table-cell">
                    <span className="text-lg font-bold text-primary-700">{value}</span>
                  </td>
                  <td className="table-cell text-slate-500 text-xs">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
