"use client"

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
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
import { Button } from "@/components/ui/button"

// ===============================
// 2️⃣ TYPE DEFINITIONS
// ===============================
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

// ===============================
// 3️⃣ COMPONENT CHÍNH
// ===============================
export function TicketSelection({ onAddToCart, onSyncTicketsToCart }: TicketSelectionProps) {
  // =======================================
  // 🟢 STATE CHÍNH & DATA
  // =======================================
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([])
  const [apiMovies, setApiMovies] = useState<StaffMovie[]>([])
  const [showtimes, setShowtimes] = useState<ShowtimeInfo[]>([])
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  const [userId, setUserId] = useState<number | null>(null)

  // =======================================
  // 🟢 STATE LOADING
  // =======================================
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [loadingShowtimes, setLoadingShowtimes] = useState(false)
  const [loadingSeats, setLoadingSeats] = useState(false)

  // =======================================
  // 🟢 STATE QUẢN LÝ NGÀY
  // =======================================
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [datePage, setDatePage] = useState(0)
  const daysPerPage = 5
  const maxDays = 30 // Giới hạn 30 ngày kế tiếp

  // =======================================
  // 🟢 REFS & TRACKING
  // =======================================
  const sentSeatsRef = useRef<Set<number>>(new Set()) // Theo dõi đã gửi ghế nào qua WebSocket
  const releasedSeatsRef = useRef<Set<number>>(new Set()) // Theo dõi ghế vừa được giải phóng bởi user hiện tại
  const hasRestoredRef = useRef(false) // Theo dõi đã khôi phục ghế chưa để tránh vòng lặp vô hạn

  // =======================================
  // 🟢 HÀM TIỆN ÍCH NGÀY THÁNG
  // =======================================
  const formatApiDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const allDays = Array.from({ length: maxDays }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

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

  // =======================================
  // 🟢 WEBSOCKET CALLBACKS
  // =======================================
  const handleSeatReleased = useCallback((releasedUserId: number, ticketIds: number[]) => {
    // Khi ghế của user hiện tại được giải phóng qua WebSocket, cập nhật seatData local
    // Đảm bảo UI phản ánh việc giải phóng ngay lập tức, kể cả khi backendStatus chưa cập nhật trong API response
    if (releasedUserId === userId) {
      console.log('[Staff] WebSocket RELEASED confirmed, updating local seatData:', ticketIds)
      
      // Cập nhật seatData local để phản ánh việc giải phóng
      setSeatData(prev => prev.map(seat => {
        if (ticketIds.includes(seat.ticketId) && seat.seatStatus === 'HELD') {
          return { ...seat, seatStatus: 'AVAILABLE' }
        }
        return seat
      }))
      
      // Dọn dẹp releasedSeatsRef vì đã cập nhật state local
      ticketIds.forEach(ticketId => {
        releasedSeatsRef.current.delete(ticketId)
        console.log('[Staff] Đã xóa khỏi releasedSeatsRef - state local đã cập nhật:', ticketId)
      })
    }
  }, [userId])
  
  const { isConnected, heldSeats, seatsByUser, selectSeats, deselectSeats, syncWithSeatData } = useSeatWebSocket(
    selectedShowtimeId,
    userId,
    !!selectedShowtimeId && !!userId,
    handleSeatReleased,
    undefined // Không có booked handler cho staff
  )

  // =======================================
  // 🟢 useEffect — INIT & LOAD DATA
  // =======================================
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error('Lỗi khi decode token:', error)
    }
  }, [])

  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true)
      try {
        const moviesData = await getMoviesWithShowtimesToday(formatApiDate(selectedDate))
        setApiMovies(moviesData)
      } catch (error) {
        console.error("Lỗi khi tải danh sách phim:", error)
      } finally {
        setLoadingMovies(false)
      }
    }
    fetchMovies()
  }, [selectedDate])

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

  // =======================================
  // 🟢 useEffect — TẢI DỮ LIỆU GHẾ
  // =======================================
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
      hasRestoredRef.current = false // Reset cờ khôi phục khi fetch ghế mới
      releasedSeatsRef.current.clear() // Xóa released seats khi fetch showtime mới
      // Không xóa selected seats ở đây - để WebSocket khôi phục chúng
      try {
        const response = await apiClient.get<SeatResponse>(
          `/bookings/show-times/${selectedShowtimeId}/seats`
        )
        if (response.data?.status === 200 && response.data?.data && response.data.data.length > 0) {
          // API trả về array của BookingSeatsData, trích xuất ticketResponses
          const tickets = response.data.data[0].ticketResponses
          setSeatData(tickets)
          
          // Đồng bộ trạng thái WebSocket với seatData (cho ghế có trạng thái HELD)
          if (syncWithSeatData && tickets.length > 0) {
            syncWithSeatData(tickets.map(t => ({ ticketId: t.ticketId, seatStatus: t.seatStatus })))
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu ghế:", error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeats()
  }, [selectedShowtimeId])

  // =======================================
  // 🟢 COMPUTED VALUES
  // =======================================
  const currentMovie = apiMovies.find((m) => m.id === selectedMovieId)
  const currentShowtime = showtimes.find((s) => s.showTimeId === selectedShowtimeId)

  // =======================================
  // 🟢 HÀM HỖ TRỢ
  // =======================================
  const getTicketId = (seatId: string): number | null => {
    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })
    return seat?.ticketId || null
  }

  // =======================================
  // 🟢 useEffect — KHÔI PHỤC GHẾ ĐÃ GIỮ
  // =======================================
  useEffect(() => {
    if (!userId || !selectedShowtimeId || !seatData.length) return
    if (hasRestoredRef.current) return // Đã khôi phục rồi
    
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
          
          console.log('[Staff] Đang khôi phục ghế đã giữ từ API:', restoredSeats)
          if (restoredSeats.length > 0) {
            hasRestoredRef.current = true
            setSelectedSeats(restoredSeats)
            // Xóa releasedSeatsRef khi khôi phục - những ghế này đang được khôi phục, không phải giải phóng
            restoredSeats.forEach(seatId => {
              const ticketId = getTicketId(seatId)
              if (ticketId) {
                releasedSeatsRef.current.delete(ticketId)
              }
            })
          } else {
            // Nếu không có ghế nào để khôi phục, xóa releasedSeatsRef cho showtime này
            releasedSeatsRef.current.clear()
          }
        }
      } catch (error) {
        // Không có ghế đã giữ hoặc lỗi - bỏ qua
        console.log('[Staff] Không có ghế đã giữ để khôi phục hoặc lỗi:', error)
      }
    }
    
    restoreHeldSeats()
  }, [userId, selectedShowtimeId, seatData])

  // =======================================
  // 🟢 useEffect — ĐỒNG BỘ TICKET IDs
  // =======================================
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

  // =======================================
  // 🟢 useEffect — ĐỒNG BỘ WEBSOCKET
  // =======================================
  useEffect(() => {
    if (!isConnected || !selectedShowtimeId || !userId || selectedTicketIds.length === 0) return

    // Chỉ lấy những ghế MỚI chưa được gửi qua WebSocket
    const newTicketsToSelect = selectedTicketIds.filter(ticketId => {
      // Đã gửi rồi, bỏ qua
      if (sentSeatsRef.current.has(ticketId)) {
        return false
      }
      
      // Kiểm tra xem ghế này có được giữ bởi người khác không (không phải user hiện tại)
      if (!heldSeats.has(ticketId)) {
        // Không được giữ bởi ai, có thể chọn
        return true
      }
      
      // Kiểm tra xem có được giữ bởi user hiện tại không
      const currentUserSeats = userId ? seatsByUser.get(userId) : null
      if (currentUserSeats && currentUserSeats.has(ticketId)) {
        // Được giữ bởi user hiện tại, có thể chọn
        return true
      }
      
      // Được giữ bởi người khác, không thể chọn
      return false
    })

    if (newTicketsToSelect.length > 0) {
      console.log('[Staff] Tự động chọn ghế mới qua WebSocket:', newTicketsToSelect)
      // Đánh dấu đã gửi những ghế này
      newTicketsToSelect.forEach(ticketId => sentSeatsRef.current.add(ticketId))
      selectSeats(newTicketsToSelect)
    }
  }, [isConnected, selectedShowtimeId, userId, selectedTicketIds, selectSeats, heldSeats, seatsByUser])

  // =======================================
  // 🟢 useEffect — DỌN DẸP
  // =======================================
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
  
  useEffect(() => {
    if (!seatData.length) return
    
    releasedSeatsRef.current.forEach((ticketId) => {
      // Kiểm tra xem backendStatus có còn là HELD cho ghế này không
      const seat = seatData.find(t => t.ticketId === ticketId)
      const backendStatus = seat?.seatStatus || 'AVAILABLE'
      
      // Xóa khỏi releasedSeatsRef chỉ khi backendStatus KHÔNG phải HELD
      // Đảm bảo không xóa sớm trước khi backend thực sự cập nhật
      if (backendStatus !== 'HELD') {
        releasedSeatsRef.current.delete(ticketId)
        console.log('[Staff] Đã xóa khỏi releasedSeatsRef - backendStatus đã cập nhật:', ticketId, backendStatus)
      }
    })
  }, [seatData])

  // =======================================
  // 🟢 useEffect — ĐỒNG BỘ VỚI CART
  // =======================================
  useEffect(() => {
    if (!onSyncTicketsToCart || !selectedShowtimeId || !currentMovie || !currentShowtime) return

    // Xây dựng map giá ghế
    const seatPrices: Record<string, number> = {}
    // Xây dựng map loại ghế
    const seatTypes: Record<string, string> = {}
    selectedSeats.forEach(seatId => {
      seatPrices[seatId] = getSeatPrice(seatId)
      seatTypes[seatId] = getSeatType(seatId)
    })

    // Xây dựng chuỗi thông tin showtime
    const showtimeInfo = `${formatTime(currentShowtime.startTime)} - ${currentShowtime.roomName}`

    // Đồng bộ với cart kèm ticketIds
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

  // =======================================
  // 🟢 XỬ LÝ SỰ KIỆN
  // =======================================
  const handleSeatSelect = (seatId: string, isOccupied: boolean, isHeld: boolean) => {
    console.log('[Staff handleSeatSelect] Được gọi với:', { seatId, isOccupied, isHeld })
    const ticketId = getTicketId(seatId)
    if (!ticketId) {
      console.log('[Staff handleSeatSelect] Không tìm thấy ticketId cho ghế:', seatId)
      return
    }

    // Nếu ghế đã được chọn bởi user hiện tại, cho phép bỏ chọn
    const isSelectedByCurrentUser = selectedSeats.includes(seatId)
    console.log('[Staff handleSeatSelect] isSelectedByCurrentUser:', isSelectedByCurrentUser)
    
    if (isSelectedByCurrentUser) {
      // Luôn cho phép bỏ chọn nếu ghế được chọn bởi user hiện tại
      // Kiểm tra trực tiếp xem ghế có được giữ bởi người khác không (không dựa vào tham số isHeld)
      const isHeldByOther = userId && seatsByUser 
        ? Array.from(seatsByUser.entries()).some(([otherUserId, seats]) => 
            otherUserId !== userId && seats.has(ticketId)
          )
        : false

      if (isHeldByOther) {
        // Không thể bỏ chọn ghế được giữ bởi người khác
        console.log('[Staff] Không thể bỏ chọn: ghế được giữ bởi user khác')
        return
      }

      // Kiểm tra xem ghế có bị đặt, bảo trì, hoặc chặn không - không thể bỏ chọn những ghế đó
      const seatFromData = seatData.find(t => t.ticketId === ticketId)
      const backendStatus = seatFromData?.seatStatus || 'AVAILABLE'
      if (backendStatus === 'BOOKED' || backendStatus === 'UNAVAILABLE' || backendStatus === 'BLOCKED') {
        console.log('[Staff] Không thể bỏ chọn: ghế đã được đặt, không khả dụng, hoặc bị chặn')
        return
      }

      const newSelectedSeats = selectedSeats.filter(id => id !== seatId)
      const newSelectedTicketIds = selectedTicketIds.filter(id => id !== ticketId)

      setSelectedSeats(newSelectedSeats)
      setSelectedTicketIds(newSelectedTicketIds)
      
      // Xóa khỏi sentSeatsRef khi user bỏ chọn
      sentSeatsRef.current.delete(ticketId)

      // Đánh dấu là đã giải phóng để bỏ qua backendStatus HELD cũ
      releasedSeatsRef.current.add(ticketId)
      
      // Bỏ chọn qua WebSocket - điều này sẽ giải phóng hold trên backend
      console.log('[Staff] Đang bỏ chọn ghế:', seatId, 'ticketId:', ticketId, 'isConnected:', isConnected)
      if (isConnected) {
        deselectSeats([ticketId])
      } else {
        console.warn('[Staff] WebSocket chưa kết nối, không thể bỏ chọn qua WebSocket')
      }
      
      // Đồng bộ với cart tự động (sẽ được xử lý trong useEffect sau khi state cập nhật)
      return
    }

    // Để chọn ghế mới, kiểm tra xem có bị chiếm hoặc giữ không
    if (isOccupied || isHeld) return

    const seatType = getSeatType(seatId)

    const seatsOfSameType = selectedSeats.filter(id => getSeatType(id) === seatType)

    if (seatsOfSameType.length >= 8) {
      alert(`Bạn chỉ có thể chọn tối đa 8 ghế ${seatType === 'vip' ? 'VIP' : 'thường'} cùng loại`)
      return
    }

    const newSelectedSeats = [...selectedSeats, seatId]
    const newSelectedTicketIds = [...selectedTicketIds, ticketId]

    setSelectedSeats(newSelectedSeats)
    setSelectedTicketIds(newSelectedTicketIds)
    
    // Xóa khỏi releasedSeatsRef nếu user chọn lại (nghĩa là nó không còn được giải phóng)
    releasedSeatsRef.current.delete(ticketId)
    
    // Lưu ý: selectSeats sẽ được gọi tự động bởi useEffect khi selectedTicketIds thay đổi
    // Không gọi trực tiếp ở đây để tránh duplicate calls
    
    // Đồng bộ với cart tự động (sẽ được xử lý trong useEffect sau khi state cập nhật)
  }

  // =======================================
  // 🟢 HÀM LAYOUT & TÍNH TOÁN
  // =======================================
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
      // Tính tổng giá từ ghế đã chọn
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

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

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

  // =======================================
  // 🟢 RETURN UI
  // =======================================
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
                        
                        // Kiểm tra xem có được giữ bởi user hiện tại không (có thể bỏ chọn)
                        const currentUserSeats = userId ? seatsByUser?.get(userId) : null
                        const isHeldByCurrentUser = isSelected && currentUserSeats && currentUserSeats.has(ticketId)
                        
                        // Kiểm tra xem có được giữ bởi người khác không (không phải user hiện tại)
                        const isHeldByOther = !isSelected && userId && seatsByUser 
                          ? Array.from(seatsByUser.entries()).some(([otherUserId, seats]) => 
                              otherUserId !== userId && seats.has(ticketId)
                            )
                          : false
                        
                        // WebSocket giữ - chỉ khi không được chọn bởi user hiện tại
                        const isHeldByWebSocket = !isSelected && heldSeats.has(ticketId)
                        
                        // Kiểm tra xem ghế này có vừa được giải phóng bởi user hiện tại không
                        // Nếu có, không tin tưởng backendStatus HELD vì có thể chưa được cập nhật
                        const isJustReleased = releasedSeatsRef.current.has(ticketId)
                          
                        // Trạng thái HELD từ backend - tin tưởng nếu:
                        // 1. Ghế không được chọn bởi user hiện tại
                        // 2. VÀ nó không vừa được giải phóng bởi user hiện tại (để tránh trạng thái HELD cũ sau khi giải phóng)
                        // Điều này cho phép hiển thị trạng thái HELD cho ghế được giữ bởi người khác (kể cả khi WebSocket chưa đồng bộ),
                        // nhưng ngăn hiển thị HELD cho ghế vừa được giải phóng bởi user hiện tại
                        const isHeldByBackend = !isSelected && backendStatus === 'HELD' && !isJustReleased
                        
                        // Nếu ghế được chọn bởi user hiện tại, nó không được coi là "held" (có thể bỏ chọn)
                        const isHeld = !isSelected && (isHeldByBackend || isHeldByOther || isHeldByWebSocket)
                        const isOccupied = isBooked || isMaintenance || isBlocked || isHeld
                        const seatType = getSeatType(seat.id)
                        const isLimitReached = !isOccupied && !isSelected && isSeatTypeLimitReached(seatType)
                        const isDifferentType = false // Đã bỏ hạn chế: cho phép chọn nhiều loại ghế

                        // Debug: kiểm tra trạng thái disabled
                        const buttonDisabled = isSelected 
                          ? (isBooked || isMaintenance || isBlocked) // Nếu đã chọn, disable nếu đã đặt/bảo trì/chặn
                          : (isOccupied || isLimitReached || isDifferentType) // Nếu chưa chọn, kiểm tra bình thường

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
