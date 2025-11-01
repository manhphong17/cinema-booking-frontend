"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import { 
  connectSeatSocket, 
  sendSeatAction, 
  SeatUpdateMessage, 
  SeatSelectRequest,
  SeatAction 
} from '@/src/ws/connectSeatSocket'

export function useSeatWebSocket(
  showtimeId: number | null,
  userId: number | null,
  enabled: boolean = true,
  onExpired?: (userId: number, showtimeId: number) => void
) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [heldSeats, setHeldSeats] = useState<Set<number>>(new Set())
  const [seatsByUser, setSeatsByUser] = useState<Map<number, Set<number>>>(new Map())

  // Handle incoming seat updates
  const handleSeatUpdate = useCallback((message: SeatUpdateMessage) => {
    console.log('[useSeatWebSocket] Received update:', message)
    
    const ticketIds = message.seats.map(s => s.ticketId)
    
    if (message.status === 'HELD') {
      // Someone held seats
      setHeldSeats(prev => {
        const updated = new Set(prev)
        ticketIds.forEach(id => updated.add(id))
        return updated
      })
      
      setSeatsByUser(prev => {
        const updated = new Map(prev)
        const userSeats = updated.get(message.userId) || new Set()
        ticketIds.forEach(id => userSeats.add(id))
        updated.set(message.userId, userSeats)
        return updated
      })
    } else if (message.status === 'RELEASED') {
      // Someone released seats
      setHeldSeats(prev => {
        const updated = new Set(prev)
        ticketIds.forEach(id => updated.delete(id))
        return updated
      })
      
      setSeatsByUser(prev => {
        const updated = new Map(prev)
        const userSeats = updated.get(message.userId)
        if (userSeats) {
          ticketIds.forEach(id => userSeats.delete(id))
          if (userSeats.size === 0) {
            updated.delete(message.userId)
          }
        }
        return updated
      })
    } else if (message.status === 'FAILED') {
      console.warn('[useSeatWebSocket] Seat selection failed for user', message.userId)
    } else if (message.status === 'EXPIRED') {
      // Seat hold expired - notify callback
      console.log('[useSeatWebSocket] Seat hold expired for user', message.userId, 'showtime', message.showtimeId)
      if (onExpired) {
        onExpired(message.userId, message.showtimeId)
      }
    }
  }, [onExpired])

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || !showtimeId) {
      return
    }

    let mounted = true

    const connect = async () => {
      try {
        console.log('[useSeatWebSocket] Connecting to WebSocket for showtime:', showtimeId)
        const client = await connectSeatSocket(
          showtimeId,
          handleSeatUpdate,
          (error) => {
            console.error('[useSeatWebSocket] WebSocket error:', error)
          }
        )

        if (mounted) {
          clientRef.current = client
          setIsConnected(true)
          console.log('[useSeatWebSocket] Connected')
        } else {
          client.deactivate()
        }
      } catch (error) {
        console.error('[useSeatWebSocket] Failed to connect:', error)
      }
    }

    connect()

    return () => {
      mounted = false
      if (clientRef.current) {
        console.log('[useSeatWebSocket] Disconnecting')
        clientRef.current.deactivate()
        clientRef.current = null
        setIsConnected(false)
      }
    }
  }, [enabled, showtimeId, handleSeatUpdate])

  // Select seats
  const selectSeats = useCallback((ticketIds: number[]) => {
    if (!clientRef.current || !showtimeId || !userId) {
      console.warn('[useSeatWebSocket] Cannot select seats: not ready')
      return
    }

    const request: SeatSelectRequest = {
      action: 'SELECT_SEAT' as SeatAction,
      showtimeId,
      userId,
      ticketIds
    }

    sendSeatAction(clientRef.current, request)
  }, [showtimeId, userId])

  // Deselect seats
  const deselectSeats = useCallback((ticketIds: number[]) => {
    if (!clientRef.current || !showtimeId || !userId) {
      console.warn('[useSeatWebSocket] Cannot deselect seats: not ready')
      return
    }

    const request: SeatSelectRequest = {
      action: 'DESELECT_SEAT' as SeatAction,
      showtimeId,
      userId,
      ticketIds
    }

    sendSeatAction(clientRef.current, request)
  }, [showtimeId, userId])

  return {
    isConnected,
    heldSeats,
    seatsByUser,
    selectSeats,
    deselectSeats
  }
}

