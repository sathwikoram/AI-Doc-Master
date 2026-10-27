import { Outlet } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import TopBar  from '../components/shared/TopBar'
import {
  LayoutDashboard, Briefcase, Calendar, FileText,
  Sparkles, UserCircle,
} from 'lucide-react'

const NAV = [
  { to: '/advocate',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/advocate/cases',        label: 'My Cases',     icon: Briefcase },
  { to: '/advocate/hearings',     label: 'Hearings',     icon: Calendar },
  { to: '/advocate/documents',    label: 'Documents',    icon: FileText },
  { to: '/advocate/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/advocate/profile',      label: 'Profile',      icon: UserCircle },
]

export default function AdvocateLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={NAV} role="advocate" brand="Advocate Portal" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
