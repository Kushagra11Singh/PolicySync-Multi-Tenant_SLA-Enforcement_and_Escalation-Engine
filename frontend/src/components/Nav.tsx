import type { User } from '../types'

interface Props {
  user: User
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

const links = [
  { path: '/tickets',    label: 'Tickets',     roles: ['admin', 'manager', 'agent'] },
  { path: '/policies',   label: 'SLA Policies', roles: ['admin', 'manager'] },
  { path: '/escalations', label: 'Escalations', roles: ['admin', 'manager'] },
]

export function Nav({ user, currentPath, onNavigate, onLogout }: Props) {
  const visible = links.filter(l => l.roles.includes(user.role))

  return (
    <nav style={{
      background: '#1e293b',
      color: '#e2e8f0',
      padding: '0 24px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      userSelect: 'none',
    }}>
      {/* Logo */}
      <span style={{
        fontWeight: 800,
        fontSize: 15,
        color: '#a5b4fc',
        marginRight: 32,
        letterSpacing: '-0.02em',
      }}>
        PolicySync
      </span>

      {/* Nav links */}
      {visible.map(link => (
        <button
          key={link.path}
          onClick={() => onNavigate(link.path)}
          style={{
            background: 'none',
            border: 'none',
            color: currentPath === link.path ? '#a5b4fc' : '#94a3b8',
            fontWeight: currentPath === link.path ? 600 : 400,
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 14px',
            height: 52,
            borderBottom: currentPath === link.path ? '2px solid #a5b4fc' : '2px solid transparent',
            transition: 'color 0.15s',
          }}
        >
          {link.label}
        </button>
      ))}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {user.full_name || user.email}
          <span style={{
            marginLeft: 8,
            background: '#334155',
            color: '#94a3b8',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {user.role}
          </span>
        </span>
        <button
          onClick={onLogout}
          style={{
            background: 'none',
            border: '1px solid #334155',
            color: '#94a3b8',
            padding: '4px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
