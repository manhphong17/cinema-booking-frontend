"use client"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Clock, Crown, Loader2, Monitor, Sofa} from "lucide-react"
import {useRouter, useSearchParams} from "next/navigation"
import {useEffect, useState, useMemo, useCallback} from "react"
import {Movie} from "@/type/movie"
import {apiClient} from "@/src/api/interceptor"
import {useSeatWebSocket} from "@/hooks/use-seat-websocket"
import {jwtDecode} from "jwt-decode"
import BookingOrderSummary, {SeatInfo, MovieInfo} from "./booking-order-summary"

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

/**
 * Seat Selection Page Component
 */
export default function SeatSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const dateParam = searchParams.get('date')
  const timeParam = searchParams.get('time')
  const hallParam = searchParams.get('hall')

  const seatsParam = searchParams.get('seats')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [showtimeId, setShowtimeId] = useState<number | null>(null)
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [hall, setHall] = useState<string>('')
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error('[Seats Page] Error decoding token:', error)
    }
  }, [])

  const { isConnected, heldSeats, seatsByUser, selectSeats, deselectSeats } = useSeatWebSocket(
    showtimeId,
    userId,
    !!showtimeId && !!userId
  )

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

  useEffect(() => {
    const fetchSeatData = async () => {
      const showtimeIdParam = searchParams.get('showtimeId')

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
        setShowtimeId(showtimeIdNum)

        const response = await apiClient.get<ShowtimeSeatResponse>(
          `/bookings/show-times/${showtimeIdNum}/seats`
        )

        if (response.data?.status === 200 && response.data?.data?.length > 0) {
          const data = response.data.data[0]
          setShowtimeId(data.showTimeId)
          setSeatData(data.ticketResponses)
        }
      } catch (error) {
        console.error("Error fetching seat data:", error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeatData()
  }, [searchParams, dateParam, timeParam, hallParam, movieId])

  // Restore selected seats from URL params when returning from combo page
  useEffect(() => {
    if (!seatData.length) return

    // If no seats param, clear selections (coming from booking page)
    if (!seatsParam) {
      if (selectedSeats.length > 0) {
        setSelectedSeats([])
        setSelectedTicketIds([])
      }
      return
    }

    const seatsFromUrl = seatsParam.split(',').filter(seat => seat.trim())
    
    if (seatsFromUrl.length === 0) {
      // Clear selections if seats param is empty
      if (selectedSeats.length > 0) {
        setSelectedSeats([])
        setSelectedTicketIds([])
      }
      return
    }

    // Check if seats match current selection
    const seatsMatch = seatsFromUrl.length === selectedSeats.length && 
        seatsFromUrl.every(seat => selectedSeats.includes(seat))
    
    if (seatsMatch) return // Already restored, no need to update

    // Restore selected seats and ticket IDs
    const restoredSeats: string[] = []
    const restoredTicketIds: number[] = []

    seatsFromUrl.forEach(seatId => {
      // Find ticket ID from seatData
      const seat = seatData.find(ticket => {
        const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
        const seatNumber = ticket.columnInx + 1
        const expectedSeatId = `${rowLabel}${seatNumber}`
        return expectedSeatId === seatId
      })
      if (seat) {
        restoredSeats.push(seatId)
        restoredTicketIds.push(seat.ticketId)
      }
    })
    
    console.log('[Restore Seats] Restoring:', { restoredSeats, restoredTicketIds, seatsFromUrl })
    setSelectedSeats(restoredSeats)
    setSelectedTicketIds(restoredTicketIds)
  }, [seatData, seatsParam]) // Only depend on seatData and seatsParam

  // Sync selected seats with WebSocket after restoring from URL
  useEffect(() => {
    if (!isConnected || !showtimeId || !userId || selectedTicketIds.length === 0) return

    // Only select seats that aren't already held by someone else
    const ticketsToSelect = selectedTicketIds.filter(ticketId => {
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

    if (ticketsToSelect.length > 0) {
      selectSeats(ticketsToSelect)
    }
  }, [isConnected, showtimeId, userId, selectedTicketIds, selectSeats, heldSeats, seatsByUser])

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
    console.log('[handleSeatClick] Called with:', { seatId, isOccupied, isHeld })
    const ticketId = getTicketId(seatId)
    if (!ticketId) {
      console.log('[handleSeatClick] No ticketId found for seat:', seatId)
      return
    }

    // If seat is already selected by current user, allow deselection
    const isSelectedByCurrentUser = selectedSeats.includes(seatId)
    console.log('[handleSeatClick] isSelectedByCurrentUser:', isSelectedByCurrentUser)
    
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
        console.log('Cannot deselect: seat is held by another user')
        return
      }

      // Check if seat is booked or in maintenance - cannot deselect those
      const seatFromData = seatData.find(t => t.ticketId === ticketId)
      const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
      if (backendStatus === 'BOOKED' || backendStatus === 'UNAVAILABLE') {
        console.log('Cannot deselect: seat is booked or unavailable')
        return
      }

      const newSelectedSeats = selectedSeats.filter(id => id !== seatId)
      const newSelectedTicketIds = selectedTicketIds.filter(id => id !== ticketId)

      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)

      // Deselect via WebSocket - this will release the hold on backend
      console.log('[SeatSelection] Deselecting seat:', seatId, 'ticketId:', ticketId, 'isConnected:', isConnected)
      if (isConnected) {
        deselectSeats([ticketId])
      } else {
        console.warn('[SeatSelection] WebSocket not connected, cannot deselect via WebSocket')
      }
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

    selectSeats([ticketId])
  }

  const getSeatLayout = () => {
    if (seatData.length === 0) return []

    const layout: Record<number, { row: string; seats: Array<{ id: string; type: string; price: number; ticketId: number }> }> = {}

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
        ticketId: ticket.ticketId
      })
    })

    return Object.values(layout)
      .map(row => ({
        ...row,
        seats: row.seats.sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)))
      }))
      .sort((a, b) => a.row.localeCompare(b.row))
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

  const getSeatPrice = (seatId: string) => {
    if (seatData.length === 0) return 100000

    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.ticketPrice : 100000
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

  /**
   * Get information about all selected seats
   * Returns array of SeatInfo with id, type, and price
   */
  const getSelectedSeatsInfo = useCallback((): SeatInfo[] => {
    if (!selectedSeats.length || !seatData.length) return []
    
    return selectedSeats.map(seatId => ({
      id: seatId,
      type: getSeatType(seatId),
      price: getSeatPrice(seatId)
    }))
  }, [selectedSeats, seatData])

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

  // Prepare data for BookingOrderSummary component
  // Use useMemo directly with selectedSeats and seatData as dependencies
  const seatsInfo: SeatInfo[] = useMemo(() => {
    if (!selectedSeats.length || !seatData.length) {
      console.log('[seatsInfo] Empty:', { selectedSeatsLength: selectedSeats.length, seatDataLength: seatData.length })
      return []
    }
    
    const info = selectedSeats.map(seatId => ({
      id: seatId,
      type: getSeatType(seatId),
      price: getSeatPrice(seatId)
    }))
    console.log('[seatsInfo] Calculated:', info)
    return info
  }, [selectedSeats, seatData])

  const movieInfo: MovieInfo | undefined = useMemo(() => {
    if (!movie) return undefined
    return {
      title: movie.name,
      poster: movie.posterUrl,
      date,
      time,
      hall
    }
  }, [movie, date, time, hall])

  const seatsTotal = useMemo(() => {
    const total = calculateTotal()
    console.log('[seatsTotal] Calculated:', total, 'selectedSeats:', selectedSeats)
    return total
  }, [selectedSeats, seatData])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Seat Selection */}
          <div className="lg:col-span-3">
            <Card className="shadow-2xl border-2 border-primary/30 bg-white hover:shadow-primary/20 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sofa className="h-5 w-5" />
                  <span className="text-lg font-semibold">Sơ đồ ghế</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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

                {/* Seat Layout */}
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
                            const seatFromData = seatData.find(t => t.ticketId === ticketId)
                            const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
                            const isBooked = backendStatus === 'BOOKED'
                            const isMaintenance = backendStatus === 'UNAVAILABLE'
                            const isSelected = selectedSeats.includes(seat.id)
                            // If seat is selected by current user, check if it's held by current user (can be deselected)
                            // Otherwise, check if it's held by someone else
                            const currentUserSeats = userId ? seatsByUser?.get(userId) : null
                            const isHeldByCurrentUser = isSelected && currentUserSeats && currentUserSeats.has(ticketId)
                            
                            // Check if seat is held by someone else (not current user)
                            const isHeldByOther = !isSelected && userId && seatsByUser 
                              ? Array.from(seatsByUser.entries()).some(([otherUserId, seats]) => 
                                  otherUserId !== userId && seats.has(ticketId)
                                )
                              : false
                            
                            // Backend status HELD - only consider it if seat is not selected by current user
                            // (because if current user selected it, backend might mark it as HELD, but we still allow deselection)
                            const isHeldByBackend = !isSelected && backendStatus === 'HELD'
                            
                            // WebSocket held - only if not selected by current user
                            const isHeldByWebSocket = !isSelected && heldSeats.has(ticketId)
                            
                            // If seat is selected by current user, it's not considered "held" (can be deselected)
                            // Even if backendStatus is HELD, if it's selected by current user, allow deselection
                            const isHeld = !isSelected && (isHeldByBackend || isHeldByOther || isHeldByWebSocket)
                            const isOccupied = isBooked || isMaintenance || isHeld
                            const seatType = getSeatType(seat.id)
                            const isLimitReached = !isOccupied && !isSelected && isSeatTypeLimitReached(seatType)
                            const isDifferentType = !isOccupied && !isSelected && isDifferentSeatType(seatType)

                            // Debug: check disabled state
                            const buttonDisabled = isSelected 
                              ? (isBooked || isMaintenance) // If selected, only disable if booked/maintenance
                              : (isOccupied || isLimitReached || isDifferentType) // If not selected, normal checks

                            return (
                                <button
                                  key={seat.id}
                                  onClick={(e) => {
                                    console.log('[Button onClick] Seat clicked:', seat.id, 'isSelected:', isSelected, 'disabled:', buttonDisabled)
                                    if (!buttonDisabled) {
                                      handleSeatClick(seat.id, isBooked || isMaintenance, isHeld)
                                    } else {
                                      console.log('[Button onClick] Button is disabled, click ignored')
                                    }
                                  }}
                                  disabled={buttonDisabled}
                                className={`
                                  w-10 h-10 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center relative
                                ${isBooked 
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white cursor-not-allowed shadow-inner ring-2 ring-orange-300' 
                                    : isMaintenance
                                      ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white cursor-not-allowed shadow-inner ring-2 ring-gray-400'
                                      : isHeld
                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 cursor-not-allowed shadow-inner animate-pulse ring-2 ring-yellow-300'
                                      : isLimitReached
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                        : isDifferentType
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-30'
                                  : isSelected
                                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white scale-110 shadow-2xl ring-4 ring-emerald-300 ring-offset-2 font-extrabold'
                                      : seatType === 'vip'
                                            ? 'bg-gradient-to-br from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600 shadow-xl hover:shadow-violet-500/60 ring-2 ring-violet-300'
                                            : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-400 hover:to-blue-600 shadow-xl hover:shadow-blue-500/60 ring-2 ring-blue-300'
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

                {/* Legend */}
                <div className="mt-8 bg-gray-50 rounded-xl p-4 border-2 border-gray-300">
                  <h4 className="font-semibold text-center mb-3 text-foreground text-base">Chú thích ghế</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-blue-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded ring-2 ring-blue-300"></div>
                      <span className="text-foreground font-medium">Có thể chọn</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-emerald-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded ring-2 ring-emerald-300"></div>
                      <span className="text-foreground font-medium">Đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-orange-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-700 rounded ring-2 ring-orange-300"></div>
                      <span className="text-foreground font-medium">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-yellow-200">
                      <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded animate-pulse ring-2 ring-yellow-300"></div>
                      <span className="text-foreground font-medium">Đang giữ</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-300 col-span-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-gray-600 to-gray-800 rounded ring-2 ring-gray-400"></div>
                      <span className="text-foreground font-medium">Bảo trì</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
            <BookingOrderSummary
              movieInfo={movieInfo}
              seats={seatsInfo}
              seatsTotal={seatsTotal}
              total={seatsTotal}
              showtimeId={showtimeId}
              userId={userId}
              movieId={movieId}
              showSeatTypeStats={true}
              actionButton={
                <Button
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-4 shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95 rounded-xl text-lg"
                >
                  {selectedSeats.length > 0 ? 'Tiếp tục chọn combo' : 'Vui lòng chọn ghế'}
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

