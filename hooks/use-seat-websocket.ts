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
    onReleased?: (userId: number, ticketIds: number[]) => void,
    onBooked?: (ticketIds: number[]) => void
) {
    const clientRef = useRef<Client | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [heldSeats, setHeldSeats] = useState<Set<number>>(new Set())
    const [seatsByUser, setSeatsByUser] = useState<Map<number, Set<number>>>(new Map())

    // Use refs to store latest callbacks to avoid reconnecting WebSocket
    const onReleasedRef = useRef(onReleased)
    const onBookedRef = useRef(onBooked)
    const userIdRef = useRef(userId)

    // Update refs when callbacks change
    useEffect(() => {
        onReleasedRef.current = onReleased
        onBookedRef.current = onBooked
        userIdRef.current = userId
    }, [onReleased, onBooked, userId])

    // Handle incoming seat updates
    const handleSeatUpdate = useCallback((message: SeatUpdateMessage) => {
        console.log('[useSeatWebSocket] Received update:', message)

        const ticketIds = message.seats.map(s => s.ticketId)

        if (message.status === 'HELD') {
            // Someone held seats
            const userId = message.userId
            if (userId !== undefined) {
                setHeldSeats(prev => {
                    const updated = new Set(prev)
                    ticketIds.forEach(id => updated.add(id))
                    return updated
                })

                setSeatsByUser(prev => {
                    const updated = new Map(prev)
                    const userSeats = updated.get(userId) || new Set()
                    ticketIds.forEach(id => userSeats.add(id))
                    updated.set(userId, userSeats)
                    return updated
                })
            }
        } else if (message.status === 'RELEASED') {
            // Someone released seats
            const userId = message.userId
            if (userId !== undefined) {
                setHeldSeats(prev => {
                    const updated = new Set(prev)
                    ticketIds.forEach(id => updated.delete(id))
                    return updated
                })

                setSeatsByUser(prev => {
                    const updated = new Map(prev)
                    const userSeats = updated.get(userId)
                    if (userSeats) {
                        ticketIds.forEach(id => userSeats.delete(id))
                        if (userSeats.size === 0) {
                            updated.delete(userId)
                        }
                    }
                    return updated
                })

                // Notify callback when seats are released (for cleanup purposes)
                if (onReleasedRef.current && userId === userIdRef.current) {
                    onReleasedRef.current(userId, ticketIds)
                }
            }
        } else if (message.status === 'FAILED') {
            console.warn('[useSeatWebSocket] Seat selection failed for user', message.userId)
        } else if (message.status === 'BOOKED') {
            // Seats were booked - remove from heldSeats and seatsByUser
            console.log('[useSeatWebSocket] Seats booked for showtime', message.showtimeId, 'ticketIds:', ticketIds)
            setHeldSeats(prev => {
                const updated = new Set(prev)
                ticketIds.forEach(id => updated.delete(id))
                return updated
            })

            setSeatsByUser(prev => {
                const updated = new Map(prev)
                // Remove from all users' held seats
                updated.forEach((userSeats, userId) => {
                    ticketIds.forEach(id => userSeats.delete(id))
                    if (userSeats.size === 0) {
                        updated.delete(userId)
                    }
                })
                return updated
            })

            // Notify callback when seats are booked
            if (onBookedRef.current) {
                onBookedRef.current(ticketIds)
            }
        }
    }, [])

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
    }, [enabled, showtimeId]) // Removed handleSeatUpdate from dependencies

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

    // Sync WebSocket state with seatData from API
    // This ensures WebSocket state matches backend status when page loads
    const syncWithSeatData = useCallback((seatData: Array<{ ticketId: number; seatStatus: string }>) => {
        if (!seatData || seatData.length === 0) return

        // Find all seats with HELD status and add them to heldSeats
        const heldTicketIds = seatData
            .filter(seat => seat.seatStatus === 'HELD')
            .map(seat => seat.ticketId)

        if (heldTicketIds.length > 0) {
            setHeldSeats(prev => {
                const updated = new Set(prev)
                heldTicketIds.forEach(id => updated.add(id))
                return updated
            })

            console.log('[useSeatWebSocket] Synced with seatData:', {
                heldSeatsCount: heldTicketIds.length
            })
        }
    }, [])

    return {
        isConnected,
        heldSeats,
        seatsByUser,
        selectSeats,
        deselectSeats,
        syncWithSeatData
    }
}

