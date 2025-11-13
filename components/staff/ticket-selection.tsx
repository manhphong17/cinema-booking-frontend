"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, MapPin, Loader2, Monitor, Sofa } from "lucide-react"
import { getMoviesWithShowtimesToday } from "@/src/api/movies"
import type { StaffMovie } from "@/src/api/movies"
import { apiClient } from "@/src/api/interceptor"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"
import { jwtDecode } from "jwt-decode"
import {Button} from "@/components/ui/button";

interface ShowtimeInfo {
  showTimeId: number
  startTime: string
  endTime: string
  roomId: number
  roomName: string
  roomType: string
  totalSeat: number
  totalSeatAvailable: number
}

interface ShowtimeResponse {
  status: number
  message: string
  data: ShowtimeInfo[]
}

interface TicketResponse {
  ticketId: number
  rowIdx: number
  columnInx: number
  seatType: string
  seatStatus: string
  ticketPrice: number
}

interface BookingSeatsData {
  showTimeId: number
  roomId: number
  ticketResponses: TicketResponse[]
}

interface SeatResponse {
  status: number
  message: string
  data: BookingSeatsData[]
}

interface TicketSelectionProps {
  onAddToCart: (item: {
    type: "ticket" | "concession"
    name: string
    price: number
    quantity: number
    details?: string
  }) => void
  onSyncTicketsToCart?: (showtimeId: number | null, movieName: string | null, showtimeInfo: string | null, selectedSeats: string[], seatPrices: Record<string, number>, seatTypes?: Record<string, string>, ticketIds?: number[]) => void
}

export function TicketSelection({ onAddToCart, onSyncTicketsToCart }: TicketSelectionProps) {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([])
  
  // API data
  const [apiMovies, setApiMovies] = useState<StaffMovie[]>([])
  const [showtimes, setShowtimes] = useState<ShowtimeInfo[]>([])
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  
  // Loading states
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [loadingShowtimes, setLoadingShowtimes] = useState(false)
  const [loadingSeats, setLoadingSeats] = useState(false)
  
  // User ID from token
  const [userId, setUserId] = useState<number | null>(null)

// === Quản lý chọn ngày ===
    const [selectedDate, setSelectedDate] = useState(new Date())

// Hàm tiện ích format YYYY-MM-DD cho API
    const formatApiDate = (date: Date) => date.toISOString().split("T")[0]


    const [datePage, setDatePage] = useState(0)
    const daysPerPage = 5
    const maxDays = 30 // giới hạn 30 ngày kế tiếp

// Danh sách tất cả ngày
    const allDays = Array.from({ length: maxDays }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
    })

// 5 ngày đang hiển thị
    const visibleDays = allDays.slice(datePage * daysPerPage, (datePage + 1) * daysPerPage)

    const formatWeekday = (date: Date) => {
        const today = new Date()
        const diff = Math.floor((date.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
        if (diff === 0) return "Hôm nay"
        if (diff === 1) return "Ngày mai"
        return date.toLocaleDateString("vi-VN", { weekday: "long" })
    }

    const formatDay = (date: Date) => date.getDate()
    const formatMonth = (date: Date) => date.toLocaleDateString("vi-VN", { month: "short" }).replace(".", "")


    // Get user ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }, [])
  
  // WebSocket for seat synchronization
  const handleSeatReleased = useCallback((releasedUserId: number, ticketIds: number[]) => {
    // When current user's seats are released via WebSocket, update local seatData
    // This ensures UI reflects the release immediately, even if backendStatus hasn't updated in API response
    if (releasedUserId === userId) {
      console.log('[Staff] WebSocket RELEASED confirmed, updating local seatData:', ticketIds)
      
      // Update local seatData to reflect the release
      setSeatData(prev => prev.map(seat => {
        if (ticketIds.includes(seat.ticketId) && seat.seatStatus === 'HELD') {
          return { ...seat, seatStatus: 'AVAILABLE' }
        }
        return seat
      }))
      
      // Now cleanup releasedSeatsRef since we've updated the local state
      ticketIds.forEach(ticketId => {
        releasedSeatsRef.current.delete(ticketId)
        console.log('[Staff] Removed from releasedSeatsRef - local state updated:', ticketId)
      })
    }
  }, [userId])
  
  const { isConnected, heldSeats, seatsByUser, selectSeats, deselectSeats, syncWithSeatData } = useSeatWebSocket(
    selectedShowtimeId,
    userId,
    !!selectedShowtimeId && !!userId,
    handleSeatReleased, // Callback when seats are released
    undefined // No booked handler for staff
  )
  
  // Track sent seats to avoid duplicate WebSocket calls
  const sentSeatsRef = useRef<Set<number>>(new Set())
  
  // Track seats that were just released by current user (to ignore stale backendStatus HELD)
  const releasedSeatsRef = useRef<Set<number>>(new Set())

  // Load movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true)
      try {
        const moviesData = await getMoviesWithShowtimesToday(formatApiDate(selectedDate))
        setApiMovies(moviesData)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setLoadingMovies(false)
      }
    }
    fetchMovies()
  }, [selectedDate])

  // Fetch showtimes when movie is selected
  useEffect(() => {
    if (!selectedMovieId) {
      setShowtimes([])
      return
    }

    const fetchShowtimes = async () => {
      setLoadingShowtimes(true)
      setShowtimes([])
      setSelectedShowtimeId(null)
      setSeatData([])
      try {
        const response = await apiClient.get<ShowtimeResponse>(
          `/bookings/movies/${selectedMovieId}/show-times/${formatApiDate(selectedDate)}`
        )
        if (response.data?.status === 200 && response.data?.data) {
          setShowtimes(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching showtimes:", error)
      } finally {
        setLoadingShowtimes(false)
      }
    }

    fetchShowtimes()
  }, [selectedMovieId, selectedDate])

  // Fetch seats when showtime is selected
  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeatData([])
      setSelectedSeats([])
      setSelectedTicketIds([])
      hasRestoredRef.current = false // Reset restore flag
      releasedSeatsRef.current.clear() // Clear released seats when showtime is cleared
      return
    }

    const fetchSeats = async () => {
      setLoadingSeats(true)
      setSeatData([])
      hasRestoredRef.current = false // Reset restore flag when fetching new seats
      releasedSeatsRef.current.clear() // Clear released seats when fetching new showtime
      // Don't clear selected seats here - let WebSocket restore them
      try {
        const response = await apiClient.get<SeatResponse>(
          `/bookings/show-times/${selectedShowtimeId}/seats`
        )
        if (response.data?.status === 200 && response.data?.data && response.data.data.length > 0) {
          // API returns array of BookingSeatsData, extract ticketResponses
          const tickets = response.data.data[0].ticketResponses
          setSeatData(tickets)
          
          // Sync WebSocket state with seatData (for seats with HELD status)
          if (syncWithSeatData && tickets.length > 0) {
            syncWithSeatData(tickets.map(t => ({ ticketId: t.ticketId, seatStatus: t.seatStatus })))
          }
        }
      } catch (error) {
        console.error("Error fetching seats:", error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeats()
  }, [selectedShowtimeId])

  const currentMovie = apiMovies.find((m) => m.id === selectedMovieId)
  const currentShowtime = showtimes.find((s) => s.showTimeId === selectedShowtimeId)

  // Helper functions to work with TicketResponse
  const getTicketId = (seatId: string): number | null => {
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })
    return seat?.ticketId || null
  }

  // Track if we've already restored seats to avoid infinite loop
  const hasRestoredRef = useRef(false)
  
  // Restore user's held seats from API when seatData is loaded
  useEffect(() => {
    if (!userId || !selectedShowtimeId || !seatData.length) return
    if (hasRestoredRef.current) return // Already restored once
    
    const restoreHeldSeats = async () => {
      try {
        const response = await apiClient.get<{
          status: number
          message: string
          data: {
            seats: Array<{ ticketId: number; rowIdx: number; columnIdx: number; seatType: string; status: string }>
          }
        }>(`/bookings/show-times/${selectedShowtimeId}/users/${userId}/seat-hold`)
        
        if (response.data?.status === 200 && response.data?.data?.seats) {
          const heldSeats = response.data.data.seats
          const restoredSeats: string[] = []
          
          heldSeats.forEach(seat => {
            const rowLabel = String.fromCharCode(65 + seat.rowIdx)
            const seatNumber = seat.columnIdx + 1
            const seatId = `${rowLabel}${seatNumber}`
            restoredSeats.push(seatId)
          })
          
          console.log('[Staff] Restoring held seats from API:', restoredSeats)
          if (restoredSeats.length > 0) {
            hasRestoredRef.current = true
            setSelectedSeats(restoredSeats)
            // Clear releasedSeatsRef when restoring - these seats are being restored, not released
            restoredSeats.forEach(seatId => {
              const ticketId = getTicketId(seatId)
              if (ticketId) {
                releasedSeatsRef.current.delete(ticketId)
              }
            })
          } else {
            // If no seats to restore, clear releasedSeatsRef for this showtime
            releasedSeatsRef.current.clear()
          }
        }
      } catch (error) {
        // No held seats or error - ignore
        console.log('[Staff] No held seats to restore or error:', error)
      }
    }
    
    restoreHeldSeats()
  }, [userId, selectedShowtimeId, seatData])
  
  // Sync selected seats with ticket IDs
  useEffect(() => {
    const ticketIds: number[] = []
    selectedSeats.forEach(seatId => {
      const ticketId = getTicketId(seatId)
      if (ticketId) {
        ticketIds.push(ticketId)
      }
    })
    setSelectedTicketIds(ticketIds)
  }, [selectedSeats, seatData])

  // Sync ticket IDs with WebSocket after restoring from URL/page load
  // CHỈ gọi khi có ghế MỚI được thêm vào (không gọi lại khi đã gửi rồi)
  useEffect(() => {
    if (!isConnected || !selectedShowtimeId || !userId || selectedTicketIds.length === 0) return

    // Chỉ lấy những ghế MỚI chưa được gửi qua WebSocket
    const newTicketsToSelect = selectedTicketIds.filter(ticketId => {
      // Đã gửi rồi, bỏ qua
      if (sentSeatsRef.current.has(ticketId)) {
        return false
      }
      
      // Check if this ticket is held by someone else (not current user)
      if (!heldSeats.has(ticketId)) {
        // Not held by anyone, can select
        return true
      }
      
      // Check if held by current user
      const currentUserSeats = userId ? seatsByUser.get(userId) : null
      if (currentUserSeats && currentUserSeats.has(ticketId)) {
        // Held by current user, can select
        return true
      }
      
      // Held by someone else, cannot select
      return false
    })

    if (newTicketsToSelect.length > 0) {
      console.log('[Staff] Auto-selecting new tickets via WebSocket:', newTicketsToSelect)
      // Đánh dấu đã gửi những ghế này
      newTicketsToSelect.forEach(ticketId => sentSeatsRef.current.add(ticketId))
      selectSeats(newTicketsToSelect)
    }
  }, [isConnected, selectedShowtimeId, userId, selectedTicketIds, selectSeats, heldSeats, seatsByUser])

  // Cleanup: xóa ghế đã bỏ chọn khỏi sentSeatsRef
  // Note: Không tự động deselect qua WebSocket ở đây - deselect sẽ được gọi trong handleSeatSelect
  useEffect(() => {
    // So sánh với selectedTicketIds hiện tại
    const currentSelectedSet = new Set(selectedTicketIds)
    const toRemove: number[] = []
    
    sentSeatsRef.current.forEach((ticketId: number) => {
      if (!currentSelectedSet.has(ticketId)) {
        // Ghế này không còn trong selectedTicketIds nữa, xóa khỏi sentSeatsRef
        toRemove.push(ticketId)
      }
    })
    
    toRemove.forEach(ticketId => sentSeatsRef.current.delete(ticketId))
  }, [selectedTicketIds])
  
  // Clean up releasedSeatsRef when backendStatus is no longer HELD
  // This is the primary cleanup mechanism - wait for backendStatus to actually update
  // from HELD to AVAILABLE/BOOKED before removing from releasedSeatsRef
  useEffect(() => {
    if (!seatData.length) return
    
    releasedSeatsRef.current.forEach((ticketId) => {
      // Check if backendStatus is no longer HELD for this seat
      const seat = seatData.find(t => t.ticketId === ticketId)
      const backendStatus = seat?.seatStatus || 'AVAILABLE'
      
      // Remove from releasedSeatsRef only when backendStatus is NOT HELD
      // This ensures we don't prematurely remove it before backend actually updates
      if (backendStatus !== 'HELD') {
        releasedSeatsRef.current.delete(ticketId)
        console.log('[Staff] Removed from releasedSeatsRef - backendStatus updated:', ticketId, backendStatus)
      }
    })
  }, [seatData])

  // Auto-sync selected seats to cart whenever selectedSeats changes
  useEffect(() => {
    if (!onSyncTicketsToCart || !selectedShowtimeId || !currentMovie || !currentShowtime) return

    // Build seat prices map
    const seatPrices: Record<string, number> = {}
    // Build seat types map
    const seatTypes: Record<string, string> = {}
    selectedSeats.forEach(seatId => {
      seatPrices[seatId] = getSeatPrice(seatId)
      seatTypes[seatId] = getSeatType(seatId)
    })

    // Build showtime info string
    const showtimeInfo = `${formatTime(currentShowtime.startTime)} - ${currentShowtime.roomName}`

    // Sync to cart with ticketIds
    onSyncTicketsToCart(
      selectedShowtimeId,
      currentMovie.name,
      showtimeInfo,
      selectedSeats,
      seatPrices,
      seatTypes,
      selectedTicketIds
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeats, selectedShowtimeId, currentMovie, currentShowtime, onSyncTicketsToCart, seatData, selectedTicketIds])

  const handleSeatSelect = (seatId: string, isOccupied: boolean, isHeld: boolean) => {
    console.log('[Staff handleSeatSelect] Called with:', { seatId, isOccupied, isHeld })
    const ticketId = getTicketId(seatId)
    if (!ticketId) {
      console.log('[Staff handleSeatSelect] No ticketId found for seat:', seatId)
      return
    }

    // If seat is already selected by current user, allow deselection
    const isSelectedByCurrentUser = selectedSeats.includes(seatId)
    console.log('[Staff handleSeatSelect] isSelectedByCurrentUser:', isSelectedByCurrentUser)
    
    if (isSelectedByCurrentUser) {
      // Always allow deselection if seat is selected by current user
      // Check directly if seat is held by someone else (not relying on isHeld parameter)
      const isHeldByOther = userId && seatsByUser 
        ? Array.from(seatsByUser.entries()).some(([otherUserId, seats]) => 
            otherUserId !== userId && seats.has(ticketId)
          )
        : false

      if (isHeldByOther) {
        // Cannot deselect seat held by someone else
        console.log('[Staff] Cannot deselect: seat is held by another user')
        return
      }

      // Check if seat is booked, in maintenance, or blocked - cannot deselect those
      const seatFromData = seatData.find(t => t.ticketId === ticketId)
      const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
      if (backendStatus === 'BOOKED' || backendStatus === 'UNAVAILABLE' || backendStatus === 'BLOCKED') {
        console.log('[Staff] Cannot deselect: seat is booked, unavailable, or blocked')
        return
      }

      const newSelectedSeats = selectedSeats.filter(id => id !== seatId)
      const newSelectedTicketIds = selectedTicketIds.filter(id => id !== ticketId)

      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)
      
      // Xóa khỏi sentSeatsRef khi user bỏ chọn
      sentSeatsRef.current.delete(ticketId)

      // Mark as released to ignore stale backendStatus HELD
      releasedSeatsRef.current.add(ticketId)
      
      // Deselect via WebSocket - this will release the hold on backend
      console.log('[Staff] Deselecting seat:', seatId, 'ticketId:', ticketId, 'isConnected:', isConnected)
      if (isConnected) {
        deselectSeats([ticketId])
      } else {
        console.warn('[Staff] WebSocket not connected, cannot deselect via WebSocket')
      }
      
      // Sync to cart automatically (will be handled in useEffect after state update)
      return
    }

    // For selecting new seats, check if occupied or held
    if (isOccupied || isHeld) return

    const seatType = getSeatType(seatId)

    const existingSeatTypes = [...new Set(selectedSeats.map(id => getSeatType(id)))]

    if (existingSeatTypes.length > 0 && !existingSeatTypes.includes(seatType)) {
      alert(`Bạn chỉ có thể chọn 1 loại ghế trong 1 lần đặt vé. Vui lòng bỏ chọn ghế ${existingSeatTypes[0] === 'vip' ? 'VIP' : 'thường'} trước khi chọn ghế ${seatType === 'vip' ? 'VIP' : 'thường'}.`)
      return
    }

    const seatsOfSameType = selectedSeats.filter(id => getSeatType(id) === seatType)

    if (seatsOfSameType.length >= 8) {
      alert(`Bạn chỉ có thể chọn tối đa 8 ghế ${seatType === 'vip' ? 'VIP' : 'thường'} cùng loại`)
      return
    }

    const newSelectedSeats = [...selectedSeats, seatId]
    const newSelectedTicketIds = [...selectedTicketIds, ticketId]

    setSelectedSeats(newSelectedSeats)
    setSelectedTicketIds(newSelectedTicketIds)
    
    // Remove from releasedSeatsRef if user selects it again (meaning it's no longer released)
    releasedSeatsRef.current.delete(ticketId)
    
    // Note: selectSeats will be called automatically by useEffect when selectedTicketIds changes
    // Don't call directly here to avoid duplicate calls
    
    // Sync to cart automatically (will be handled in useEffect after state update)
  }

  const getSeatType = (seatId: string) => {
    if (seatData.length === 0) return 'standard'

    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.seatType.toLowerCase() : 'standard'
  }

  const isSeatTypeLimitReached = (type: string) => {
    const seatsOfSameType = selectedSeats.filter(seatId => getSeatType(seatId) === type)
    return seatsOfSameType.length >= 8
  }

  const getSelectedSeatType = () => {
    if (selectedSeats.length === 0) return null
    return getSeatType(selectedSeats[0])
  }

  const isDifferentSeatType = (type: string) => {
    const selectedType = getSelectedSeatType()
    return selectedType !== null && selectedType !== type
  }

  const getSeatPrice = (seatId: string) => {
    if (seatData.length === 0) return 0

    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.ticketPrice : 0
  }

  const handleAddTickets = () => {
    if (currentMovie && currentShowtime && selectedSeats.length > 0) {
      // Calculate total price from selected seats
      const totalPrice = selectedSeats.reduce((sum, seatLabel) => {
        return sum + getSeatPrice(seatLabel)
      }, 0)

      onAddToCart({
        type: "ticket",
        name: currentMovie.name,
        price: totalPrice,
        quantity: selectedSeats.length,
        details: `${formatTime(currentShowtime.startTime)} - ${currentShowtime.roomName} - Ghế: ${selectedSeats.join(", ")}`,
      })
      setSelectedSeats([])
    }
  }

  // Format time to HH:mm
  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Generate seat layout from seatData (similar to seat-selection-page)
  const getSeatLayout = () => {
    if (seatData.length === 0) return []

    const layout: Record<number, { row: string; seats: Array<{ id: string; type: string; price: number; ticketId: number; status: string }> }> = {}

    seatData.forEach((ticket) => {
      const rowIndex = ticket.rowIdx
      const rowLabel = String.fromCharCode(65 + rowIndex)

      if (!layout[rowIndex]) {
        layout[rowIndex] = { row: rowLabel, seats: [] }
      }

      const seatNumber = ticket.columnInx + 1
      const seatId = `${rowLabel}${seatNumber}`
      const seatType = ticket.seatType.toLowerCase()
      const price = ticket.ticketPrice

      layout[rowIndex].seats.push({
        id: seatId,
        type: seatType,
        price,
        ticketId: ticket.ticketId,
        status: ticket.seatStatus
      })
    })

    return Object.values(layout)
      .map(row => ({
        ...row,
        seats: row.seats.sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)))
      }))
      .sort((a, b) => a.row.localeCompare(b.row))
  }

  return (
    <div className="space-y-6">

        <div className="flex items-center justify-between mb-6">
            {/* Nhóm 5 ngày */}
            <div className="flex items-center gap-2">
                {/* Nút qua lại */}
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={datePage === 0}
                    onClick={() => setDatePage(prev => Math.max(0, prev - 1))}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex gap-2">
                    {visibleDays.map((day, idx) => {
                        const isSelected = day.toDateString() === selectedDate.toDateString()
                        return (
                            <Button
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                variant={isSelected ? "default" : "outline"}
                                style={isSelected ? { backgroundColor: '#3BAEF0', borderColor: '#3BAEF0' } : {}}
                                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl w-20 h-16 transition-all ${
                                    isSelected
                                        ? "text-white shadow-lg scale-105"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-[#3BAEF0]"
                                }`}
                            >
                                <span className={`text-xs font-semibold ${isSelected ? "text-white" : ""}`}>{formatWeekday(day)}</span>
                                <span className={`text-lg font-bold leading-none ${isSelected ? "text-white" : ""}`}>{formatDay(day)}</span>
                                <span className={`text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}>{formatMonth(day)}</span>
                            </Button>
                        )
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={(datePage + 1) * daysPerPage >= allDays.length}
                    onClick={() => setDatePage(prev => prev + 1)}
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Ô ngày cụ thể bên phải */}
            <Button
                variant="outline"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border-muted-foreground/40"
            >
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {selectedDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })}
            </Button>
        </div>


        {/* Movie Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Chọn phim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMovies ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Đang tải danh sách phim...</p>
            </div>
          ) : apiMovies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có phim nào có suất chiếu hôm nay</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {apiMovies.map((movie) => (
              <div
                key={movie.id}
                className={`cursor-pointer rounded-lg border-2 transition-all ${
                    selectedMovieId === movie.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                    setSelectedMovieId(movie.id)
                    setSelectedShowtimeId(null)
                  setSelectedSeats([])
                }}
              >
                <div className="p-4">
                  <img
                      src={movie.posterUrl || "/placeholder.svg"}
                      alt={movie.name}
                    className="movie-poster w-full object-cover rounded-md mb-3"
                  />
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{movie.name}</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                        {movie.duration} phút
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {movie.ageRating}+
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Showtime Selection */}
      {selectedMovieId && currentMovie && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Chọn suất chiếu - {currentMovie.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingShowtimes ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Đang tải suất chiếu...</p>
              </div>
            ) : showtimes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có suất chiếu cho ngày hôm nay</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {showtimes.map((showtime) => (
                <div
                    key={showtime.showTimeId}
                  style={selectedShowtimeId === showtime.showTimeId ? { backgroundColor: '#3BAEF0', borderColor: '#3BAEF0' } : {}}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      selectedShowtimeId === showtime.showTimeId
                      ? "text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-[#3BAEF0]"
                  }`}
                  onClick={() => {
                      setSelectedShowtimeId(showtime.showTimeId)
                    setSelectedSeats([])
                  }}
                >
                  <div className="text-center">
                      <div className="text-lg font-bold">{formatTime(showtime.startTime)}</div>
                    <div className={`text-sm flex items-center justify-center gap-1 mt-1 ${
                      selectedShowtimeId === showtime.showTimeId ? "text-white" : "text-gray-600"
                    }`}>
                      <MapPin className="h-3 w-3" />
                        {showtime.roomName}
                    </div>
                      <div className={`text-xs mt-1 ${
                        selectedShowtimeId === showtime.showTimeId ? "text-white/90" : "text-gray-500"
                      }`}>
                        {showtime.totalSeatAvailable}/{showtime.totalSeat} ghế trống
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seat Selection */}
      {selectedShowtimeId && currentShowtime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Chọn ghế - {currentShowtime.roomName}
              </div>
              <div className="text-sm text-muted-foreground">Đã chọn: {selectedSeats.length} ghế</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSeats ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Đang tải sơ đồ ghế...</p>
              </div>
            ) : seatData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có thông tin ghế cho suất chiếu này</p>
              </div>
            ) : (
              <>
                {/* Screen */}
                <div className="text-center mb-8">
                  <div className="relative">
                    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-6 px-12 rounded-2xl mx-auto inline-block font-bold text-lg shadow-2xl border-4 border-primary/50 transform hover:scale-105 transition-all duration-300" style={{
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 30px rgba(59, 130, 246, 0.4)',
                      background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #334155 75%, #1e293b 100%)'
                    }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-cyan-500/40 rounded-2xl blur-sm animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-400/20 to-transparent rounded-2xl"></div>
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className="relative">
                          <Monitor className="h-7 w-7 text-blue-400 drop-shadow-lg animate-pulse" />
                          <div className="absolute inset-0 bg-blue-400/50 blur-lg animate-ping"></div>
                          <div className="absolute inset-0 bg-cyan-400/30 blur-md"></div>
                        </div>
                        <span className="text-white drop-shadow-lg tracking-wider font-extrabold text-xl">MÀN HÌNH</span>
                      </div>
                      <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>
                      <div className="absolute inset-0 border-2 border-slate-500/50 rounded-2xl"></div>
                      <div className="absolute inset-1 border border-slate-400/30 rounded-xl"></div>
                    </div>
                    <div className="relative mx-auto mt-3">
                      <div className="w-16 h-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg shadow-lg border border-slate-500/50"></div>
                      <div className="w-20 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-md shadow-md mx-auto -mt-1 border border-slate-600/50"></div>
                      <div className="w-24 h-1 bg-gradient-to-b from-slate-800 to-black rounded-full mx-auto -mt-1 shadow-lg"></div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black/30 rounded-full blur-lg"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-md"></div>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-blue-500/10 rounded-full blur-xl"></div>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-36 h-4 bg-cyan-500/5 rounded-full blur-lg"></div>
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="space-y-4 flex flex-col items-center">
                  {getSeatLayout().map((row) => (
                    <div key={row.row} className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-sm text-foreground bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg py-1">
                        {row.row}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {row.seats.map((seat) => {
                        const ticketId = seat.ticketId
                          const seatFromData = seatData.find(t => t.ticketId === ticketId)
                          const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
                          const isBooked = backendStatus === 'BOOKED'
                          const isMaintenance = backendStatus === 'UNAVAILABLE'
                          const isBlocked = backendStatus === 'BLOCKED'
                        const isSelected = selectedSeats.includes(seat.id)
                        
                        // Check if held by current user (can be deselected)
                        const currentUserSeats = userId ? seatsByUser?.get(userId) : null
                        const isHeldByCurrentUser = isSelected && currentUserSeats && currentUserSeats.has(ticketId)
                        
                        // Check if held by someone else (not current user)
                        const isHeldByOther = !isSelected && userId && seatsByUser 
                          ? Array.from(seatsByUser.entries()).some(([otherUserId, seats]) => 
                              otherUserId !== userId && seats.has(ticketId)
                            )
                          : false
                        
                        // WebSocket held - only if not selected by current user
                        const isHeldByWebSocket = !isSelected && heldSeats.has(ticketId)
                        
                          // Check if this seat was just released by current user
                          // If so, don't trust backendStatus HELD as it may not be updated yet
                          const isJustReleased = releasedSeatsRef.current.has(ticketId)
                          
                          // Backend status HELD - trust it if:
                          // 1. Seat is not selected by current user
                          // 2. AND it's not just released by current user (to avoid stale HELD status after release)
                          // This allows showing HELD status for seats held by others (even if WebSocket hasn't synced yet),
                          // but prevents showing HELD for seats that were just released by current user
                          const isHeldByBackend = !isSelected && backendStatus === 'HELD' && !isJustReleased
                        
                        // If seat is selected by current user, it's not considered "held" (can be deselected)
                          const isHeld = !isSelected && (isHeldByBackend || isHeldByOther || isHeldByWebSocket)
                          const isOccupied = isBooked || isMaintenance || isBlocked || isHeld
                          const seatType = getSeatType(seat.id)
                          const isLimitReached = !isOccupied && !isSelected && isSeatTypeLimitReached(seatType)
                          const isDifferentType = !isOccupied && !isSelected && isDifferentSeatType(seatType)

                          // Debug: check disabled state
                          const buttonDisabled = isSelected 
                            ? (isBooked || isMaintenance || isBlocked) // If selected, disable if booked/maintenance/blocked
                            : (isOccupied || isLimitReached || isDifferentType) // If not selected, normal checks

                        return (
                          <button
                            key={seat.id}
                              onClick={(e) => {
                                console.log('[Staff Button onClick] Seat clicked:', seat.id, 'isSelected:', isSelected, 'disabled:', buttonDisabled)
                                if (!buttonDisabled) {
                                  handleSeatSelect(seat.id, isBooked || isMaintenance || isBlocked, isHeld)
                                } else {
                                  console.log('[Staff Button onClick] Button is disabled, click ignored')
                                }
                              }}
                              disabled={buttonDisabled}
                            style={isBooked 
                              ? { backgroundColor: '#FD2802', borderColor: '#FD2802' }
                              : isMaintenance
                                ? { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' }
                                : isBlocked || isHeld
                                  ? { backgroundColor: '#3FB7F9', borderColor: '#3FB7F9' }
                                  : isSelected
                                    ? { backgroundColor: '#03599D', borderColor: '#03599D' }
                                    : { backgroundColor: '#BABBC3', borderColor: '#BABBC3' }
                            }
                            className={`
                                w-10 h-10 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center relative border-2
                              ${isBooked 
                                  ? 'text-white cursor-not-allowed shadow-xl' 
                                  : isMaintenance
                                    ? 'text-white cursor-not-allowed shadow-xl'
                                    : isBlocked || isHeld
                                      ? 'text-white cursor-not-allowed shadow-xl'
                                    : isLimitReached
                                      ? 'opacity-50 cursor-not-allowed'
                                      : isDifferentType
                                        ? 'opacity-30 cursor-not-allowed'
                                  : isSelected
                                        ? 'text-white scale-110 shadow-2xl ring-2 ring-[#03599D] ring-offset-1 font-extrabold'
                                    : 'text-white hover:opacity-90 shadow-lg hover:shadow-xl hover:scale-110'
                                }
                                active:scale-95
                              `}
                            >
                              <span className="text-sm font-bold">{seat.id.slice(1)}</span>
                          </button>
                        )
                      })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-8 bg-gray-50 rounded-xl p-4 border-2 border-gray-300">
                  <h4 className="font-semibold text-center mb-3 text-foreground text-base">Chú thích ghế</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mb-4 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-200">
                      <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#BABBC3' }}></div>
                      <span className="text-foreground font-medium">Ghế trống</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-200">
                      <div className="w-5 h-5 rounded shadow-md ring-1 ring-[#03599D]" style={{ backgroundColor: '#03599D' }}></div>
                      <span className="text-foreground font-medium">Đang chọn</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-200">
                      <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#FD2802' }}></div>
                      <span className="text-foreground font-medium">Đã bán</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-200">
                      <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#3FB7F9' }}></div>
                      <span className="text-foreground font-medium">Đang giữ</span>
                    </div>
                  </div>
                </div>

              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
