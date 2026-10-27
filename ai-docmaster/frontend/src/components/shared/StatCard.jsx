import { cn } from '../../lib/utils'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:   'bg-primary-50  text-primary-600',
    green:  'bg-success-50  text-success-600',
    amber:  'bg-warning-50  text-warning-600',
    red:    'bg-danger-50   text-danger-600',
    slate:  'bg-slate-100   text-slate-600',
    purple: 'bg-purple-50   text-purple-600',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-success-600' : 'text-danger-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
