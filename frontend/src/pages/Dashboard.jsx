import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getSectors } from '../lib/api'

export default function Dashboard() {
  const [sectors, setSectors] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSectors().then(setSectors).catch((e) => setError(e.message))
  }, [])

  return (
    <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>
          Sectors, at a glance
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          501 Nifty 500 constituents, grouped by industry. Pick a sector to drill into individual stocks.
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'var(--surface)', color: 'var(--down)' }}>
          Couldn't reach the API: {error}. Is the backend running?
        </div>
      )}

      {!sectors && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      )}

      {sectors && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sectors.map((s) => (
            <Link
              key={s.sector}
              to={`/sector/${encodeURIComponent(s.sector)}`}
              className="group rounded-xl p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <div className="font-display font-semibold text-base leading-snug" style={{ color: 'var(--text)' }}>
                  {s.sector}
                </div>
                <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-dim)' }}>
                  {s.stock_count} stocks
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <ArrowRight
                  size={16}
                  className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  style={{ color: 'var(--gold)' }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
