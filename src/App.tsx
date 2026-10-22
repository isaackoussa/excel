import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Logo } from './components/Logo'
import { useAuth } from './lib/auth'
import { currentStreak } from './lib/progress'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from './pages/AuthPages'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { LessonPage } from './pages/LessonPage'
import { ProfilePage, ResourcesPage, SandboxPage } from './pages/OtherPages'

function Loading() {
  return (
    <div className="loading">
      <Logo />
    </div>
  )
}

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function AppShell() {
  const { user, progress, mode } = useAuth()
  const streak = currentStreak(progress)
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/app" className="topbar-logo">
          <Logo />
        </NavLink>
        <nav className="topnav">
          <NavLink to="/app" end>
            Parcours
          </NavLink>
          <NavLink to="/app/ressources">Ressources</NavLink>
          <NavLink to="/app/bac-a-sable">Bac à sable</NavLink>
        </nav>
        <div className="topbar-stats">
          <span title="Série de jours">🔥 {streak}</span>
          <span title="Expérience">⭐ {progress.xp}</span>
          <NavLink to="/app/profil" className="avatar" title="Mon profil">
            {user?.displayName.slice(0, 1).toUpperCase()}
          </NavLink>
        </div>
      </header>
      {mode === 'demo' && <div className="demo-banner">Mode démo : la progression est enregistrée sur cet appareil uniquement.</div>}
      <Outlet />
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<SignupPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      <Route path="/reinitialiser" element={<ResetPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/app/lecon/:id" element={<LessonPage />} />
        <Route element={<AppShell />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/ressources" element={<ResourcesPage />} />
          <Route path="/app/bac-a-sable" element={<SandboxPage />} />
          <Route path="/app/profil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
