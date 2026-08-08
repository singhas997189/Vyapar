const styles = {
  BUY: { bg: 'rgba(47,191,113,0.14)', color: 'var(--up)', border: 'var(--up-dim)' },
  SELL: { bg: 'rgba(229,72,77,0.14)', color: 'var(--down)', border: 'var(--down-dim)' },
  HOLD: { bg: 'rgba(227,166,57,0.14)', color: 'var(--gold)', border: 'var(--gold-dim)' },
}

export default function SignalBadge({ verdict, score, size = 'md' }) {
  const s = styles[verdict] || styles.HOLD
  const pad = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold tracking-wide ${pad}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {verdict}
      {typeof score === 'number' && (
        <span className="opacity-70 font-normal">{score > 0 ? `+${score}` : score}</span>
      )}
    </span>
  )
}
