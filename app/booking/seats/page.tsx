"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Sofa, CreditCard, Calendar, Clock, MapPin, Star, Play, Monitor, Crown, Zap, Volume2, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Movie } from "@/type/movie"
import { apiClient } from "@/src/api/interceptor"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"
import { jwtDecode } from "jwt-decode"

// New types for the API response
type TicketResponse = {
  ticketId: number
  rowIdx: number
  columnInx: number
  seatType: string
  seatStatus: string
  ticketPrice: number
}

type ShowtimeSeatData = {
  showTimeId: number
  roomId: number
  ticketResponses: TicketResponse[]
}

type ShowtimeSeatResponse = {
  status: number
  message: string
  data: ShowtimeSeatData[]
}

type RoomInfo = {
  startTime: string
  endTime: string
  roomId: number
  roomName: string
  roomType: string
  totalSeat: number
  totalSeatAvailable: number
}

type RoomResponse = {
  status: number
  message: string
  data: RoomInfo[]
}

/**
 * Seat Selection Page - Countdown Timer System
 *
 * Timer is synced with timestamp for accuracy:
 * - Uses sessionStorage to persist start time across page reloads
 * - Calculates remaining time based on actual elapsed time
 * - Key format: booking_timer_{movieId}_{showtimeId}
 * - Duration: 15 minutes (900 seconds)
 * - Automatically redirects when time expires
 */
export default function SeatSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const dateParam = searchParams.get('date')
  const timeParam = searchParams.get('time')
  const hallParam = searchParams.get('hall')

  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([])
  const [countdown, setCountdown] = useState(900) // 15 minutes in seconds
  const [movie, setMovie] = useState<Movie | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [showtimeId, setShowtimeId] = useState<number | null>(null)
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  const [bookedSeats, setBookedSeats] = useState<Set<number>>(new Set())
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [hall, setHall] = useState<string>('')
  const [roomType, setRoomType] = useState<string>('')
  const [userId, setUserId] = useState<number | null>(null)

  // Get userId from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        console.log('[Seats Page] Decoded JWT:', decoded)
        const extractedUserId = decoded.userId
        setUserId(extractedUserId)
        console.log('[Seats Page] userId set to:', extractedUserId)
      }
    } catch (error) {
      console.error('[Seats Page] Error decoding token:', error)
    }
  }, [])

  // WebSocket integration
  const { isConnected, heldSeats, selectSeats, deselectSeats } = useSeatWebSocket(
    showtimeId,
    userId,
    !!showtimeId && !!userId
  )

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiClient.get(`/movies/${movieId}`)

        if (response.data?.status === 200 && response.data?.data) {
          setMovie(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching movie details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovieData()
  }, [movieId])

  // Fetch seat data from the new API
  useEffect(() => {
    const fetchSeatData = async () => {
      const showtimeIdParam = searchParams.get('showtimeId')

      console.log('=== SEAT PAGE DEBUG ===')
      console.log('showtimeIdParam:', showtimeIdParam)
      console.log('movieId:', movieId)
      console.log('All searchParams:', Object.fromEntries(searchParams.entries()))

      if (!showtimeIdParam) {
        console.error('❌ Missing showtimeId parameter!')
        return
      }

      try {
        setLoadingSeats(true)

        setDate(dateParam || '')
        setTime(timeParam || '')
        setHall(hallParam || '')

        const showtimeIdNum = parseInt(showtimeIdParam)
        console.log('Parsed showtimeId:', showtimeIdNum)
        setShowtimeId(showtimeIdNum)

        const response = await apiClient.get<ShowtimeSeatResponse>(
          `/bookings/show-times/${showtimeIdNum}/seats`
        )

        if (response.data?.status === 200 && response.data?.data?.length > 0) {
          const data = response.data.data[0]
          setRoomId(data.roomId)
          setShowtimeId(data.showTimeId)
          setSeatData(data.ticketResponses)

          // Extract booked and held seats from backend
          const booked = new Set<number>()
          data.ticketResponses.forEach(ticket => {
            // BOOKED: permanently booked, UNAVAILABLE: maintenance/blocked, HELD: temporarily held by other users
            if (ticket.seatStatus === 'BOOKED' || ticket.seatStatus === 'UNAVAILABLE' || ticket.seatStatus === 'HELD') {
              booked.add(ticket.ticketId)
            }
              })
              setBookedSeats(booked)
        }
      } catch (error) {
        console.error("Error fetching seat data:", error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeatData()
  }, [searchParams, dateParam, timeParam, hallParam, movieId])

  // Initialize start time from sessionStorage or create new one
  useEffect(() => {
    // Wait until showtimeId is loaded from URL params
    if (!showtimeId) {
      console.log('⏳ Timer: Waiting for showtimeId...')
      return
    }
    
    console.log('🕒 Timer: Initializing with showtimeId:', showtimeId)
    const storageKey = `booking_timer_${movieId}_${showtimeId}`

    // Try to get existing start time from sessionStorage
    const savedStartTime = sessionStorage.getItem(storageKey)

    if (savedStartTime) {
      const savedTime = parseInt(savedStartTime)
      const elapsed = Math.floor((Date.now() - savedTime) / 1000)
      const remaining = Math.max(0, 900 - elapsed) // 15 minutes = 900 seconds

      console.log('⏰ Timer: Found existing timer, remaining:', remaining, 'seconds')

      if (remaining > 0) {
        setStartTime(savedTime)
        setCountdown(remaining)
      } else {
        // Time expired, redirect
        console.log('⏰ Timer: Expired, redirecting to /home')
        sessionStorage.removeItem(storageKey)
        router.push('/home')
      }
    } else {
      // First time visiting this page, create new timer
      console.log('🆕 Timer: Creating new timer')
      const newStartTime = Date.now()
      setStartTime(newStartTime)
      sessionStorage.setItem(storageKey, newStartTime.toString())
    }
  }, [movieId, showtimeId, router])

  // Countdown timer effect - synced with timestamp
  useEffect(() => {
    if (!startTime) return

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, 900 - elapsed)

      setCountdown(remaining)

      if (remaining <= 0) {
          // Time's up - redirect back to booking page
        const storageKey = `booking_timer_${movieId}_${showtimeId}`
        sessionStorage.removeItem(storageKey)
          router.push('/home')
        }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, movieId, showtimeId, router])

  // Format countdown time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTicketId = (seatId: string): number | null => {
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })
    return seat?.ticketId || null
  }

  const handleSeatClick = (seatId: string, isOccupied: boolean, isHeld: boolean) => {
    if (isOccupied || isHeld) return

    const ticketId = getTicketId(seatId)
    if (!ticketId) return

    if (selectedSeats.includes(seatId)) {
      // DESELECT: Remove seat
      const newSelectedSeats = selectedSeats.filter(id => id !== seatId)
      const newSelectedTicketIds = selectedTicketIds.filter(id => id !== ticketId)

      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)

      // Send deselect via WebSocket with only this ticket
      deselectSeats([ticketId])
    } else {
      // SELECT: Add seat
      const seatType = getSeatType(seatId)

      // Check if there are already seats of different type selected
      const existingSeatTypes = [...new Set(selectedSeats.map(id => getSeatType(id)))]

      if (existingSeatTypes.length > 0 && !existingSeatTypes.includes(seatType)) {
        alert(`Bạn chỉ có thể chọn 1 loại ghế trong 1 lần đặt vé. Vui lòng bỏ chọn ghế ${existingSeatTypes[0] === 'vip' ? 'VIP' : 'thường'} trước khi chọn ghế ${seatType === 'vip' ? 'VIP' : 'thường'}.`)
        return
      }

      // Check if adding this seat would exceed the limit
      const seatsOfSameType = selectedSeats.filter(id => getSeatType(id) === seatType)

      if (seatsOfSameType.length >= 8) {
        alert(`Bạn chỉ có thể chọn tối đa 8 ghế ${seatType === 'vip' ? 'VIP' : 'thường'} cùng loại`)
        return
      }

      const newSelectedSeats = [...selectedSeats, seatId]
      const newSelectedTicketIds = [...selectedTicketIds, ticketId]

      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)

      // Send select with only the NEW ticket
      selectSeats([ticketId])
    }
  }

  // Helper functions to process seat data
  const getSeatLayout = () => {
    if (seatData.length === 0) return []

    const layout: Record<number, { row: string; seats: Array<{ id: string; type: string; price: number; ticketId: number }> }> = {}

    seatData.forEach((ticket) => {
      const rowIndex = ticket.rowIdx
      const rowLabel = String.fromCharCode(65 + rowIndex) // 0 -> A, 1 -> B, etc.

      if (!layout[rowIndex]) {
        layout[rowIndex] = { row: rowLabel, seats: [] }
      }

      const seatNumber = ticket.columnInx + 1 // columnInx is 0-based, seat number is 1-based
      const seatId = `${rowLabel}${seatNumber}`
      const seatType = ticket.seatType.toLowerCase()
      const price = ticket.ticketPrice

      layout[rowIndex].seats.push({
        id: seatId,
        type: seatType,
        price,
        ticketId: ticket.ticketId
      })
    })

    // Convert to array and sort by row and seat number
    return Object.values(layout)
      .map(row => ({
        ...row,
        seats: row.seats.sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)))
      }))
      .sort((a, b) => a.row.localeCompare(b.row))
  }

  const getSeatType = (seatId: string) => {
    if (seatData.length === 0) return 'standard'

    // Find the seat in the data
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.seatType.toLowerCase() : 'standard'
  }

  const getSeatPrice = (seatId: string) => {
    if (seatData.length === 0) return 100000

    // Find the seat in the data
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.ticketPrice : 100000
  }

  const isSeatBlocked = (seatId: string) => {
    if (seatData.length === 0) return false

    // Find the seat in the data
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.seatStatus === 'UNAVAILABLE' : false
  }

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seatId) => total + getSeatPrice(seatId), 0)
  }

  const getSeatTypeCount = (type: string) => {
    return selectedSeats.filter(seatId => getSeatType(seatId) === type).length
  }

  const isSeatTypeLimitReached = (type: string) => {
    return getSeatTypeCount(type) >= 8
  }

  const getSelectedSeatType = () => {
    if (selectedSeats.length === 0) return null
    return getSeatType(selectedSeats[0])
  }

  const isDifferentSeatType = (type: string) => {
    const selectedType = getSelectedSeatType()
    return selectedType !== null && selectedType !== type
  }

  const handleContinue = () => {
    if (selectedSeats.length > 0) {
      const seatIds = selectedSeats.join(',')
      const q = new URLSearchParams({
        movieId: movieId ?? '',
        showtimeId: showtimeId?.toString() ?? '',
        date,
        time,
        hall,
        seats: seatIds
      })
      router.push(`/booking/combo?${q.toString()}`)
    }
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Movie Info - Fixed Left Sidebar */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-background to-gray-50/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Play className="h-4 w-4" />
                    <span>Thông tin suất chiếu</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {loading || !movie ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <img
                        src={movie?.posterUrl || "/generic-superhero-team-poster.png"}
                        alt={movie?.name || "Movie"}
                        className="w-full max-w-48 mx-auto rounded-lg shadow-lg mb-3"
                        onError={(e) => {
                          e.currentTarget.src = "/generic-superhero-team-poster.png"
                        }}
                      />
                      <h2 className="text-lg font-bold mb-2 text-foreground">{movie?.name || "Phim"}</h2>
                      <div className="space-y-2 text-sm">
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">Ngày chiếu</span>
                          </div>
                          <span className="font-semibold text-foreground text-sm">{date || '...'}</span>
                        </div>
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Giờ chiếu</span>
                          </div>
                          <span className="font-semibold text-foreground text-sm">{time || '...'}</span>
                        </div>
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">Phòng chiếu</span>
                          </div>
                          <span className="font-semibold text-foreground text-sm">{hall || '...'}</span>
                        </div>
                        {roomType && (
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-2">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                              <Monitor className="h-3 w-3" />
                              <span className="text-xs">Loại phòng</span>
                            </div>
                            <span className="font-semibold text-foreground text-sm">{roomType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
            </Card>
            </div>

            {/* Seat Selection - Main Content */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-2 text-primary">
                  <Sofa className="h-5 w-5" />
                    <span className="text-lg">Sơ đồ ghế</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="p-6">
                  {/* Screen - Enhanced 3D Design */}
                <div className="text-center mb-8">
                    <div className="relative">
                      {/* Main Screen */}
                      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-6 px-12 rounded-2xl mx-auto inline-block font-bold text-lg shadow-2xl border-4 border-slate-600 transform hover:scale-105 transition-all duration-300" style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #334155 75%, #1e293b 100%)'
                      }}>
                        {/* Screen glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-cyan-500/30 rounded-2xl blur-sm animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-400/10 to-transparent rounded-2xl"></div>

                        {/* Screen content */}
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <div className="relative">
                            <Monitor className="h-6 w-6 text-blue-400 drop-shadow-lg animate-pulse" />
                            <div className="absolute inset-0 bg-blue-400/40 blur-lg animate-ping"></div>
                            <div className="absolute inset-0 bg-cyan-400/20 blur-md"></div>
                          </div>
                          <span className="text-white drop-shadow-lg tracking-wider font-extrabold">MÀN HÌNH</span>
                        </div>

                        {/* Screen reflection */}
                        <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>

                        {/* Screen frame */}
                        <div className="absolute inset-0 border-2 border-slate-500/50 rounded-2xl"></div>
                        <div className="absolute inset-1 border border-slate-400/30 rounded-xl"></div>
                      </div>

                      {/* Screen stand */}
                      <div className="relative mx-auto mt-3">
                        <div className="w-16 h-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg shadow-lg border border-slate-500/50"></div>
                        <div className="w-20 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-md shadow-md mx-auto -mt-1 border border-slate-600/50"></div>
                        <div className="w-24 h-1 bg-gradient-to-b from-slate-800 to-black rounded-full mx-auto -mt-1 shadow-lg"></div>
                      </div>

                      {/* Screen shadow */}
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black/30 rounded-full blur-lg"></div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-md"></div>

                      {/* Ambient lighting */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-blue-500/10 rounded-full blur-xl"></div>
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-36 h-4 bg-cyan-500/5 rounded-full blur-lg"></div>
                  </div>
                </div>

                  {/* Seat Layout - Enhanced */}
                {loadingSeats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" />
                    <span className="text-lg text-muted-foreground">Đang tải sơ đồ ghế...</span>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center">
                    {getSeatLayout().map((row) => (
                      <div key={row.row} className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-sm text-foreground bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg py-1">
                          {row.row}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {row.seats.map((seat) => {
                            const ticketId = seat.ticketId
                            
                            // Get seat status from backend
                            const seatFromData = seatData.find(t => t.ticketId === ticketId)
                            const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
                            
                            // Determine seat state
                            const isBooked = backendStatus === 'BOOKED'
                            const isMaintenance = backendStatus === 'UNAVAILABLE'
                            const isHeldByBackend = backendStatus === 'HELD'
                            const isHeldByWebSocket = heldSeats.has(ticketId) && !selectedSeats.includes(seat.id)
                            const isHeld = isHeldByBackend || isHeldByWebSocket
                            const isOccupied = isBooked || isMaintenance || isHeld
                            const isSelected = selectedSeats.includes(seat.id)
                            const seatType = getSeatType(seat.id)

                            const isLimitReached = !isOccupied && !isSelected && isSeatTypeLimitReached(seatType)
                            const isDifferentType = !isOccupied && !isSelected && isDifferentSeatType(seatType)

                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat.id, isBooked || isMaintenance, isHeld)}
                                disabled={isOccupied || isLimitReached || isDifferentType}
                              className={`
                                  w-10 h-10 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center relative
                                ${isBooked 
                                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white cursor-not-allowed shadow-inner' 
                                    : isMaintenance
                                      ? 'bg-gradient-to-br from-gray-500 to-gray-700 text-white cursor-not-allowed shadow-inner'
                                      : isHeld
                                        ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 cursor-not-allowed shadow-inner animate-pulse'
                                      : isLimitReached
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                        : isDifferentType
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-30'
                                  : isSelected
                                          ? 'bg-gradient-to-br from-green-200 to-green-400 text-green-800 scale-110 shadow-xl ring-4 ring-green-300/30'
                                      : seatType === 'vip'
                                            ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-purple-900 hover:from-purple-300 hover:to-purple-500 shadow-lg hover:shadow-purple-400/50'
                                            : 'bg-gradient-to-br from-blue-400 to-blue-600 text-blue-900 hover:from-blue-300 hover:to-blue-500 shadow-lg hover:shadow-blue-400/50'
                                  }
                                  hover:scale-110 active:scale-95
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
                )}

                  {/* Enhanced Legend */}
                  <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <h4 className="font-semibold text-center mb-3 text-foreground text-sm">Chú thích ghế</h4>

                    {/* WebSocket Status */}
                    <div className="mb-3 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                        isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        {isConnected ? 'Đang kết nối real-time' : 'Đang kết nối...'}
                      </div>
                    </div>

                    {/* Seat Status Legend */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4 max-w-sm mx-auto">
                      <div className="flex items-center gap-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded"></div>
                        <span className="text-muted-foreground">Có thể chọn</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded"></div>
                        <span className="text-muted-foreground">Đã chọn</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded"></div>
                        <span className="text-muted-foreground">Đã đặt</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded animate-pulse"></div>
                        <span className="text-muted-foreground">Đang giữ</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-700 rounded"></div>
                        <span className="text-muted-foreground">Bảo trì</span>
                      </div>
                    </div>

                    <h5 className="font-semibold text-center mb-3 text-foreground text-sm">Loại ghế</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm max-w-sm mx-auto">
                      <div className={`flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm border-2 ${
                        isSeatTypeLimitReached('standard') ? 'border-red-300 bg-red-50' : 'border-transparent'
                      }`}>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                          <Sofa className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">Ghế thường</div>
                          <div className="text-muted-foreground text-xs">100,000đ</div>
                          <div className={`text-xs font-medium ${
                            isSeatTypeLimitReached('standard') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {getSeatTypeCount('standard')}/8 ghế
                          </div>
                        </div>
                        {isSeatTypeLimitReached('standard') && (
                          <div className="text-red-500 text-xs">⚠️</div>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm border-2 ${
                        isSeatTypeLimitReached('vip') ? 'border-red-300 bg-red-50' : 'border-transparent'
                      }`}>
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">Ghế VIP</div>
                          <div className="text-muted-foreground text-xs">150,000đ</div>
                          <div className={`text-xs font-medium ${
                            isSeatTypeLimitReached('vip') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {getSeatTypeCount('vip')}/8 ghế
                          </div>
                        </div>
                        {isSeatTypeLimitReached('vip') && (
                          <div className="text-red-500 text-xs">⚠️</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-xs text-muted-foreground">
                        Chỉ được chọn 1 loại ghế trong 1 lần đặt vé
                  </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tối đa 8 ghế mỗi loại
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Booking Summary - Enhanced */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-background to-gray-50/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CreditCard className="h-6 w-6" />
                    <span className="text-xl">Tóm tắt đặt vé</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Selected Seats */}
                <div>
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Ghế đã chọn ({selectedSeats.length})
                    </h4>

                    {/* Seat type summary */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Ghế thường:</span>
                        <span className={`font-medium ${
                          isSeatTypeLimitReached('standard') ? 'text-red-600' : 
                          getSeatTypeCount('standard') > 0 ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {getSeatTypeCount('standard')}/8
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Ghế VIP:</span>
                        <span className={`font-medium ${
                          isSeatTypeLimitReached('vip') ? 'text-red-600' : 
                          getSeatTypeCount('vip') > 0 ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {getSeatTypeCount('vip')}/8
                        </span>
                      </div>
                      {getSelectedSeatType() && (
                        <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                          <div className="text-xs text-primary font-medium text-center">
                            Đang chọn: {getSelectedSeatType() === 'vip' ? 'Ghế VIP' : 'Ghế thường'}
                          </div>
                        </div>
                      )}
                    </div>
                  {selectedSeats.length > 0 ? (
                      <div className="space-y-3">
                        {selectedSeats.map(seatId => {
                          const seatType = getSeatType(seatId)
                          const getSeatIcon = (type: string) => {
                            switch (type) {
                              case 'vip': return <Crown className="h-4 w-4 text-purple-600" />
                              default: return <Sofa className="h-4 w-4 text-blue-600" />
                            }
                          }

                          return (
                            <div key={seatId} className="flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                {getSeatIcon(seatType)}
                                <span className="font-medium">Ghế {seatId}</span>
                                <Badge variant="outline" className="text-xs">
                                  {seatType === 'vip' ? 'VIP' : 'Thường'}
                                </Badge>
                              </div>
                              <span className="font-bold text-primary">{getSeatPrice(seatId).toLocaleString()}đ</span>
                        </div>
                          )
                        })}
                    </div>
                  ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sofa className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Chưa chọn ghế nào</p>
                        <p className="text-sm">Hãy chọn ghế từ sơ đồ bên trái</p>
                      </div>
                  )}
                </div>

                  {/* Countdown Timer in Summary */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-muted-foreground">Thời gian còn lại:</span>
                      </div>
                      <span className={`font-bold text-lg ${
                        countdown <= 300 ? 'text-red-600 animate-pulse' : 
                        countdown <= 600 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatTime(countdown)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {countdown <= 300 ? 'Hãy hoàn tất đặt vé sớm!' :
                       countdown <= 600 ? 'Thời gian sắp hết!' : 'Bạn có đủ thời gian để chọn ghế'}
                    </div>
                  </div>

                  {/* Total */}
                  {selectedSeats.length > 0 && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg text-foreground">Tổng cộng:</span>
                        <span className="font-bold text-2xl text-primary">{calculateTotal().toLocaleString()}đ</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedSeats.length} ghế × giá trung bình {Math.round(calculateTotal() / selectedSeats.length).toLocaleString()}đ
                  </div>
                </div>
                  )}

                  {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-4 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary/30 rounded-xl text-lg"
                >
                    {selectedSeats.length > 0 ? 'Tiếp tục chọn combo' : 'Vui lòng chọn ghế'}
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
