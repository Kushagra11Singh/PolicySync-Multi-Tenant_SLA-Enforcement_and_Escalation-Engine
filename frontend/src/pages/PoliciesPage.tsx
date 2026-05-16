import { useState, useEffect } from 'react'
import { SLAPolicy, User } from '../types'
import { getPolicies } from '../api/policies'

interface Props {
  currentUser: User
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#0ea5e9', high: '#f59e0b', critical: '#ef4444',
}

export function PoliciesPage({ currentUser }: Props) {
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPolicies()
      .then(r => setPolicies(r.results))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>SLA Policies</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
          {currentUser.tenant_name} · {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {policies.map(policy => (
          <div key={policy.id} style={{
            background: '#fff', borderRadius: 10,
            border: '1px solid #e2e8f0', padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {policy.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  {policy.description}
                </p>
              </div>
              <span style={{
                background: PRIORITY_COLOR[policy.priority] + '18',
                color: PRIORITY_COLOR[policy.priority],
                padding: '2px 8px', borderRadius: 5,
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: 12,
              }}>
                {policy.priority}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <Stat label="First Response" value={`${policy.response_time_hours}h`} />
              <Stat label="Resolution" value={`${policy.resolution_time_hours}h`} />
              <Stat label="Open Tickets" value={String(policy.open_ticket_count)} />
              <Stat label="Status" value={policy.is_active ? 'Active' : 'Inactive'} />
            </div>
          </div>
        ))}
      </div>

      {!loading && policies.length === 0 && (
        <div style={{
          background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
          padding: 48, textAlign: 'center', color: '#94a3b8',
        }}>
          No SLA policies yet. Use the API at{' '}
          <a href="http://localhost:8001/api/docs/" target="_blank" rel="noreferrer"
            style={{ color: '#6366f1' }}>
            localhost:8001/api/docs
          </a>{' '}
          to create one, or run the seed command.
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 7, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
        {value}
      </div>
    </div>
  )
}
