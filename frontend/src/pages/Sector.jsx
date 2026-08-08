import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getSectorOverview } from '../lib/api'
import ChangePill from '../components/ChangePill'

export default function Sector() {
  const { name } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    setError(null)
    getSectorOverview(name).then(setData).catch((e) => setError(e.message))
  }, [name])

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
        <ChevronLeft size={16} /> All sectors
      </Link>
      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
        {name}
      </h1>

      {error && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'var(--surface)', color: 'var(--down)' }}>
          Couldn't load this sector: {error}
        </div>
      )}

      {!data && !error && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      )}

      {data && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {data.stocks.length === 0 && (
            <div className="p-6 text-sm" style={{ color: 'var(--text-dim)' }}>
              No live pricing available for this sector right now.
            </div>
          )}
          {data.stocks.map((s, i) => (
            <Link
              key={s.symbol}
              to={`/stock/${s.symbol}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              style={{
                background: 'var(--surface)',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div className="min-w-0">
                <div className="font-mono font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {s.symbol}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                  {s.name}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>
                  ₹{s.price?.toLocaleString('en-IN')}
                </span>
                <ChangePill value={s.change_percent} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
