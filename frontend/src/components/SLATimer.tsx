import { useEffect, useState } from 'react'
import type { SLAStatus } from '../types'

interface Props {
  deadline: string | null
  percentElapsed: number | null
  slaStatus: SLAStatus
}

function formatTimeLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Overdue'

  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)

  if (hours > 48) return `${Math.floor(hours / 24)}d left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

const statusStyles: Record<SLAStatus, { bar: string; text: string; bg: string }> = {
  ok:       { bar: '#22c55e', text: '#166534', bg: '#f0fdf4' },
  at_risk:  { bar: '#f59e0b', text: '#92400e', bg: '#fffbeb' },
  breached: { bar: '#ef4444', text: '#991b1b', bg: '#fef2f2' },
  met:      { bar: '#6366f1', text: '#3730a3', bg: '#eef2ff' },
  none:     { bar: '#d1d5db', text: '#6b7280', bg: '#f9fafb' },
}

export function SLATimer({ deadline, percentElapsed, slaStatus }: Props) {
  const [timeLabel, setTimeLabel] = useState('')

  useEffect(() => {
    if (!deadline) return
    setTimeLabel(formatTimeLeft(deadline))
    const id = setInterval(() => setTimeLabel(formatTimeLeft(deadline)), 30_000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) {
    return <span style={{ color: '#9ca3af', fontSize: 12 }}>No SLA</span>
  }

  const pct = Math.min(percentElapsed ?? 0, 100)
  const style = statusStyles[slaStatus]

  return (
    <div style={{ minWidth: 140 }}>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: '#e5e7eb',
          overflow: 'hidden',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: style.bar,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: style.text,
          background: style.bg,
          padding: '1px 6px',
          borderRadius: 4,
        }}
      >
        {slaStatus === 'met' ? 'Met ✓' : timeLabel}
      </span>
    </div>
  )
}
