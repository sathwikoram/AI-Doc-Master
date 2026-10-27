import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FolderOpen, Clock, CheckCircle, AlertCircle,
  Calendar, Plus, ArrowRight, Scale, Sparkles,
} from 'lucide-react'
import { usersApi, casesApi, hearingsApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import StatCard from '../../components/shared/StatCard'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import { CaseStatusBadge, PriorityBadge } from '../../components/shared/Badge'
import { formatDate, formatDateTime, CATEGORY_ICONS } from '../../lib/utils'

export default function CitizenDashboard() {
  const { user } = useAuthStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['citizen-stats'],
    queryFn: () => usersApi.myStats().then(r => r.data),
  })

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['citizen-cases'],
    queryFn: () => casesApi.list().then(r => r.data),
  })

  const { data: hearings = [], isLoading: hearingsLoading } = useQuery({
    queryKey: ['upcoming-hearings'],
    queryFn: () => hearingsApi.upcoming().then(r => r.data),
  })

  if (statsLoading || casesLoading) return <FullPageLoader />

  const activeCases   = cases.filter(c => ['in_progress','accepted','hearing_scheduled'].includes(c.status))
  const pendingCases  = cases.filter(c => ['pending','ai_analyzed','lawyer_assigned'].includes(c.status))
  const closedCases   = cases.filter(c => c.status?.startsWith('closed'))
  const recentCases   = [...cases].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here's an overview of your legal cases and upcoming hearings.
          </p>
        </div>
        <Link to="/citizen/cases/new" className="btn-primary gap-2">
          <Plus size={16} /> New Case
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cases"   value={stats?.total_cases ?? cases.length} icon={FolderOpen} color="blue" />
        <StatCard title="Active"         value={activeCases.length}  icon={Clock}        color="amber" />
        <StatCard title="Pending Review" value={pendingCases.length} icon={AlertCircle}  color="purple" />
        <StatCard title="Closed"         value={closedCases.length}  icon={CheckCircle}  color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="section-title">Recent Cases</h2>
              <p className="section-subtitle">Your latest case submissions</p>
            </div>
            <Link to="/citizen/cases" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Scale size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-medium">No cases yet</p>
              <p className="text-slate-400 text-xs mt-1">Submit your first case to get started</p>
              <Link to="/citizen/cases/new" className="btn-primary btn-sm mt-4">
                <Plus size={14} /> Submit Case
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentCases.map(c => (
                <Link
                  key={c.id}
                  to={`/citizen/cases/${c.id}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
                    {CATEGORY_ICONS[c.category] || '⚖️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.category || 'Analyzing…'} • {formatDate(c.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <CaseStatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Hearings */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="section-title">Upcoming Hearings</h2>
            <p className="section-subtitle">Scheduled court dates</p>
          </div>
          {hearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <Calendar size={28} className="text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No upcoming hearings</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {hearings.slice(0,4).map(h => (
                <div key={h.id} className="px-5 py-3.5">
                  <p className="text-xs font-semibold text-primary-600">
                    {formatDateTime(h.scheduled_date)}
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                    {h.court_name || 'Court Hearing'}
                  </p>
                  {h.court_room && (
                    <p className="text-xs text-slate-400">Room {h.court_room}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/citizen/cases/new',   icon: Plus,        label: 'Submit Case',    color: 'bg-primary-50 text-primary-600' },
            { to: '/citizen/find-lawyer', icon: Scale,       label: 'Find Lawyer',    color: 'bg-emerald-50 text-emerald-600' },
            { to: '/citizen/appointments',icon: Calendar,    label: 'Book Appointment', color: 'bg-amber-50 text-amber-600' },
            { to: '/citizen/chat',        icon: Sparkles,    label: 'AI Assistant',   color: 'bg-purple-50 text-purple-600' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100
                         hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-slate-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
