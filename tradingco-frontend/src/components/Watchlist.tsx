import type { Quote } from '../types'

type Props = {
  quotes: Quote[]
  selected: string
  onSelect: (symbol: string) => void
}

export default function Watchlist({ quotes, selected, onSelect }: Props) {
  return (
    <>
      <h2 className="panel__title">Watchlist</h2>
      {quotes.length === 0 && <p className="muted">Connecting to market data…</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th className="num">Last</th>
            <th className="num">Chg %</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const up = q.changePercent >= 0
            return (
              <tr
                key={q.symbol}
                className={q.symbol === selected ? 'is-selected' : ''}
                onClick={() => onSelect(q.symbol)}
              >
                <td className="mono">{q.symbol}</td>
                <td className="num mono">{q.price.toFixed(2)}</td>
                <td className={`num mono ${up ? 'up' : 'down'}`}>
                  {up ? '+' : ''}
                  {q.changePercent.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
