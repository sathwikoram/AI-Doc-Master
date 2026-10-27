import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Briefcase, Calendar, Clock, CheckCircle,
  ArrowRight, Sparkles, Users, TrendingUp, Star,
} from 'lucide-react'
import { casesApi, hearingsApi, appointmentsApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import StatCard from '../../components/shared/StatCard'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import { CaseStatusBadge } from '../../components/shared/Badge'
import { formatDateTime, formatDate, CATEGORY_ICONS } from '../../lib/utils'

export default function AdvocateDashboard() {
  const { user } = useAuthStore()

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['advocate-cases'],
    queryFn:  () => casesApi.list().then(r => r.data),
  })

  const { data: hearings = [], isLoading: hearingsLoading } = useQuery({
    queryKey: ['upcoming-hearings'],
    queryFn:  () => hearingsApi.upcoming().then(r => r.data),
  })

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn:  () => appointmentsApi.list().then(r => r.data),
  })

  if (casesLoading || hearingsLoading) return <FullPageLoader />

  const activeCases   = cases.filter(c => ['accepted','in_progress','hearing_scheduled'].includes(c.status))
  const pendingCases  = cases.filter(c => ['lawyer_assigned'].includes(c.status))
  const closedCases   = cases.filter(c => c.status?.startsWith('closed'))
  const todayHearings = hearings.filter(h => {
    const d = new Date(h.scheduled_date)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const upcomingAppts = appointments.filter(a => ['requested','confirmed'].includes(a.status))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good day, Adv. {user?.full_name?.split(' ')[0]} 👨‍⚖️
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your cases, hearings, and AI-powered legal research.
          </p>
        </div>
        <Link to="/advocate/ai-assistant" className="btn-primary gap-2">
          <Sparkles size={16} /> AI Assistant
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Cases"     value={activeCases.length}   icon={Briefcase}   color="blue" />
        <StatCard title="Pending Accept"   value={pendingCases.length}  icon={Clock}        color="amber" />
        <StatCard title="Today's Hearings" value={todayHearings.length} icon={Calendar}     color="purple" />
        <StatCard title="Cases Closed"     value={closedCases.length}   icon={CheckCircle}  color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="section-title">Assigned Cases</h2>
              <p className="section-subtitle">Cases requiring your attention</p>
            </div>
            <Link to="/advocate/cases" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No cases assigned yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {cases.slice(0, 6).map(c => (
                <Link
                  key={c.id}
                  to={`/advocate/cases/${c.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-base flex-shrink-0">
                    {CATEGORY_ICONS[c.category] || '⚖️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.category || '—'} • {formatDate(c.created_at)}</p>
                  </div>
                  <CaseStatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Today's hearings */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="section-title text-base">Today's Hearings</h2>
            </div>
            {todayHearings.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No hearings today</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {todayHearings.map(h => (
                  <div key={h.id} className="px-5 py-3">
                    <p className="text-xs font-semibold text-primary-600">{formatDateTime(h.scheduled_date)}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{h.court_name || 'Court Hearing'}</p>
                    {h.court_room && <p className="text-xs text-slate-400">Room {h.court_room}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="section-title text-base">Appointments</h2>
            </div>
            {upcomingAppts.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No pending appointments</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {upcomingAppts.slice(0, 3).map(a => (
                  <div key={a.id} className="px-5 py-3">
                    <p className="text-xs font-semibold text-emerald-600">{formatDateTime(a.scheduled_at)}</p>
                    <p className="text-xs text-slate-500 capitalize">{a.mode.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/advocate/cases',        icon: Briefcase,   label: 'My Cases',      color: 'bg-blue-50 text-blue-600' },
            { to: '/advocate/hearings',      icon: Calendar,    label: 'Hearings',       color: 'bg-purple-50 text-purple-600' },
            { to: '/advocate/ai-assistant',  icon: Sparkles,    label: 'AI Research',    color: 'bg-emerald-50 text-emerald-600' },
            { to: '/advocate/documents',     icon: TrendingUp,  label: 'Documents',      color: 'bg-amber-50 text-amber-600' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100
                         hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
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
