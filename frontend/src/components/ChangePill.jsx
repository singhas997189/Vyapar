export default function ChangePill({ value, suffix = '%' }) {
  if (value === undefined || value === null || isNaN(value)) {
    return <span style={{ color: 'var(--text-dim)' }} className="font-mono text-sm">—</span>
  }
  const positive = value >= 0
  return (
    <span
      className="font-mono text-sm font-semibold"
      style={{ color: positive ? 'var(--up)' : 'var(--down)' }}
    >
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  )
}
