"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, MapPin, Loader2 } from "lucide-react"
import { getMoviesWithShowtimesToday } from "@/src/api/movies"
import type { StaffMovie } from "@/src/api/movies"
import { apiClient } from "@/src/api/interceptor"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"
import { jwtDecode } from "jwt-decode"

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
}

export function TicketSelection({ onAddToCart }: TicketSelectionProps) {
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

  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  
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
  const { isConnected, heldSeats, seatsByUser, selectSeats, deselectSeats } = useSeatWebSocket(
    selectedShowtimeId,
    userId,
    !!selectedShowtimeId && !!userId,
    useCallback(() => {}, []) // No expiration handler for staff
  )
  
  // Track sent seats to avoid duplicate WebSocket calls
  const sentSeatsRef = useRef<Set<number>>(new Set())

  // Load movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true)
      try {
        const moviesData = await getMoviesWithShowtimesToday(today)
        setApiMovies(moviesData)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setLoadingMovies(false)
      }
    }
    fetchMovies()
  }, [today])

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
          `/bookings/movies/${selectedMovieId}/show-times/${today}`
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
  }, [selectedMovieId, today])

  // Fetch seats when showtime is selected
  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeatData([])
      setSelectedSeats([])
      setSelectedTicketIds([])
      hasRestoredRef.current = false // Reset restore flag
      return
    }

    const fetchSeats = async () => {
      setLoadingSeats(true)
      setSeatData([])
      hasRestoredRef.current = false // Reset restore flag when fetching new seats
      // Don't clear selected seats here - let WebSocket restore them
      try {
        const response = await apiClient.get<SeatResponse>(
          `/bookings/show-times/${selectedShowtimeId}/seats`
        )
        if (response.data?.status === 200 && response.data?.data && response.data.data.length > 0) {
          // API returns array of BookingSeatsData, extract ticketResponses
          setSeatData(response.data.data[0].ticketResponses)
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

  // Cleanup deselected seats from WebSocket
  useEffect(() => {
    if (!isConnected || !selectedShowtimeId || !userId) return
    
    const currentSelectedSet = new Set(selectedTicketIds)
    const toRemove: number[] = []
    
    sentSeatsRef.current.forEach((ticketId: number) => {
      if (!currentSelectedSet.has(ticketId)) {
        toRemove.push(ticketId)
      }
    })
    
    // Deselect removed seats via WebSocket
    if (toRemove.length > 0 && isConnected) {
      console.log('[Staff] Auto-deselecting via useEffect:', toRemove)
      deselectSeats(toRemove)
    }
    
    toRemove.forEach(ticketId => sentSeatsRef.current.delete(ticketId))
  }, [selectedTicketIds, isConnected, selectedShowtimeId, userId, deselectSeats])

  const handleSeatSelect = (seatId: string) => {
    const ticketId = getTicketId(seatId)
    if (!ticketId) return
    
    const isSelected = selectedSeats.includes(seatId)
    
    if (isSelected) {
      // Deselect
      const newSelectedSeats = selectedSeats.filter(id => id !== seatId)
      const newSelectedTicketIds = selectedTicketIds.filter(id => id !== ticketId)
      console.log('[Staff] Deselecting seat:', seatId, 'ticketId:', ticketId)
      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)
      } else {
      // Select
      console.log('[Staff] Selecting seat:', seatId, 'ticketId:', ticketId)
      setSelectedSeats(prev => [...prev, seatId])
      setSelectedTicketIds(prev => [...prev, ticketId])
    }
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
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      selectedShowtimeId === showtime.showTimeId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                      setSelectedShowtimeId(showtime.showTimeId)
                    setSelectedSeats([])
                  }}
                >
                  <div className="text-center">
                      <div className="text-lg font-bold">{formatTime(showtime.startTime)}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                        {showtime.roomName}
                    </div>
                      <div className="text-xs text-muted-foreground mt-1">
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
                  <div className="inline-block bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 px-12 py-2 rounded-t-full">
                    <span className="text-sm font-medium">MÀN HÌNH</span>
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="space-y-2 max-w-4xl mx-auto">
                  {getSeatLayout().map((row) => (
                    <div key={row.row} className="flex items-center justify-center gap-1">
                      <div className="w-8 text-center font-bold text-sm text-foreground bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg py-1 mr-4">
                        {row.row}
                      </div>

                      {/* First 3 seats */}
                      {row.seats.slice(0, 3).map((seat) => {
                        const ticketId = seat.ticketId
                        const isBooked = seat.status === 'BOOKED'
                        const isSelected = selectedSeats.includes(seat.id)
                        const isVip = seat.type === 'vip'
                        
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
                        
                        // If seat is selected by current user, it's not considered "held" (can be deselected)
                        const isHeld = !isSelected && (isHeldByOther || isHeldByWebSocket)

                        return (
                          <button
                            key={seat.id}
                            onClick={() => !isBooked && !isHeld && handleSeatSelect(seat.id)}
                            disabled={isBooked || isHeld}
                            className={`
                              w-8 h-8 rounded text-xs font-bold transition-all duration-300 flex items-center justify-center
                              ${isBooked 
                                ? 'bg-orange-500 text-white cursor-not-allowed' 
                                : isHeld
                                  ? 'bg-yellow-500 text-white cursor-not-allowed animate-pulse'
                                  : isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : isVip
                                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                                      : 'bg-blue-600 text-white hover:bg-blue-500'
                              }
                            `}
                          >
                            {seat.id.slice(1)}
                          </button>
                        )
                      })}

                      <div className="w-4"></div>

                      {/* Middle seats (4-9) */}
                      {row.seats.slice(3, 9).map((seat) => {
                        const ticketId = seat.ticketId
                        const isBooked = seat.status === 'BOOKED'
                        const isSelected = selectedSeats.includes(seat.id)
                        const isVip = seat.type === 'vip'
                        
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
                        
                        // If seat is selected by current user, it's not considered "held" (can be deselected)
                        const isHeld = !isSelected && (isHeldByOther || isHeldByWebSocket)

                        return (
                          <button
                            key={seat.id}
                            onClick={() => !isBooked && !isHeld && handleSeatSelect(seat.id)}
                            disabled={isBooked || isHeld}
                            className={`
                              w-8 h-8 rounded text-xs font-bold transition-all duration-300 flex items-center justify-center
                              ${isBooked 
                                ? 'bg-orange-500 text-white cursor-not-allowed' 
                                : isHeld
                                  ? 'bg-yellow-500 text-white cursor-not-allowed animate-pulse'
                                  : isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : isVip
                                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                                      : 'bg-blue-600 text-white hover:bg-blue-500'
                              }
                            `}
                          >
                            {seat.id.slice(1)}
                          </button>
                        )
                      })}

                      <div className="w-4"></div>

                      {/* Last seats (10+) */}
                      {row.seats.slice(9).map((seat) => {
                        const ticketId = seat.ticketId
                        const isBooked = seat.status === 'BOOKED'
                        const isSelected = selectedSeats.includes(seat.id)
                        const isVip = seat.type === 'vip'
                        
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
                        
                        // If seat is selected by current user, it's not considered "held" (can be deselected)
                        const isHeld = !isSelected && (isHeldByOther || isHeldByWebSocket)

                        return (
                          <button
                            key={seat.id}
                            onClick={() => !isBooked && !isHeld && handleSeatSelect(seat.id)}
                            disabled={isBooked || isHeld}
                            className={`
                              w-8 h-8 rounded text-xs font-bold transition-all duration-300 flex items-center justify-center
                              ${isBooked 
                                ? 'bg-orange-500 text-white cursor-not-allowed' 
                                : isHeld
                                  ? 'bg-yellow-500 text-white cursor-not-allowed animate-pulse'
                                  : isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : isVip
                                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                                      : 'bg-blue-600 text-white hover:bg-blue-500'
                              }
                            `}
                          >
                            {seat.id.slice(1)}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-8 bg-muted rounded-lg p-4 border-2 border-border">
                  <h4 className="font-semibold text-center mb-3 text-foreground text-base">Chú thích ghế</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 bg-background rounded-lg p-2 shadow-md border border-blue-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded"></div>
                      <span className="text-foreground font-medium">Có thể chọn</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg p-2 shadow-md border border-emerald-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded"></div>
                      <span className="text-foreground font-medium">Đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg p-2 shadow-md border border-orange-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-700 rounded"></div>
                      <span className="text-foreground font-medium">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg p-2 shadow-md border border-yellow-200">
                      <div className="w-5 h-5 bg-yellow-500 rounded animate-pulse"></div>
                      <span className="text-foreground font-medium">Đang giữ</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg p-2 shadow-md border border-violet-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-violet-500 to-violet-700 rounded"></div>
                      <span className="text-foreground font-medium">VIP</span>
                    </div>
                  </div>
                </div>

            {selectedSeats.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                          {selectedSeats.length} vé × {formatTime(currentShowtime.startTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">Ghế: {selectedSeats.join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                          {selectedSeats
                            .reduce((sum, seatLabel) => {
                              return sum + getSeatPrice(seatLabel)
                            }, 0)
                            .toLocaleString("vi-VN")}
                          đ
                    </p>
                    <Button onClick={handleAddTickets} className="mt-2">
                      Thêm vào giỏ
                    </Button>
                  </div>
                </div>
              </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
