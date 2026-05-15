
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { TicketsPage } from './pages/TicketsPage'

export default function App() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#64748b',
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={() => window.location.reload()} />
  }

  return <TicketsPage currentUser={user} onLogout={logout} />
}
