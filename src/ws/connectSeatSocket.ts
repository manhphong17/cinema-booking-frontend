"use client"
import SockJS from "sockjs-client"
import { Client, IMessage } from "@stomp/stompjs"

export type SeatAction = 'SELECT_SEAT' | 'DESELECT_SEAT'

export type SeatTicketDTO = {
  ticketId: number
  rowIdx: number
  columnIdx: number
  seatType: string
  status: string
}

export type SeatUpdateMessage = {
  seats: SeatTicketDTO[]
  status: string
  userId: number
  showtimeId: number
}

export type SeatSelectRequest = {
  action: SeatAction
  showtimeId: number
  userId: number
  ticketIds: number[]
}

export async function connectSeatSocket(
    showtimeId: number,
    onSeatUpdate: (message: SeatUpdateMessage) => void,
    onError?: (error: any) => void
) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8885'
    const socket = new SockJS(`${baseUrl}/ws`)

    const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: (str) => {
            console.log('[WebSocket Debug]:', str)
        },
        onConnect: () => {
            console.log('[WebSocket] Connected successfully')
            
            // Subscribe to seat updates for this showtime
            client.subscribe(`/topic/seat/${showtimeId}`, (message: IMessage) => {
                try {
                    const data = JSON.parse(message.body) as SeatUpdateMessage
                    console.log('[WebSocket] Received seat update:', data)
                    onSeatUpdate(data)
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error)
                    onError?.(error)
                }
            })
        },
        onStompError: (frame) => {
            console.error('[WebSocket] STOMP error:', frame)
            onError?.(frame)
        },
        onWebSocketError: (event) => {
            console.error('[WebSocket] WebSocket error:', event)
            onError?.(event)
        },
        onDisconnect: () => {
            console.log('[WebSocket] Disconnected')
        }
    })

    client.activate()
    return client
}

export function sendSeatAction(
    client: Client,
    request: SeatSelectRequest
) {
    if (!client.connected) {
        console.warn('[WebSocket] Cannot send message: not connected')
        return
    }

    console.log('[WebSocket] Sending seat action:', request)
    client.publish({
        destination: '/app/seat/select',
        body: JSON.stringify(request)
    })
}
