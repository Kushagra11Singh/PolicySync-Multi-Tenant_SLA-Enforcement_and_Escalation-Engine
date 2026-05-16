import { useState, useEffect } from 'react'
import { EscalationLogItem, User } from '../types'
import { getEscalationLogs } from '../api/tickets'

interface Props {
  currentUser: User
}

const LEVEL_COLOR = ['', '#f59e0b', '#ef4444', '#7c3aed']

export function EscalationsPage({ currentUser }: Props) {
  const [logs, setLogs] = useState<EscalationLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEscalationLogs()
      .then(r => setLogs(r.results))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Escalations</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
          Full escalation trail — {logs.length} event{logs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {logs.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Level', 'Ticket', 'Escalated To', 'SLA Elapsed', 'Reason', 'When'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      background: (LEVEL_COLOR[log.level] ?? '#ef4444') + '18',
                      color: LEVEL_COLOR[log.level] ?? '#ef4444',
                      padding: '3px 9px', borderRadius: 5,
                      fontSize: 12, fontWeight: 700,
                    }}>
                      Level {log.level}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', maxWidth: 220 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                      {log.ticket_title}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                    {log.escalated_to_name}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.escalated_to_email}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3,
                        overflow: 'hidden', minWidth: 60,
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(log.sla_percent_elapsed, 100)}%`,
                          background: log.sla_percent_elapsed >= 100 ? '#ef4444' : '#f59e0b',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                        {log.sla_percent_elapsed.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b', maxWidth: 260 }}>
                    {log.reason}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
              No escalations yet. They appear here as SLA deadlines are approached.
            </div>
          )
        )}
      </div>
    </div>
  )
}
