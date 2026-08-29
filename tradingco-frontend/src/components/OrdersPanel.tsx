import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { OrderView } from '../types'

export default function OrdersPanel({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<OrderView[]>([])

  useEffect(() => {
    let active = true
    api.get<OrderView[]>('/orders').then(({ data }) => {
      if (active) setOrders(data)
    })
    return () => {
      active = false
    }
  }, [refreshKey])

  return (
    <>
      <h2 className="panel__title">Orders</h2>
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th className="num">Qty</th>
              <th className="num">Filled</th>
              <th className="num">Avg</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.symbol}</td>
                <td className={o.side === 'BUY' ? 'up' : 'down'}>{o.side}</td>
                <td>{o.type}</td>
                <td className="num mono">{o.quantity}</td>
                <td className="num mono">{o.filledQuantity}</td>
                <td className="num mono">{o.avgFillPrice.toFixed(2)}</td>
                <td>
                  <span className={`badge badge--${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
