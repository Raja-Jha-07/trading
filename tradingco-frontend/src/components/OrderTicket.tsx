import { FormEvent, useState } from 'react'
import { api } from '../api/client'
import type { OrderSide, OrderType, OrderView } from '../types'

type Props = {
  symbol: string
  price?: number
  onFilled: () => void
}

export default function OrderTicket({ symbol, price, onFilled }: Props) {
  const [side, setSide] = useState<OrderSide>('BUY')
  const [type, setType] = useState<OrderType>('MARKET')
  const [quantity, setQuantity] = useState(10)
  const [limitPrice, setLimitPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFeedback(null)
    setBusy(true)
    try {
      const body = {
        symbol,
        side,
        type,
        quantity,
        limitPrice: type === 'LIMIT' ? Number(limitPrice) : null,
        // Idempotency key makes this submission safe to retry.
        idempotencyKey: crypto.randomUUID(),
      }
      const { data } = await api.post<OrderView>('/orders', body)
      setFeedback(
        `${data.status} — filled ${data.filledQuantity}/${data.quantity} @ ${data.avgFillPrice.toFixed(2)}`,
      )
      onFilled()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail ?? 'Order rejected')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2 className="panel__title">Order Ticket</h2>
      <div className="ticket__symbol">
        <span className="mono big">{symbol}</span>
        {price != null && <span className="muted mono">{price.toFixed(2)}</span>}
      </div>

      <form onSubmit={submit} className="ticket">
        <div className="seg">
          <button
            type="button"
            className={side === 'BUY' ? 'seg__btn is-buy' : 'seg__btn'}
            onClick={() => setSide('BUY')}
          >
            Buy
          </button>
          <button
            type="button"
            className={side === 'SELL' ? 'seg__btn is-sell' : 'seg__btn'}
            onClick={() => setSide('SELL')}
          >
            Sell
          </button>
        </div>

        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as OrderType)}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </label>

        <label>
          Quantity
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>

        {type === 'LIMIT' && (
          <label>
            Limit price
            <input
              type="number"
              step="0.01"
              min={0}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              required
            />
          </label>
        )}

        {feedback && <div className="success">{feedback}</div>}
        {error && <div className="error">{error}</div>}

        <button className={`btn ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`} disabled={busy}>
          {busy ? 'Submitting…' : `${side} ${quantity} ${symbol}`}
        </button>
      </form>
    </>
  )
}
