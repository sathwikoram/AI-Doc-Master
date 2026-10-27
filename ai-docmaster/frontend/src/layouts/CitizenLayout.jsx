import { Outlet } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import TopBar  from '../components/shared/TopBar'
import {
  LayoutDashboard, FolderOpen, Scale, CalendarCheck,
  MessageSquare, UserCircle, Search,
} from 'lucide-react'

const NAV = [
  { to: '/citizen',             label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/citizen/cases',       label: 'My Cases',       icon: FolderOpen },
  { to: '/citizen/find-lawyer', label: 'Find Lawyer',    icon: Search },
  { to: '/citizen/appointments',label: 'Appointments',   icon: CalendarCheck },
  { to: '/citizen/chat',        label: 'AI Assistant',   icon: MessageSquare },
  { to: '/citizen/profile',     label: 'Profile',        icon: UserCircle },
]

export default function CitizenLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={NAV} role="citizen" brand="Citizen Portal" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
