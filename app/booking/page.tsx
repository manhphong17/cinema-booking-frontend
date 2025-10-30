"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, MapPin, Monitor, Crown, Zap, Volume2, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { Movie } from "@/type/movie"
import { apiClient } from "@/src/api/interceptor"

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

const defaultMovieData: Movie = {
  id: 1,
  name: "Avengers: Endgame",
  posterUrl: "/generic-superhero-team-poster.png",
  ageRating: 13,
  genre: [{ id: 1, name: "Hành động" }, { id: 2, name: "Phiêu lưu" }],
  duration: 181,
  releaseDate: "2019-04-26",
  description: "—",
  country: { id: 1, name: "Mỹ" } as any,
  language: { id: 1, name: "Tiếng Anh" } as any,
  status: "PLAYING" as any,
  actor: "",
  director: "",
  bannerUrl: "",
  trailerUrl: ""
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

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get("movieId") ?? ""
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
        setMovie(defaultMovieData)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await apiClient.get(`/movies/${movieId}`)
        if (res.data?.status === 200 && res.data?.data) setMovie(res.data.data)
        else {
          setError("Không thể tải thông tin phim")
          setMovie(defaultMovieData)
        }
      } catch {
        setError("Không thể kết nối server")
        setMovie(defaultMovieData)
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
        // Hoàn toàn thay thế dữ liệu cũ
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
      setSelectedTime(null) // đổi ngày thì bỏ chọn suất cũ
      setSelectedHall(null)
      setRooms([])               // và xóa phòng
      setRoomError(null)
      fetchShowtimes(movieId, selectedDate)
    }
  }, [movieId, selectedDate])

  const handleContinue = () => {
    console.log('=== HANDLE CONTINUE DEBUG ===')
    console.log('selectedTime:', selectedTime)
    console.log('selectedHall:', selectedHall)
    console.log('rooms:', rooms)
    
    if (!selectedTime || !selectedHall) {
      console.error('❌ Missing selectedTime or selectedHall')
      return
    }
    
    // Find the selected room to get showTimeId
    const selectedRoom = rooms.find(room => room.roomName === selectedHall)
    console.log('selectedRoom found:', selectedRoom)
    
    if (!selectedRoom) {
      console.error('❌ Could not find selected room!')
      alert('Không tìm thấy thông tin phòng chiếu. Vui lòng thử lại.')
      return
    }
    
    setIsNavigating(true)
    
    const q = new URLSearchParams({
      movieId,
      date: selectedDate,
      time: selectedTime,
      hall: selectedHall,
      showtimeId: selectedRoom.showTimeId.toString()
    })
    
    console.log('✅ Navigating with params:', q.toString())
    
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      router.push(`/booking/seats?${q.toString()}`)
    }, 100)
  }

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Đang tải thông tin phim...</p>
          </div>
        </div>
      </HomeLayout>
    )
  }

  if (error && !movie) {
    return (
      <HomeLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </HomeLayout>
    )
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {/* Right: selections */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date + time */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                                 
                                 // Reset phòng khi chọn suất mới
                                 setRooms([])
                                 setRoomError(null)
                                 setSelectedTime(slot.time)
                                 setSelectedHall(null) // Reset phòng đã chọn
                                 
                                 // Gọi API để load phòng
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
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
              {selectedTime && (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-4">
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedHall || isNavigating}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary/30 rounded-xl text-base"
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
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
