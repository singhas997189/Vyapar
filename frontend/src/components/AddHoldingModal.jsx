import { useState } from 'react'
import { X } from 'lucide-react'
import { addHolding } from '../lib/api'

export default function AddHoldingModal({ symbol, defaultPrice, onClose, onAdded }) {
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState(defaultPrice || '')
  const [buyDate, setBuyDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await addHolding({
        symbol,
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice),
        buy_date: new Date(buyDate).toISOString(),
      })
      onAdded?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
            Add {symbol} to portfolio
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Quantity</label>
        <input
          required
          type="number"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-mono outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Buy price (₹)</label>
        <input
          required
          type="number"
          step="any"
          min="0"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-mono outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Buy date</label>
        <input
          type="date"
          value={buyDate}
          onChange={(e) => setBuyDate(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg text-sm font-mono outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {error && <div className="text-xs mb-3" style={{ color: 'var(--down)' }}>{error}</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg font-semibold text-sm"
          style={{ background: 'var(--gold)', color: 'var(--bg)' }}
        >
          {saving ? 'Adding…' : 'Add holding'}
        </button>
      </form>
    </div>
  )
}
