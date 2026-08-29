export type Quote = {
  symbol: string
  price: number
  changePercent: number
  timestamp: string
}

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT'
export type OrderStatus =
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'

export type OrderView = {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  status: OrderStatus
  quantity: number
  filledQuantity: number
  limitPrice: number | null
  avgFillPrice: number
  createdAt: string
}

export type Holding = {
  symbol: string
  quantity: number
  avgPrice: number
  lastPrice: number
  marketValue: number
  unrealizedPnl: number
}

export type Portfolio = {
  cashBalance: number
  holdingsValue: number
  equity: number
  holdings: Holding[]
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}
