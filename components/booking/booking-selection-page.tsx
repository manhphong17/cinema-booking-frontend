"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, MapPin, Monitor, Crown, Zap, Volume2, Loader2, Plus, Minus, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { Movie } from "@/type/movie"
import { apiClient } from "@/src/api/interceptor"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { jwtDecode } from "jwt-decode"

type HallCategory = "standard" | "vip" | "premium" | "atmos"

type ShowtimeSlot = {
  startTime: string
  endTime: string
  time: string
  price: string
  available: boolean
}

type ShowtimeResponse = {
  status: number
  message: string
  data: { startTime: string; endTime: string }[]
}

type RoomInfo = {
  showTimeId: number
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


const generateNext7Days = () => {
  const days: { date: string; label: string }[] = []
  const formatter = new Intl.DateTimeFormat("vi-VN", { weekday: "long" })
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = `${d.getMonth() + 1}`.padStart(2, "0")
    const dd = `${d.getDate()}`.padStart(2, "0")
    const iso = `${yyyy}-${mm}-${dd}`
    const w = formatter.format(d)
    const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : w.charAt(0).toUpperCase() + w.slice(1)
    days.push({ date: iso, label })
  }
  return days
}

type BookingSelectionPageProps = {
  movieId: string | null
  mode?: 'showtime' | 'concession' // Default: 'showtime'
  seats?: string | null // Required for 'concession' mode
  date?: string | null
  time?: string | null
  hall?: string | null
  showtimeId?: string | null
}

export default function BookingSelectionPage({ 
  movieId,
  mode = 'showtime',
  seats,
  date,
  time,
  hall,
  showtimeId
}: BookingSelectionPageProps) {
  const router = useRouter()
  const days = useMemo(() => generateNext7Days(), [])
  const [selectedDate, setSelectedDate] = useState<string>(days[0].date)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedHall, setSelectedHall] = useState<string | null>(null)

  // Movie
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Showtimes
  const [showtimes, setShowtimes] = useState<ShowtimeSlot[]>([])
  const [loadingShowtimes, setLoadingShowtimes] = useState(false)
  const [showtimeError, setShowtimeError] = useState<string | null>(null)

  // Rooms
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  
  // Navigation
  const [isNavigating, setIsNavigating] = useState(false)

  // Concessions (for concession mode)
  const [concessions, setConcessions] = useState<any[]>([])
  const [loadingConcessions, setLoadingConcessions] = useState(false)
  const [selectedConcessions, setSelectedConcessions] = useState<{[key: string]: number}>({})
  const [userId, setUserId] = useState<number | null>(null)
  
  // Seat data (for concession mode to get accurate prices)
  const [seatData, setSeatData] = useState<any[]>([])
  const [loadingSeatData, setLoadingSeatData] = useState(false)

  // Fetch movie
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await apiClient.get(`/movies/${movieId}`)
        if (res.data?.status === 200 && res.data?.data) {
          setMovie(res.data.data)
        } else {
          setError("Không thể tải thông tin phim")
        }
      } catch {
        setError("Không thể kết nối server")
      } finally {
        setLoading(false)
      }
    }
    fetchMovieData()
  }, [movieId])

  // Get userId from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error('[Booking Selection] Error decoding token:', error)
    }
  }, [])

  // Initialize selected values from props for concession mode
  useEffect(() => {
    if (mode === 'concession') {
      if (date) setSelectedDate(date)
      if (time) setSelectedTime(time)
      if (hall) setSelectedHall(hall)
    }
  }, [mode, date, time, hall])

  // Fetch concessions (for concession mode)
  useEffect(() => {
    if (mode !== 'concession') return

    const fetchConcessions = async () => {
      try {
        setLoadingConcessions(true)
        const res = await apiClient.get("/concession", {
          params: {
            page: 0,
            size: 100,
            stockStatus: "IN_STOCK",
            concessionStatus: "ACTIVE",
          },
        })
        const list = res.data?.data?.content || []
        setConcessions(list)
      } catch (error) {
        console.error("Lỗi khi lấy concessions:", error)
      } finally {
        setLoadingConcessions(false)
      }
    }

    fetchConcessions()
  }, [mode])

  // Fetch seat data when in concession mode and showtimeId is available
  useEffect(() => {
    if (mode !== 'concession' || !showtimeId) return

    const fetchSeatData = async () => {
      try {
        setLoadingSeatData(true)
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/seats`
        )
        if (response.data?.status === 200 && response.data?.data?.length > 0) {
          setSeatData(response.data.data[0].ticketResponses || [])
        }
      } catch (error) {
        console.error("Error fetching seat data:", error)
      } finally {
        setLoadingSeatData(false)
      }
    }

    fetchSeatData()
  }, [mode, showtimeId])


  // Fetch showtimes
  const fetchShowtimes = async (id: string, date: string) => {
    try {
      setLoadingShowtimes(true)
      setShowtimeError(null)
      const res = await apiClient.get<ShowtimeResponse>(`/bookings/movies/${id}/show-times/${date}`)
      if (res.data?.status === 200 && res.data?.data) {
        const data = res.data.data.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          time: new Date(s.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          price: "100,000đ",
          available: true
        }))
        setShowtimes(data)
      } else {
        setShowtimes([])
        setShowtimeError("Không có suất chiếu cho ngày này")
      }
    } catch {
      setShowtimes([])
      setShowtimeError("Không thể tải suất chiếu")
    } finally {
      setLoadingShowtimes(false)
    }
  }

  // Fetch rooms
  const fetchRooms = async (id: string, startTime: string) => {
    setLoadingRooms(true)
    setRoomError(null)
    
    try {
      const res = await apiClient.get<RoomResponse>(
        `/bookings/movies/${id}/show-times/start-time/${encodeURIComponent(startTime)}`
      )
      
      if (res.data?.status === 200 && Array.isArray(res.data.data)) {
        setRooms([...res.data.data])
      } else {
        setRooms([])
        setRoomError("Không có phòng chiếu cho suất này")
      }
    } catch {
      setRoomError("Không thể tải thông tin phòng")
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  // Load showtimes when date/movie changes
  useEffect(() => {
    if (movieId && selectedDate) {
      setSelectedTime(null)
      setSelectedHall(null)
      setRooms([])
      setRoomError(null)
      fetchShowtimes(movieId, selectedDate)
    }
  }, [movieId, selectedDate])

  // Helper functions for concession mode
  const updateConcessionQuantity = (comboId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedConcessions }
      delete newSelected[comboId]
      setSelectedConcessions(newSelected)
    } else {
      setSelectedConcessions(prev => ({ ...prev, [comboId]: quantity }))
    }
  }

  const getSeatPrice = (seatId: string) => {
    if (seatData.length > 0) {
      const ticket = seatData.find(t => {
        const rowLabel = String.fromCharCode(65 + t.rowIdx)
        const seatNumber = t.columnInx + 1
        return `${rowLabel}${seatNumber}` === seatId
      })
      if (ticket) {
        return ticket.ticketPrice
      }
    }
    // Fallback to hardcoded prices if seat data not available
    const row = seatId[0]
    if (row === 'H') return 200000
    if (['E', 'F', 'G'].includes(row)) return 150000
    return 100000
  }

  const getSeatTotal = () => {
    if (!seats) return 0
    return seats.split(',').reduce((total, seatId) => {
      return total + getSeatPrice(seatId.trim())
    }, 0)
  }

  const getConcessionTotal = () => {
    return Object.entries(selectedConcessions).reduce((total, [id, qty]) => {
      const item = concessions.find(c => c.concessionId === parseInt(id))
      return total + (item ? item.price * qty : 0)
    }, 0)
  }

  const getTotalPrice = () => {
    return getSeatTotal() + getConcessionTotal()
  }

  // Prepare data for BookingOrderSummary component
  const seatsInfo: SeatInfo[] = useMemo(() => {
    if (!seats || mode !== 'concession') return []
    return seats.split(',').map(seatId => {
      const trimmedSeatId = seatId.trim()
      
      // Try to get from seatData first
      if (seatData.length > 0) {
        const ticket = seatData.find(t => {
          const rowLabel = String.fromCharCode(65 + t.rowIdx)
          const seatNumber = t.columnInx + 1
          return `${rowLabel}${seatNumber}` === trimmedSeatId
        })
        if (ticket) {
          const seatType = ticket.seatType.toLowerCase()
          let type: 'standard' | 'vip' | 'premium' = 'standard'
          if (seatType.includes('premium')) type = 'premium'
          else if (seatType.includes('vip')) type = 'vip'
          return { id: trimmedSeatId, type, price: ticket.ticketPrice }
        }
      }
      
      // Fallback to hardcoded logic
      const row = trimmedSeatId[0]
      let price = 100000
      let type: 'standard' | 'vip' | 'premium' = 'standard'
      if (row === 'H') {
        price = 200000
        type = 'premium'
      } else if (['E', 'F', 'G'].includes(row)) {
        price = 150000
        type = 'vip'
      }
      return { id: trimmedSeatId, type, price }
    })
  }, [seats, mode, seatData])

  const concessionsInfo: ConcessionInfo[] = useMemo(() => {
    if (mode !== 'concession') return []
    const result: ConcessionInfo[] = []
    Object.entries(selectedConcessions)
      .filter(([_, qty]) => qty > 0)
      .forEach(([comboId, quantity]) => {
        const item = concessions.find(c => String(c.concessionId) === String(comboId))
        if (item) {
          result.push({
            id: String(comboId),
            name: item.name,
            quantity,
            price: item.price
          })
        }
      })
    return result
  }, [selectedConcessions, concessions, mode])

  const movieInfo: MovieInfo | undefined = useMemo(() => {
    if (!movie || mode !== 'concession') return undefined
    return {
      title: movie.name,
      poster: movie.posterUrl,
      date: date || undefined,
      time: time || undefined,
      hall: hall || undefined
    }
  }, [movie, date, time, hall, mode])

  const handleContinue = () => {
    if (mode === 'concession') {
      // Handle concession mode - go to payment
      const comboData = Object.entries(selectedConcessions)
        .map(([comboId, quantity]) => ({ comboId, quantity }))
        .filter(item => item.quantity > 0)
      
      const params = new URLSearchParams({
        movieId: movieId || '',
        showtimeId: showtimeId || '',
        seats: seats || '',
        date: date || '',
        time: time || '',
        hall: hall || '',
        combos: JSON.stringify(comboData)
      })
      
      router.push(`/booking/payment?${params.toString()}`)
      return
    }

    // Handle showtime mode - go to seats
    if (!selectedTime || !selectedHall) {
      return
    }
    
    const selectedRoom = rooms.find(room => room.roomName === selectedHall)
    
    if (!selectedRoom) {
      alert('Không tìm thấy thông tin phòng chiếu. Vui lòng thử lại.')
      return
    }
    
    setIsNavigating(true)
    
    const q = new URLSearchParams({
      movieId: movieId || '',
      date: selectedDate,
      time: selectedTime,
      hall: selectedHall,
      showtimeId: selectedRoom.showTimeId.toString()
    })
    
    setTimeout(() => {
      router.push(`/booking/seats?${q.toString()}`)
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Đang tải thông tin phim...</p>
        </div>
      </div>
    )
  }

  if (error && !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        </div>

        <div className={`grid grid-cols-1 gap-8 ${mode === 'concession' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {/* Left: Movie info - only show in showtime mode */}
          {mode === 'showtime' && (
            <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-background to-gray-50/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Play className="h-4 w-4" />
                    <span>Thông tin phim</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-center mb-4">
                    <img
                      src={movie?.posterUrl || "/placeholder.svg"}
                      alt={movie?.name || "Movie"}
                      className="w-full max-w-48 mx-auto rounded-lg shadow-lg mb-3"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <h2 className="text-lg font-bold mb-2 text-foreground">{movie?.name || "Tên phim"}</h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        P{movie?.ageRating || 13}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{movie?.duration || 120} phút</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : "2024"}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{movie?.country?.name || "Mỹ"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right: selections */}
          {mode === 'concession' ? (
            /* Concession Selection Mode - Full width grid */
            <>
              <div className="lg:col-span-3 mb-6">
                <p className="text-muted-foreground">Thêm đồ ăn và thức uống cho buổi xem phim</p>
              </div>
              <div className="lg:col-span-3">
                <Card className="shadow-2xl border-2 border-primary/30 bg-white hover:shadow-primary/20 transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <ShoppingCart className="h-5 w-5" />
                      Chọn sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loadingConcessions ? (
                        <p className="text-center text-muted-foreground col-span-full">Đang tải danh sách sản phẩm...</p>
                      ) : concessions.length === 0 ? (
                        <p className="text-center text-muted-foreground col-span-full">Không có sản phẩm khả dụng</p>
                      ) : (
                        concessions.map((item) => (
                          <Card key={item.concessionId} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center">
                              <img
                                src={item.urlImage || "/placeholder.svg"}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-primary text-white">
                                  {item.price.toLocaleString('vi-VN')} VNĐ
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{item.description || "Không có mô tả"}</p>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateConcessionQuantity(item.concessionId.toString(), (selectedConcessions[item.concessionId.toString()] || 0) - 1)}
                                    disabled={!selectedConcessions[item.concessionId.toString()]}
                                    className="w-8 h-8 p-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">
                                    {selectedConcessions[item.concessionId.toString()] || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateConcessionQuantity(item.concessionId.toString(), (selectedConcessions[item.concessionId.toString()] || 0) + 1)}
                                    className="w-8 h-8 p-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">Tổng</div>
                                  <div className="font-semibold">
                                    {((selectedConcessions[item.concessionId.toString()] || 0) * item.price).toLocaleString('vi-VN')} VNĐ
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
                <BookingOrderSummary
                  movieInfo={movieInfo}
                  seats={seatsInfo}
                  seatsTotal={getSeatTotal()}
                  concessions={concessionsInfo}
                  concessionsTotal={getConcessionTotal()}
                  total={getTotalPrice()}
                  showtimeId={showtimeId ? parseInt(showtimeId) : null}
                  userId={userId}
                  movieId={movieId}
                  actionButton={
                    <Button
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold px-8 py-3 shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95"
                    >
                      Tiếp tục thanh toán
                    </Button>
                  }
                />
              </div>
            </>
          ) : (
            /* Showtime Selection Mode */
            <div className="lg:col-span-2 space-y-6">
            {/* Date + time */}
            <Card className="shadow-2xl border-2 border-primary/30 bg-white hover:shadow-primary/20 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  Chọn ngày và giờ chiếu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div>
                  <h3 className="font-semibold mb-3">Chọn ngày</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 pr-1">
                    {days.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => {
                          setSelectedDate(d.date)
                          setSelectedTime(null)
                          setSelectedHall(null)
                          setRooms([])
                          setRoomError(null)
                        }}
                        className={`shrink-0 px-4 py-2 rounded-lg border transition-all ${
                          selectedDate === d.date
                            ? "bg-primary text-primary-foreground border-primary shadow"
                            : "bg-white hover:bg-gray-50 text-foreground border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-semibold">{d.label}</div>
                        <div className="text-xs opacity-80">{d.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times */}
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Chọn khung giờ chiếu</h3>

                  {loadingShowtimes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Đang tải suất chiếu...</span>
                    </div>
                  ) : showtimeError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-2">{showtimeError}</p>
                      <Button variant="outline" size="sm" onClick={() => movieId && fetchShowtimes(movieId, selectedDate)}>
                        Thử lại
                      </Button>
                    </div>
                  ) : showtimes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Không có suất chiếu cho ngày này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {showtimes.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <Button
                            key={slot.startTime}
                            variant={isSelected ? "default" : "outline"}
                            disabled={!slot.available}
                            onClick={() => {
                              if (!slot.available) return
                              
                              setRooms([])
                              setRoomError(null)
                              setSelectedTime(slot.time)
                              setSelectedHall(null)
                              
                              if (movieId) {
                                setTimeout(() => {
                                  fetchRooms(movieId, slot.startTime)
                                }, 50)
                              }
                            }}
                            className={`p-3 h-12 flex flex-col items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                : slot.available
                                ? "hover:bg-primary/10 hover:scale-105"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className="text-base font-bold">{slot.time}</div>
                            <div className="text-xs opacity-80">{slot.available ? "Còn chỗ" : "Hết chỗ"}</div>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rooms */}
            {selectedTime && (
              <Card className="shadow-2xl border-2 border-primary/30 bg-white hover:shadow-primary/20 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Monitor className="h-5 w-5" />
                    Chọn phòng chiếu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRooms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Đang tải thông tin phòng...</span>
                    </div>
                  ) : roomError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-2">{roomError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const selectedSlot = showtimes.find((slot) => slot.time === selectedTime)
                          if (movieId && selectedSlot) fetchRooms(movieId, selectedSlot.startTime)
                        }}
                      >
                        Thử lại
                      </Button>
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Không có phòng chiếu cho suất này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rooms.map((room) => {
                        const isSelected = selectedHall === room.roomName

                        const getRoomIcon = (roomType: string) => {
                          switch (roomType) {
                            case "2D":
                              return <Monitor className="h-5 w-5" />
                            case "3D":
                              return <Zap className="h-5 w-5" />
                            case "IMAX":
                              return <Volume2 className="h-5 w-5" />
                            case "VIP":
                              return <Crown className="h-5 w-5" />
                            default:
                              return <Monitor className="h-5 w-5" />
                          }
                        }

                        const getRoomColor = (roomType: string) => {
                          switch (roomType) {
                            case "2D":
                              return "border-blue-200 bg-blue-50"
                            case "3D":
                              return "border-purple-200 bg-purple-50"
                            case "IMAX":
                              return "border-red-200 bg-red-50"
                            case "VIP":
                              return "border-yellow-200 bg-yellow-50"
                            default:
                              return "border-gray-200 bg-gray-50"
                          }
                        }

                        return (
                          <Card
                            key={room.roomId}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                            } ${getRoomColor(room.roomType)}`}
                            onClick={() => setSelectedHall(room.roomName)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getRoomIcon(room.roomType)}
                                  <span className="font-semibold text-base">{room.roomName}</span>
                                </div>
                                <Badge
                                  variant={
                                    room.roomType === "2D"
                                      ? "secondary"
                                      : room.roomType === "3D"
                                      ? "default"
                                      : room.roomType === "IMAX"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {room.roomType}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Thời gian:</span>
                                  <span className="font-semibold text-sm">
                                    {selectedTime} - {new Date(room.endTime).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Tổng ghế:</span>
                                  <span className="font-semibold text-sm">{room.totalSeat}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Ghế trống:</span>
                                  <span className="font-bold text-base text-primary">{room.totalSeatAvailable}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Trạng thái:</span>
                                  <span
                                    className={`text-xs font-medium ${
                                      room.totalSeatAvailable > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {room.totalSeatAvailable > 0 ? "Còn chỗ" : "Hết chỗ"}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-primary/20">
                                  <div className="flex items-center gap-2 text-primary font-medium">
                                    <Play className="h-4 w-4" />
                                    <span className="text-sm">Đã chọn</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {selectedTime && selectedHall && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-base">Suất chiếu đã chọn</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ngày:</span>
                      <span className="ml-2 font-medium">
                        {days.find((d) => d.date === selectedDate)?.label} ({selectedDate})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phòng:</span>
                      <span className="ml-2 font-medium">{selectedHall}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span className="ml-2 font-medium">
                        {selectedTime} - {(() => {
                          const selectedRoom = rooms.find((room) => room.roomName === selectedHall)
                          return selectedRoom
                            ? new Date(selectedRoom.endTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                              })
                            : "--:--"
                        })()}
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const selectedRoom = rooms.find((room) => room.roomName === selectedHall)
                    if (!selectedRoom) return null
                    return (
                      <div className="mt-3 pt-3 border-t border-primary/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Loại phòng:</span>
                            <span className="ml-2 font-medium">{selectedRoom.roomType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ghế trống:</span>
                            <span className="ml-2 font-medium text-primary">
                              {selectedRoom.totalSeatAvailable}/{selectedRoom.totalSeat}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Continue */}
            {selectedTime && mode === 'showtime' && (
              <Card className="shadow-lg border-0">
                <CardContent className="p-4">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedHall || isNavigating}
                    className="w-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-3 shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95 rounded-xl text-base"
                  >
                    {isNavigating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang chuyển trang...</span>
                      </div>
                    ) : selectedHall ? (
                      "Tiếp tục chọn ghế"
                    ) : (
                      "Vui lòng chọn phòng chiếu"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

