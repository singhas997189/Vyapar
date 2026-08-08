import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, Wallet, Search, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
]

export default function Layout({ children }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function onSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 hidden md:flex flex-col border-r"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="px-6 py-6 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center font-display font-bold text-sm"
            style={{ background: 'var(--gold)', color: 'var(--bg)' }}
          >
            V
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text)' }}>
              Vyapar
            </div>
            <div className="text-[11px] tracking-wide" style={{ color: 'var(--text-dim)' }}>
              NIFTY 500 ANALYZER
            </div>
          </div>
        </div>

        <nav className="px-3 mt-4 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? '' : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--bg)' : 'var(--text-dim)',
                background: isActive ? 'var(--gold)' : 'transparent',
              })}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-6 py-5 text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Data via Yahoo Finance & Google News.
          <br />
          Signals are algorithmic, not investment advice.
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 shrink-0 border-b flex items-center gap-4 px-4 md:px-8"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="md:hidden flex items-center gap-2 font-display font-bold" style={{ color: 'var(--gold)' }}>
            <TrendingUp size={20} /> Vyapar
          </div>
          <form onSubmit={onSearch} className="flex-1 max-w-md relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-dim)' }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks — e.g. RELIANCE, TCS, INFY"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </form>
          <div className="md:hidden flex gap-3">
            {navItems.map(({ to, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} style={{ color: 'var(--text-dim)' }}>
                <Icon size={20} />
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
