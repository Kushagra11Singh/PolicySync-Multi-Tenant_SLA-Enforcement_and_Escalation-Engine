import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { TicketsPage } from './pages/TicketsPage'
import { PoliciesPage } from './pages/PoliciesPage'
import { EscalationsPage } from './pages/EscalationsPage'
import { Nav } from './components/Nav'

type Page = '/tickets' | '/policies' | '/escalations'

export default function App() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState<Page>('/tickets')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#94a3b8', fontSize: 14,
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={() => window.location.reload()} />
  }

  // System admin (no tenant) — guide them to the right tool
  if (!user.tenant_name) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8fafc',
      }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: '36px 40px',
          maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>System Administrator</h2>
          <p style={{ color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
            You're logged in as a platform admin with no tenant.
            Use the API or Django admin to create tenants and users, then log in as a tenant user.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="http://localhost:8001/admin/" target="_blank" rel="noreferrer"
              style={{ ...linkBtn, background: '#6366f1', color: '#fff' }}>
              Django Admin
            </a>
            <a href="http://localhost:8001/api/docs/" target="_blank" rel="noreferrer"
              style={linkBtn}>
              API Docs
            </a>
          </div>
          <button
            onClick={logout}
            style={{ marginTop: 20, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Nav
        user={user}
        currentPath={page}
        onNavigate={(p) => setPage(p as Page)}
        onLogout={logout}
      />

      <main>
        {page === '/tickets' && <TicketsPage currentUser={user} />}
        {page === '/policies' && <PoliciesPage currentUser={user} />}
        {page === '/escalations' && <EscalationsPage currentUser={user} />}
      </main>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  padding: '9px 18px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontWeight: 500,
  textDecoration: 'none', color: '#374151',
}
