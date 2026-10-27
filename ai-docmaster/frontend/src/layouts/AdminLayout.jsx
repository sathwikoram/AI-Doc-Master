import { Outlet } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import TopBar  from '../components/shared/TopBar'
import {
  LayoutDashboard, Users, Scale, FolderOpen, BarChart3,
} from 'lucide-react'

const NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/users',     label: 'Users',      icon: Users },
  { to: '/admin/advocates', label: 'Advocates',  icon: Scale },
  { to: '/admin/cases',     label: 'Cases',      icon: FolderOpen },
  { to: '/admin/analytics', label: 'Analytics',  icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={NAV} role="admin" brand="Admin Panel" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
