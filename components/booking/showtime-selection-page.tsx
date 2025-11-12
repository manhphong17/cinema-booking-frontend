"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, MapPin, Monitor, Crown, Zap, Volume2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { Movie } from "@/type/movie"
import { apiClient } from "@/src/api/interceptor"

// Types
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

// Utilities
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

type ShowtimeSelectionPageProps = {
  movieId: string | null
}

export default function ShowtimeSelectionPage({ movieId }: ShowtimeSelectionPageProps) {
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

  const handleContinue = () => {
    if (!selectedTime || !selectedHall) {
      return
    }
    
    const selectedRoom = rooms.find(room => room.roomName === selectedHall)
    
    if (!selectedRoom) {
      alert('Không tìm thấy thông tin phòng chiếu. Vui lòng thử lại.')
      return
    }
    
    // Check if room is sold out
    if (selectedRoom.totalSeatAvailable === 0) {
      alert('Phòng chiếu này đã hết vé. Vui lòng chọn phòng khác.')
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Decorative Border Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-12 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
          <div className="inline-block mb-4">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-3 py-1 bg-blue-50 rounded-md">
              Step 1
            </div>
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Chọn ngày, giờ và phòng chiếu phù hợp với bạn
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
            <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Movie info */}
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

          {/* Right: showtime selections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date + time */}
            <Card className="shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold">Chọn ngày và giờ chiếu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                {/* Dates */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                    <h3 className="font-bold text-lg text-gray-900">Chọn ngày</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 pr-2">
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
                        className={`shrink-0 px-5 py-3 rounded-xl border-2 transition-all duration-300 min-w-[100px] ${
                          selectedDate === d.date
                            ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-xl shadow-blue-500/50 scale-105 ring-4 ring-blue-200"
                            : "bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="text-sm font-bold mb-1">{d.label}</div>
                        <div className={`text-xs ${selectedDate === d.date ? "text-blue-100" : "text-gray-500"}`}>{d.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                    <h3 className="font-bold text-lg text-gray-900">Chọn khung giờ chiếu</h3>
                  </div>

                  {loadingShowtimes ? (
                    <div className="flex items-center justify-center py-12 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-600" />
                      <span className="text-gray-700 font-medium">Đang tải suất chiếu...</span>
                    </div>
                  ) : showtimeError ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl border-2 border-red-200">
                      <p className="text-red-600 mb-4 font-semibold">{showtimeError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => movieId && fetchShowtimes(movieId, selectedDate)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Thử lại
                      </Button>
                    </div>
                  ) : showtimes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-gray-600 font-medium">Không có suất chiếu cho ngày này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {showtimes.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={slot.startTime}
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
                            className={`p-4 h-16 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center font-bold ${
                              isSelected
                                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-xl shadow-blue-500/50 scale-105 ring-4 ring-blue-200"
                                : slot.available
                                ? "bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:shadow-lg hover:scale-105"
                                : "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                            }`}
                          >
                            <div className="text-base font-bold">{slot.time}</div>
                            {isSelected && (
                              <div className="text-xs mt-1 text-blue-100 font-medium">Đã chọn</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rooms */}
            {selectedTime && (
              <Card className="shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
                  <CardTitle className="flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold">Chọn phòng chiếu</span>
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

                        const isSoldOut = room.totalSeatAvailable === 0
                        
                        return (
                          <Card
                            key={room.roomId}
                            className={`transition-all duration-300 border-2 ${
                              isSoldOut 
                                ? "opacity-60 cursor-not-allowed border-gray-300" 
                                : isSelected 
                                  ? "ring-4 ring-blue-300 shadow-xl shadow-blue-500/50 cursor-pointer border-blue-500 scale-105" 
                                  : "cursor-pointer hover:shadow-xl border-gray-200 hover:border-blue-300 hover:scale-105"
                            } ${getRoomColor(room.roomType)}`}
                            onClick={() => {
                              if (!isSoldOut) {
                                setSelectedHall(room.roomName)
                              }
                            }}
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
                                  <span className={`font-bold text-base ${
                                    isSoldOut ? "text-red-600" : "text-primary"
                                  }`}>
                                    {room.totalSeatAvailable}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Trạng thái:</span>
                                  <span
                                    className={`text-xs font-medium ${
                                      isSoldOut ? "text-red-600 font-bold" : "text-green-600"
                                    }`}
                                  >
                                    {isSoldOut ? "Hết vé" : "Còn chỗ"}
                                  </span>
                                </div>
                              </div>

                              {isSoldOut && (
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <span className="text-sm">⚠️ Không thể chọn - Đã hết vé</span>
                                  </div>
                                </div>
                              )}
                              {isSelected && !isSoldOut && (
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

            {/* Continue */}
            {selectedTime && (
              <div>
                  {(() => {
                    const selectedRoom = rooms.find((room) => room.roomName === selectedHall)
                    const isSoldOut = selectedRoom?.totalSeatAvailable === 0
                    const isDisabled = !selectedHall || isNavigating || isSoldOut
                    
                    return (
                      <Button
                        onClick={handleContinue}
                        disabled={isDisabled}
                        className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold py-4 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 border-2 border-blue-400 active:scale-95 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden "
                       >
                        {/*<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>*/}
                        {/*    <span className="relative z-10">*/}
                                {isNavigating ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Đang chuyển trang...</span>
                                    </div>) :
                                isSoldOut ? (
                                    "⚠️ Phòng này đã hết vé"
                                ) : selectedHall ? (
                                    "Tiếp tục chọn ghế →"
                                ) : (
                                "Vui lòng chọn phòng chiếu"
                                )}
                            {/*</span>*/}
                      </Button>
                    )
                  })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

