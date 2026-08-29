import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Quote } from '../types'

/**
 * Connects to the STOMP broker over SockJS and streams live quotes from /topic/quotes.
 * Returns a disconnect function.
 */
export function connectQuotes(onQuotes: (quotes: Quote[]) => void): () => void {
  const client = new Client({
    // SockJS handles the transport; disable native WebSocket factory.
    webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe('/topic/quotes', (message) => {
        try {
          onQuotes(JSON.parse(message.body) as Quote[])
        } catch {
          // ignore malformed frames
        }
      })
    },
  })
  client.activate()
  return () => {
    client.deactivate().catch(() => undefined)
  }
}
