interface Props {
  isEscalated: boolean
  level: number
}

export function EscalationBadge({ isEscalated, level }: Props) {
  if (!isEscalated) return null

  const colors = ['', '#f59e0b', '#ef4444', '#7c3aed']
  const bg = colors[level] ?? '#ef4444'

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 10,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      L{level} Escalated
    </span>
  )
}
