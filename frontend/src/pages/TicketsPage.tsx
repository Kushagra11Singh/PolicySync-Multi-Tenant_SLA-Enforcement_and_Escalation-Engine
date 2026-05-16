import { useState } from 'react'
import { useTickets } from '../hooks/useTickets'
import { SLATimer } from '../components/SLATimer'
import { EscalationBadge } from '../components/EscalationBadge'
import { CreateTicketModal } from '../components/CreateTicketModal'
import { User, TicketListItem } from '../types'
import { resolveTicket } from '../api/tickets'

interface Props {
  currentUser: User
}

const STATUS_COLOR: Record<string, string> = {
  open: '#6366f1', in_progress: '#0ea5e9',
  pending: '#f59e0b', resolved: '#22c55e', closed: '#6b7280',
}
const PRIORITY_COLOR: Record<string, string> = {
  low: '#6b7280', medium: '#0ea5e9', high: '#f59e0b', critical: '#ef4444',
}

export function TicketsPage({ currentUser }: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)

  const { data, loading, error, refetch } = useTickets({
    status: statusFilter || undefined,
    escalated: escalatedOnly || undefined,
  })

  const handleResolve = async (ticket: TicketListItem) => {
    if (!confirm(`Mark "${ticket.title}" as resolved?`)) return
    setResolving(ticket.id)
    try {
      await resolveTicket(ticket.id)
      refetch()
    } finally {
      setResolving(null)
    }
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Tickets</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            {currentUser.tenant_name ?? 'All tenants'} · polling every 30s
          </p>
        </div>
        {currentUser.role !== 'agent' && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: '#6366f1', color: '#fff', border: 'none',
              padding: '9px 18px', borderRadius: 8, fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
          <input type="checkbox" checked={escalatedOnly} onChange={e => setEscalatedOnly(e.target.checked)} />
          Escalated only
        </label>

        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>
          {data ? `${data.count} ticket${data.count !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {/* Table */}
      {loading && <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading tickets...</div>}
      {error && <div style={{ color: '#ef4444', padding: 16 }}>{error}</div>}

      {data && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Ticket', 'Status', 'Priority', 'Agent', 'SLA', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.map(ticket => (
                <tr
                  key={ticket.id}
                  style={{ borderTop: '1px solid #f1f5f9' }}
                >
                  <td style={{ ...tdStyle, maxWidth: 320 }}>
                    <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>
                      {ticket.title}
                    </div>
                    <EscalationBadge isEscalated={ticket.is_escalated} level={ticket.escalation_level} />
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: STATUS_COLOR[ticket.status] + '18',
                      color: STATUS_COLOR[ticket.status],
                      padding: '3px 9px', borderRadius: 6,
                      fontSize: 12, fontWeight: 600,
                      textTransform: 'capitalize', whiteSpace: 'nowrap',
                    }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: PRIORITY_COLOR[ticket.priority], fontWeight: 700, fontSize: 12 }}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {ticket.assigned_agent_name ?? '—'}
                  </td>
                  <td style={tdStyle}>
                    <SLATimer
                      deadline={ticket.sla_resolution_deadline}
                      percentElapsed={ticket.sla_percent_elapsed}
                      slaStatus={ticket.sla_status}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {!['resolved', 'closed'].includes(ticket.status) && (
                      <button
                        onClick={() => handleResolve(ticket)}
                        disabled={resolving === ticket.id}
                        style={actionBtn}
                      >
                        {resolving === ticket.id ? '...' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {data.results.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: 48 }}>
                    No tickets match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #e2e8f0',
  borderRadius: 7, fontSize: 13, color: '#374151', background: '#fff',
}
const thStyle: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left',
  fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}
const tdStyle: React.CSSProperties = {
  padding: '14px 16px', verticalAlign: 'middle',
}
const actionBtn: React.CSSProperties = {
  padding: '5px 12px', border: '1px solid #e2e8f0',
  borderRadius: 6, background: '#fff', cursor: 'pointer',
  fontSize: 12, color: '#475569',
}
