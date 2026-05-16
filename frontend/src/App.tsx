import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { TicketsPage } from './pages/TicketsPage'
import { EscalationsPage } from './pages/EscalationsPage'
import { PoliciesPage } from './pages/PoliciesPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#64748b', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#64748b', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/tickets" replace />
            : <LoginPage onSuccess={() => window.location.replace('/tickets')} />
        }
      />

      {/* Protected */}
      <Route
        path="/tickets"
        element={
          <RequireAuth>
            <TicketsPage currentUser={user!} onLogout={logout} />
          </RequireAuth>
        }
      />
      <Route
        path="/escalations"
        element={
          <RequireAuth>
            <EscalationsPage currentUser={user!} onLogout={logout} />
          </RequireAuth>
        }
      />
      <Route
        path="/policies"
        element={
          <RequireAuth>
            <PoliciesPage currentUser={user!} onLogout={logout} />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? '/tickets' : '/login'} replace />} />
    </Routes>
  )
}
