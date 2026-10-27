import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../../lib/api'
import { formatRelative } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

export default function TopBar() {
  const { user } = useAuthStore()
  const [showNotifs, setShowNotifs] = useState(false)

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn:  () => notificationsApi.list({ unread_only: true }).then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = notifs.length

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 flex-shrink-0">
      {/* Left: search */}
      <div className="relative w-80 hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search cases, hearings…"
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200
                     rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative btn-icon hover:bg-slate-100 text-slate-600"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[9px]
                               font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-modal
                            border border-slate-100 z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="badge-blue">{unreadCount} new</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">All caught up!</p>
                ) : (
                  notifs.slice(0, 8).map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700
                        flex items-center justify-center text-sm font-bold">
          {user?.full_name?.[0]?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  )
}
