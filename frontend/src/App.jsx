import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from './api'
import { Button } from './ui'

import { VerifyEmail } from './pages/VerifyEmail'
import AuthSplit from './pages/AuthSplit'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import PatientChat from './pages/PatientChat'
import PatientFindDoctor from './pages/PatientFindDoctor'
import PatientAppointments from './pages/PatientAppointments'
import DoctorCurator from './pages/DoctorCurator'
import DoctorAppointments from './pages/DoctorAppointments'
import DoctorQueue from './pages/DoctorQueue'
import AdminPending from './pages/AdminPending'
import AdminStats from './pages/AdminStats'
import AdminUsers from './pages/AdminUsers'
import AdminAudit from './pages/AdminAudit'

function TopBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">M</span> MedAssist
      </Link>
      <nav className="row" style={{ gap: 4 }}>
        {user?.role === 'patient' && <>
          <NavTab to="/chat">Chat</NavTab>
          <NavTab to="/doctors">Find doctor</NavTab>
          <NavTab to="/appointments">Appointments</NavTab>
        </>}
        {user?.role === 'doctor' && <>
          <NavTab to="/queue">Queue</NavTab>
          <NavTab to="/curator">Curator</NavTab>
          <NavTab to="/appointments">Appointments</NavTab>
        </>}
        {user?.role === 'admin' && <>
          <NavTab to="/admin" end>System</NavTab>
          <NavTab to="/admin/pending">Pending</NavTab>
          <NavTab to="/admin/users">Users</NavTab>
          <NavTab to="/admin/audit">Audit</NavTab>
        </>}
      </nav>
      <div className="spacer" />
      <span className="muted">{user?.name} · {user?.role}{user?.specialty ? ` · ${user.specialty}` : ''}</span>
      <Button variant="outline" onClick={async () => { await logout(); nav('/') }}>Sign out</Button>
    </header>
  )
}

function NavTab({ to, end = false, children }) {
  return <NavLink to={to} end={end} className={({isActive}) => 'btn btn-ghost ' + (isActive ? 'btn-ghost-active' : '')}>{children}</NavLink>
}

function Protected({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <><TopBar />{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <Routes>
          <Route path="/" element={<HomeOrRole />} />
          <Route path="/login" element={<AuthSplit mode="login" />} />
          <Route path="/register" element={<AuthSplit mode="register" />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
          <Route path="/chat" element={<Protected role="patient"><PatientChat /></Protected>} />
          <Route path="/doctors" element={<Protected role="patient"><PatientFindDoctor /></Protected>} />
          <Route path="/appointments" element={<Protected><RoleAppointments /></Protected>} />
          <Route path="/curator" element={<Protected role="doctor"><DoctorCurator /></Protected>} />
          <Route path="/queue" element={<Protected role="doctor"><DoctorQueue /></Protected>} />
          <Route path="/admin/pending" element={<Protected role="admin"><AdminPending /></Protected>} />
          <Route path="/admin/users" element={<Protected role="admin"><AdminUsers /></Protected>} />
          <Route path="/admin/audit" element={<Protected role="admin"><AdminAudit /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><AdminStats /></Protected>} />
          <Route path="/admin/stats" element={<Protected role="admin"><AdminStats /></Protected>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function HomeOrRole() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Landing />
  // First-login flag is local-only for now (no backend field yet).
  const onboarded = localStorage.getItem('onboarded_' + user.id) === '1'
  if (!onboarded) return <Navigate to="/onboarding" replace />
  if (user.role === 'doctor') return <Navigate to="/queue" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/chat" replace />
}

function RoleAppointments() {
  const { user } = useAuth()
  return user?.role === 'doctor' ? <DoctorAppointments /> : <PatientAppointments />
}
