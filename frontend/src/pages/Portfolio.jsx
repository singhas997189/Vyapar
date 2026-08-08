import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { getPortfolio, deleteHolding } from '../lib/api'
import ChangePill from '../components/ChangePill'

function SummaryCard({ label, value, sub }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="font-mono text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</div>
      {sub}
    </div>
  )
}

export default function Portfolio() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    getPortfolio().then(setData).catch((e) => setError(e.message))
  }

  useEffect(load, [])

  async function remove(id) {
    await deleteHolding(id)
    load()
  }

  const summary = data?.summary

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Your portfolio</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
        Add holdings from any stock page. Prices refresh from the market on every load.
      </p>

      {error && (
        <div className="rounded-lg p-4 text-sm mb-6" style={{ background: 'var(--surface)', color: 'var(--down)' }}>
          Couldn't load your portfolio: {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard label="Invested" value={`₹${summary.total_invested.toLocaleString('en-IN')}`} />
          <SummaryCard label="Current value" value={`₹${summary.total_current_value.toLocaleString('en-IN')}`} />
          <SummaryCard
            label="Total P&L"
            value={`₹${summary.total_pnl.toLocaleString('en-IN')}`}
            sub={<div className="mt-1"><ChangePill value={summary.total_pnl_percent} /></div>}
          />
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide"
          style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
        >
          <div>Stock</div>
          <div>Qty</div>
          <div>Buy price</div>
          <div>Current</div>
          <div>P&L</div>
          <div></div>
        </div>

        {data?.holdings.length === 0 && (
          <div className="p-8 text-center" style={{ background: 'var(--surface)' }}>
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No holdings yet. Search a stock and add it to your portfolio.
            </div>
          </div>
        )}

        {data?.holdings.map((h, i) => (
          <div
            key={h.id}
            className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center"
            style={{ background: 'var(--surface)', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
          >
            <div className="col-span-2 md:col-span-1">
              <Link to={`/stock/${h.symbol}`} className="font-mono font-semibold text-sm hover:underline" style={{ color: 'var(--text)' }}>
                {h.symbol}
              </Link>
              <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{h.name}</div>
            </div>
            <div className="font-mono text-sm" style={{ color: 'var(--text)' }}>{h.quantity}</div>
            <div className="font-mono text-sm" style={{ color: 'var(--text)' }}>₹{h.buy_price}</div>
            <div className="font-mono text-sm" style={{ color: 'var(--text)' }}>₹{h.current_price}</div>
            <div>
              <div className="font-mono text-sm" style={{ color: h.pnl >= 0 ? 'var(--up)' : 'var(--down)' }}>
                {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString('en-IN')}
              </div>
              <ChangePill value={h.pnl_percent} />
            </div>
            <button onClick={() => remove(h.id)} style={{ color: 'var(--text-dim)' }} title="Remove">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
