import { useState } from 'react'
import { useTickets } from '../hooks/useTickets'
import { SLATimer } from '../components/SLATimer'
import { EscalationBadge } from '../components/EscalationBadge'
import { Navbar } from '../components/Navbar'
import { CreateTicketModal } from '../components/CreateTicketModal'
import type { User, TicketListItem } from '../types'
import { resolveTicket } from '../api/tickets'

interface Props {
  currentUser: User
  onLogout: () => void
}

const STATUS_COLORS: Record<string, string> = {
  open: '#6366f1', in_progress: '#0ea5e9',
  pending: '#f59e0b', resolved: '#22c55e', closed: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280', medium: '#0ea5e9', high: '#f59e0b', critical: '#ef4444',
}

export function TicketsPage({ currentUser, onLogout }: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, loading, error, refetch } = useTickets({
    status: statusFilter || undefined,
    escalated: escalatedOnly || undefined,
  })

  const handleResolve = async (ticket: TicketListItem) => {
    if (!confirm(`Resolve "${ticket.title}"?`)) return
    setResolving(ticket.id)
    try {
      await resolveTicket(ticket.id)
      refetch()
    } finally {
      setResolving(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Tickets</h1>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={escalatedOnly}
              onChange={e => setEscalatedOnly(e.target.checked)}
            />
            Escalated only
          </label>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>
            {data ? `${data.count} ticket${data.count !== 1 ? 's' : ''}` : ''}
          </span>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 18px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Ticket
          </button>
        </div>

        {loading && <p style={{ color: '#64748b', fontSize: 14 }}>Loading tickets…</p>}
        {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}

        {data && (
          <div style={{
            background: '#fff', borderRadius: 10,
            border: '1px solid #e2e8f0', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Title', 'Status', 'Priority', 'Agent', 'SLA', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map(ticket => (
                  <tr key={ticket.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 14, marginBottom: 3 }}>
                        {ticket.title}
                      </div>
                      <EscalationBadge isEscalated={ticket.is_escalated} level={ticket.escalation_level} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: (STATUS_COLORS[ticket.status] ?? '#6b7280') + '20',
                        color: STATUS_COLORS[ticket.status] ?? '#6b7280',
                        padding: '3px 9px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                      }}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: PRIORITY_COLORS[ticket.priority] ?? '#6b7280',
                        fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
                      }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 13 }}>
                      {ticket.assigned_agent_name ?? '—'}
                    </td>
                    <td style={tdStyle}>
                      <SLATimer
                        deadline={ticket.sla_resolution_deadline}
                        percentElapsed={ticket.sla_percent_elapsed}
                        slaStatus={ticket.sla_status}
                      />
                    </td>
                    <td style={tdStyle}>
                      {!['resolved', 'closed'].includes(ticket.status) && (
                        <button
                          onClick={() => handleResolve(ticket)}
                          disabled={resolving === ticket.id}
                          style={ghostBtn}
                        >
                          {resolving === ticket.id ? '…' : 'Resolve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '48px 0' }}>
                      No tickets match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left',
  fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' }
const ghostBtn: React.CSSProperties = {
  padding: '5px 12px', border: '1px solid #e2e8f0',
  borderRadius: 6, background: '#fff', cursor: 'pointer',
  fontSize: 13, color: '#374151', fontWeight: 500,
}
const selectStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #e2e8f0',
  borderRadius: 7, fontSize: 13, color: '#374151', background: '#fff',
}
