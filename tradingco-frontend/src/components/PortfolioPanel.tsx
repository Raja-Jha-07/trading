import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Portfolio, Quote } from '../types'

type Props = {
  refreshKey: number
  quotes: Record<string, Quote>
}

export default function PortfolioPanel({ refreshKey, quotes }: Props) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  useEffect(() => {
    let active = true
    api.get<Portfolio>('/portfolio').then(({ data }) => {
      if (active) setPortfolio(data)
    })
    return () => {
      active = false
    }
  }, [refreshKey])

  if (!portfolio) return <p className="muted">Loading portfolio…</p>

  return (
    <>
      <h2 className="panel__title">Portfolio</h2>
      <div className="stats">
        <div>
          <span className="muted">Equity</span>
          <strong className="mono">${portfolio.equity.toFixed(2)}</strong>
        </div>
        <div>
          <span className="muted">Cash</span>
          <strong className="mono">${portfolio.cashBalance.toFixed(2)}</strong>
        </div>
        <div>
          <span className="muted">Holdings</span>
          <strong className="mono">${portfolio.holdingsValue.toFixed(2)}</strong>
        </div>
      </div>

      {portfolio.holdings.length === 0 ? (
        <p className="muted">No open positions yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="num">Qty</th>
              <th className="num">Avg</th>
              <th className="num">Last</th>
              <th className="num">P&L</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.holdings.map((h) => {
              const last = quotes[h.symbol]?.price ?? h.lastPrice
              const pnl = (last - h.avgPrice) * h.quantity
              const up = pnl >= 0
              return (
                <tr key={h.symbol}>
                  <td className="mono">{h.symbol}</td>
                  <td className="num mono">{h.quantity}</td>
                  <td className="num mono">{h.avgPrice.toFixed(2)}</td>
                  <td className="num mono">{last.toFixed(2)}</td>
                  <td className={`num mono ${up ? 'up' : 'down'}`}>
                    {up ? '+' : ''}
                    {pnl.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
