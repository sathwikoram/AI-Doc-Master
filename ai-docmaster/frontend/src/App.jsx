import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Layouts
import CitizenLayout  from './layouts/CitizenLayout'
import AdvocateLayout from './layouts/AdvocateLayout'
import AdminLayout    from './layouts/AdminLayout'

// Citizen pages
import CitizenDashboard  from './pages/citizen/Dashboard'
import MyCases           from './pages/citizen/MyCases'
import CaseDetail        from './pages/citizen/CaseDetail'
import SubmitCase        from './pages/citizen/SubmitCase'
import FindLawyer        from './pages/citizen/FindLawyer'
import Appointments      from './pages/citizen/Appointments'
import CitizenChat       from './pages/citizen/Chat'
import CitizenProfile    from './pages/citizen/Profile'

// Advocate pages
import AdvocateDashboard  from './pages/advocate/Dashboard'
import AdvocateCases      from './pages/advocate/Cases'
import AdvocateCaseDetail from './pages/advocate/CaseDetail'
import AdvocateHearings   from './pages/advocate/Hearings'
import AdvocateDocuments  from './pages/advocate/Documents'
import AdvocateProfile    from './pages/advocate/Profile'
import AiAssistant        from './pages/advocate/AiAssistant'

// Admin pages
import AdminDashboard   from './pages/admin/Dashboard'
import AdminUsers       from './pages/admin/Users'
import AdminAdvocates   from './pages/admin/Advocates'
import AdminCases       from './pages/admin/Cases'
import AdminAnalytics   from './pages/admin/Analytics'

// Shared
import LandingPage      from './pages/LandingPage'
import NotFound         from './pages/NotFound'

// Route guards
function RequireAuth({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to={`/${user?.role}`} replace />
  return children
}

function GuestOnly({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) return <Navigate to={`/${user?.role}`} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        {/* Citizen */}
        <Route path="/citizen" element={<RequireAuth role="citizen"><CitizenLayout /></RequireAuth>}>
          <Route index element={<CitizenDashboard />} />
          <Route path="cases"            element={<MyCases />} />
          <Route path="cases/new"        element={<SubmitCase />} />
          <Route path="cases/:id"        element={<CaseDetail />} />
          <Route path="find-lawyer"      element={<FindLawyer />} />
          <Route path="appointments"     element={<Appointments />} />
          <Route path="chat"             element={<CitizenChat />} />
          <Route path="profile"          element={<CitizenProfile />} />
        </Route>

        {/* Advocate */}
        <Route path="/advocate" element={<RequireAuth role="advocate"><AdvocateLayout /></RequireAuth>}>
          <Route index element={<AdvocateDashboard />} />
          <Route path="cases"          element={<AdvocateCases />} />
          <Route path="cases/:id"      element={<AdvocateCaseDetail />} />
          <Route path="hearings"       element={<AdvocateHearings />} />
          <Route path="documents"      element={<AdvocateDocuments />} />
          <Route path="ai-assistant"   element={<AiAssistant />} />
          <Route path="profile"        element={<AdvocateProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="advocates" element={<AdminAdvocates />} />
          <Route path="cases"     element={<AdminCases />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
