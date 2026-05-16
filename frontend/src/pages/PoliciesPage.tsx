import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { getPolicies } from '../api/tickets'
import type { User, SLAPolicy } from '../types'

interface Props {
  currentUser: User
  onLogout: () => void
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  low:      { bg: '#f1f5f9', color: '#475569' },
  medium:   { bg: '#e0f2fe', color: '#0369a1' },
  high:     { bg: '#fef3c7', color: '#92400e' },
  critical: { bg: '#fee2e2', color: '#991b1b' },
}

function PolicyCard({ policy }: { policy: SLAPolicy }) {
  const pColor = PRIORITY_COLORS[policy.priority] ?? PRIORITY_COLORS.medium
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
            {policy.name}
          </div>
          {policy.description && (
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{policy.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
          <span style={{
            background: pColor.bg, color: pColor.color,
            fontSize: 11, fontWeight: 700,
            padding: '2px 9px', borderRadius: 10,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {policy.priority}
          </span>
          {!policy.is_active && (
            <span style={{
              background: '#f1f5f9', color: '#94a3b8',
              fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 10,
            }}>
              Inactive
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Stat label="Response SLA"  value={`${policy.response_time_hours}h`}  color="#6366f1" />
        <Stat label="Resolution SLA" value={`${policy.resolution_time_hours}h`} color="#0ea5e9" />
        <Stat
          label="Open Tickets"
          value={String(policy.open_ticket_count)}
          color={policy.open_ticket_count > 0 ? '#f59e0b' : '#22c55e'}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: '#f8fafc', borderRadius: 8, padding: '12px 14px',
      border: '1px solid #f1f5f9',
    }}>
      <div style={{
        fontSize: 11, color: '#94a3b8', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export function PoliciesPage({ currentUser, onLogout }: Props) {
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    getPolicies()
      .then(res => {
        if (Array.isArray(res)) {
          setPolicies(res)
        } else {
          setPolicies(res?.results ?? [])
        }
      })
      .catch(err => {
        console.error('Failed to load policies:', err?.response?.data ?? err)
        setError('Failed to load policies.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Safe even if state is [] — no crash risk
  const activePolicies   = policies.filter(p => p.is_active)
  const inactivePolicies = policies.filter(p => !p.is_active)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>SLA Policies</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'} for {currentUser.tenant_name}
          </p>
        </div>

        {loading && <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>}
        {error   && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}

        {!loading && !error && (
          <>
            {activePolicies.length > 0 && (
              <>
                <SectionHeader>Active Policies</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 28 }}>
                  {activePolicies.map(p => <PolicyCard key={p.id} policy={p} />)}
                </div>
              </>
            )}
            {inactivePolicies.length > 0 && (
              <>
                <SectionHeader>Inactive Policies</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {inactivePolicies.map(p => <PolicyCard key={p.id} policy={p} />)}
                </div>
              </>
            )}
            {policies.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontSize: 14 }}>
                No SLA policies configured yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: '0 0 12px', fontSize: 12, fontWeight: 700,
      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </h2>
  )
}
