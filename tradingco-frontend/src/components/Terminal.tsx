import { useCallback, useEffect, useState } from 'react'
import { connectQuotes } from '../lib/ws'
import { useAuth } from '../store/auth'
import type { Quote } from '../types'
import Watchlist from './Watchlist'
import OrderTicket from './OrderTicket'
import PortfolioPanel from './PortfolioPanel'
import OrdersPanel from './OrdersPanel'

export default function Terminal() {
  const { email, logout } = useAuth()
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [selected, setSelected] = useState<string>('AAPL')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const disconnect = connectQuotes((incoming) => {
      setQuotes((prev) => {
        const next = { ...prev }
        for (const q of incoming) next[q.symbol] = q
        return next
      })
    })
    return disconnect
  }, [])

  const onFilled = useCallback(() => setRefreshKey((k) => k + 1), [])
  const quoteList = Object.values(quotes).sort((a, b) => a.symbol.localeCompare(b.symbol))

  return (
    <div className="terminal">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="dot" /> TradingCo <span className="tag">TERMINAL</span>
        </div>
        <div className="topbar__right">
          <span className="muted">{email}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="panel panel--watchlist">
          <Watchlist quotes={quoteList} selected={selected} onSelect={setSelected} />
        </section>

        <section className="panel">
          <OrderTicket
            symbol={selected}
            price={quotes[selected]?.price}
            onFilled={onFilled}
          />
        </section>

        <section className="panel">
          <PortfolioPanel refreshKey={refreshKey} quotes={quotes} />
        </section>

        <section className="panel panel--orders">
          <OrdersPanel refreshKey={refreshKey} />
        </section>
      </main>
    </div>
  )
}
