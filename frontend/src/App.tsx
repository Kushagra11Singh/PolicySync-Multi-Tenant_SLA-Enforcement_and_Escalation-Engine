import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { TicketsPage } from './pages/TicketsPage'
import { EscalationsPage } from './pages/EscalationsPage'
import { PoliciesPage } from './pages/PoliciesPage'

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
            : <LoginPage />
        }
      />

      {/* Protected — user is guaranteed non-null here because we checked above */}
      {user ? (
        <>
          <Route path="/tickets" element={<TicketsPage currentUser={user} onLogout={logout} />} />
          <Route path="/escalations" element={<EscalationsPage currentUser={user} onLogout={logout} />} />
          <Route path="/policies" element={<PoliciesPage currentUser={user} onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/tickets" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}
