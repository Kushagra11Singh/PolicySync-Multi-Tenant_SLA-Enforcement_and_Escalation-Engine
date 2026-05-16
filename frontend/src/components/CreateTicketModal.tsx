import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { createTicket } from '../api/tickets'
import { getPolicies } from '../api/policies'
import type { SLAPolicy, PaginatedResponse } from '../types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateTicketModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [slaPolicyId, setSlaPolicyId] = useState('')
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPolicies()
      .then((res: PaginatedResponse<SLAPolicy>) => setPolicies(res.results))
      .catch(() => {})
  }, [])

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        ...(slaPolicyId ? { sla_policy: slaPolicyId } : {}),
      })
      onCreated()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to create ticket.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: '32px 28px',
        width: 480, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            New Ticket
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: '#94a3b8', padding: '0 4px', lineHeight: 1,
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <Label>Title *</Label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Brief summary of the issue"
            style={inputStyle}
          />

          <Label>Description *</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the issue in detail…"
            style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Priority *</Label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <Label>SLA Policy</Label>
              <select value={slaPolicyId} onChange={e => setSlaPolicyId(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              ...submitBtnStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: 13, fontWeight: 600,
      color: '#374151', marginBottom: 6,
    }}>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, color: '#0f172a',
  marginBottom: 16, boxSizing: 'border-box',
  outline: 'none', background: '#fff',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 18px', border: '1px solid #e2e8f0',
  borderRadius: 8, background: '#fff',
  cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500,
}

const submitBtnStyle: React.CSSProperties = {
  padding: '9px 22px', border: 'none',
  borderRadius: 8, background: '#6366f1',
  color: '#fff', fontSize: 14, fontWeight: 600,
}
