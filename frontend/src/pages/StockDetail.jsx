import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Newspaper } from 'lucide-react'
import { getStock, getIndicators, getNews, getSignal } from '../lib/api'
import ChangePill from '../components/ChangePill'
import SignalBadge from '../components/SignalBadge'
import PriceChart from '../components/PriceChart'
import AddHoldingModal from '../components/AddHoldingModal'

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
      <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="font-mono text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{value ?? '—'}</div>
    </div>
  )
}

export default function StockDetail() {
  const { symbol } = useParams()
  const [stock, setStock] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [news, setNews] = useState(null)
  const [signal, setSignal] = useState(null)
  const [errors, setErrors] = useState({})
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    setStock(null); setIndicators(null); setNews(null); setSignal(null); setErrors({})
    getStock(symbol).then(setStock).catch((e) => setErrors((p) => ({ ...p, stock: e.message })))
    getIndicators(symbol).then(setIndicators).catch((e) => setErrors((p) => ({ ...p, indicators: e.message })))
    getNews(symbol).then(setNews).catch((e) => setErrors((p) => ({ ...p, news: e.message })))
    getSignal(symbol).then((d) => setSignal(d.signal)).catch((e) => setErrors((p) => ({ ...p, signal: e.message })))
  }, [symbol])

  const positive = stock?.quote?.change_percent >= 0

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
        <ChevronLeft size={16} /> Back
      </Link>

      {errors.stock && (
        <div className="rounded-lg p-4 text-sm mb-4" style={{ background: 'var(--surface)', color: 'var(--down)' }}>
          Couldn't load {symbol}: {errors.stock}
        </div>
      )}

      {!stock && !errors.stock && (
        <div className="h-40 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
      )}

      {stock && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
                {stock.sector}
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-1" style={{ color: 'var(--text)' }}>
                {stock.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>
                  ₹{stock.quote?.price?.toLocaleString('en-IN')}
                </span>
                <ChangePill value={stock.quote?.change_percent} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {signal && <SignalBadge verdict={signal.verdict} score={signal.score} size="lg" />}
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <Plus size={14} /> Add to portfolio
              </button>
            </div>
          </div>

          {stock.chart?.length > 0 && (
            <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <PriceChart data={stock.chart} positive={positive} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatBox label="Day range" value={stock.quote ? `₹${stock.quote.day_low} – ₹${stock.quote.day_high}` : null} />
            <StatBox label="52w range" value={stock.quote ? `₹${stock.quote.year_low} – ₹${stock.quote.year_high}` : null} />
            <StatBox label="Prev close" value={stock.quote ? `₹${stock.quote.previous_close}` : null} />
            <StatBox
              label="Market cap"
              value={
                stock.quote?.market_cap
                  ? `₹${(stock.quote.market_cap / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
                  : null
              }
            />
          </div>

          {/* Signal reasoning */}
          {signal && (
            <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold" style={{ color: 'var(--text)' }}>Why this signal?</h2>
                <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                  technical {signal.technical_score > 0 ? '+' : ''}{signal.technical_score} · news {signal.news_score > 0 ? '+' : ''}{signal.news_score}
                </div>
              </div>
              <ul className="space-y-1.5">
                {signal.reasons.map((r, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-dim)' }}>
                    <span style={{ color: 'var(--gold)' }}>·</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Indicators */}
          {indicators && (
            <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-display font-semibold mb-3" style={{ color: 'var(--text)' }}>Technical indicators</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="RSI (14)" value={indicators.rsi_14} />
                <StatBox label="MACD" value={indicators.macd} />
                <StatBox label="SMA 20" value={indicators.sma_20 ? `₹${indicators.sma_20}` : null} />
                <StatBox label="SMA 50" value={indicators.sma_50 ? `₹${indicators.sma_50}` : null} />
                <StatBox label="SMA 200" value={indicators.sma_200 ? `₹${indicators.sma_200}` : null} />
                <StatBox label="Bollinger upper" value={indicators.bollinger_upper ? `₹${indicators.bollinger_upper}` : null} />
                <StatBox label="Bollinger lower" value={indicators.bollinger_lower ? `₹${indicators.bollinger_lower}` : null} />
              </div>
            </div>
          )}

          {/* News */}
          <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Newspaper size={16} /> Latest news
              </h2>
              {news?.sentiment_summary && (
                <SignalBadge
                  verdict={
                    news.sentiment_summary.label === 'positive' ? 'BUY' :
                    news.sentiment_summary.label === 'negative' ? 'SELL' : 'HOLD'
                  }
                />
              )}
            </div>
            {errors.news && <div className="text-sm" style={{ color: 'var(--down)' }}>Couldn't load news: {errors.news}</div>}
            {!news && !errors.news && <div className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading news…</div>}
            {news && (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {news.articles.length === 0 && (
                  <li className="text-sm py-2" style={{ color: 'var(--text-dim)' }}>No recent news found.</li>
                )}
                {news.articles.map((a, i) => (
                  <li key={i} className="py-3">
                    <a href={a.link} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline" style={{ color: 'var(--text)' }}>
                      {a.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                      <span>{a.source}</span>
                      <span>·</span>
                      <span>{a.published}</span>
                      <span
                        className="ml-auto font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: a.sentiment === 'positive' ? 'var(--up)' : a.sentiment === 'negative' ? 'var(--down)' : 'var(--text-dim)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        {a.sentiment}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {showAdd && (
        <AddHoldingModal
          symbol={symbol}
          defaultPrice={stock?.quote?.price}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
