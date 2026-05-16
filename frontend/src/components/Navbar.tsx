import { NavLink, useNavigate } from 'react-router-dom'
import type { User } from '../types'

interface Props {
  currentUser: User
  onLogout: () => void
}

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  color: isActive ? '#6366f1' : '#374151',
  background: isActive ? '#eef2ff' : 'transparent',
  transition: 'all 0.15s',
})

export function Navbar({ currentUser, onLogout }: Props) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: '-0.5px' }}>
          PolicySync
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink to="/tickets" style={navLinkStyle}>Tickets</NavLink>
          <NavLink to="/escalations" style={navLinkStyle}>Escalations</NavLink>
          <NavLink to="/policies" style={navLinkStyle}>Policies</NavLink>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {currentUser.full_name}
          <span style={{
            marginLeft: 8, padding: '2px 8px', borderRadius: 10,
            background: '#f1f5f9', fontSize: 11, fontWeight: 700,
            color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {currentUser.role}
          </span>
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: '5px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
            fontWeight: 500,
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
