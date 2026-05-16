import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { getEscalationLogs } from '../api/tickets'
import type { User, EscalationLogItem } from '../types'

interface Props {
  currentUser: User
  onLogout: () => void
}

const LEVEL_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#fef3c7', color: '#92400e' },
  2: { bg: '#fee2e2', color: '#991b1b' },
  3: { bg: '#ede9fe', color: '#5b21b6' },
}

function LevelBadge({ level }: { level: number }) {
  const style = LEVEL_COLORS[level] ?? { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      display: 'inline-block',
      background: style.bg, color: style.color,
      fontSize: 11, fontWeight: 700,
      padding: '2px 9px', borderRadius: 10,
      letterSpacing: '0.05em',
    }}>
      L{level}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function EscalationsPage({ currentUser, onLogout }: Props) {
  const [logs, setLogs] = useState<EscalationLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getEscalationLogs()
      .then(res => setLogs(res.results))
      .catch(() => setError('Failed to load escalation logs.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            Escalation Logs
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            All automatic SLA escalations across your tenant
          </p>
        </div>

        {loading && <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>}
        {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}

        {!loading && !error && (
          <div style={{
            background: '#fff', borderRadius: 10,
            border: '1px solid #e2e8f0', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ticket', 'Level', 'SLA %', 'Escalated To', 'Reason', 'Date'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ ...tdStyle, maxWidth: 220 }}>
                      <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 14 }}>
                        {log.ticket_title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>#{log.ticket}</div>
                    </td>
                    <td style={tdStyle}>
                      <LevelBadge level={log.level} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 60, height: 5, borderRadius: 3,
                          background: '#e5e7eb', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(log.sla_percent_elapsed, 100)}%`,
                            background: log.sla_percent_elapsed >= 100 ? '#ef4444'
                              : log.sla_percent_elapsed >= 80 ? '#f59e0b' : '#22c55e',
                          }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                          {Math.round(log.sla_percent_elapsed)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#374151' }}>
                      <div style={{ fontWeight: 500 }}>{log.escalated_to_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>{log.escalated_to_email}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#64748b', maxWidth: 240 }}>
                      {log.reason}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '48px 0' }}>
                      No escalations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left',
  fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' }
