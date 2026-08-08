import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getStocks } from '../lib/api'

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState(null)

  useEffect(() => {
    setResults(null)
    getStocks({ search: q }).then((d) => setResults(d.stocks))
  }, [q])

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
        Results for “{q}”
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
        {results ? `${results.length} match${results.length === 1 ? '' : 'es'}` : 'Searching…'}
      </p>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {results?.map((s, i) => (
          <Link
            key={s.symbol}
            to={`/stock/${s.symbol}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            style={{ background: 'var(--surface)', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
          >
            <div>
              <div className="font-mono font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.symbol}</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.name}</div>
            </div>
            <div className="text-xs font-mono" style={{ color: 'var(--gold)' }}>{s.sector}</div>
          </Link>
        ))}
        {results && results.length === 0 && (
          <div className="p-6 text-sm" style={{ color: 'var(--text-dim)' }}>
            No Nifty 500 stocks matched that search.
          </div>
        )}
      </div>
    </div>
  )
}
