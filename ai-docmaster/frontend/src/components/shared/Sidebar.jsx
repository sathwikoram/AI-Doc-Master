import { NavLink } from 'react-router-dom'
import { Scale, LogOut, ChevronRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const ROLE_COLORS = {
  citizen:  'from-primary-700 to-primary-900',
  advocate: 'from-emerald-700 to-emerald-900',
  admin:    'from-slate-700 to-slate-900',
}

export default function Sidebar({ nav, role, brand }) {
  const { logout, user } = useAuthStore()

  return (
    <aside className={cn(
      'w-64 flex-shrink-0 flex flex-col bg-gradient-to-b text-white',
      ROLE_COLORS[role] || 'from-primary-700 to-primary-900'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-xl">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">AI DocMaster</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wider">{brand}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-colors duration-150 group',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                     text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
