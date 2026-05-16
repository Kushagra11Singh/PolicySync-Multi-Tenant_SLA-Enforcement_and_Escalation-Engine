import { useState, useEffect, FormEvent } from 'react'
import { SLAPolicy } from '../types'
import { getPolicies } from '../api/policies'
import { createTicket } from '../api/tickets'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateTicketModal({ onClose, onCreated }: Props) {
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [slaPolicyId, setSlaPolicyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPolicies().then(r => setPolicies(r.results)).catch(() => {})
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        sla_policy: slaPolicyId || undefined,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Failed to create ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32,
        width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          New Ticket
        </h2>

        <form onSubmit={handleSubmit}>
          <Field label="Title *">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short, specific summary of the issue"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Steps to reproduce, impact, any relevant context..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>

            <Field label="SLA Policy">
              <select value={slaPolicyId} onChange={e => setSlaPolicyId(e.target.value)} style={inputStyle}>
                <option value="">None</option>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.resolution_time_hours}h)
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              style={{
                ...ghostBtn,
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 18px', border: '1px solid #e2e8f0',
  borderRadius: 8, background: '#fff', cursor: 'pointer',
  fontSize: 14, fontWeight: 500, color: '#374151',
}
