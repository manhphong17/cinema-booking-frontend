"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Calendar, Play, ArrowLeft, MapPin, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

// Mock data
const movieData = {
  id: 1,
  title: "Avengers: Endgame",
  poster: "/generic-superhero-team-poster.png",
  rating: "P13",
  imdbRating: 8.4,
  genre: "Hành động, Phiêu lưu, Khoa học viễn tưởng",
  duration: "181 phút",
  year: "2019",
  description: "Cuộc chiến cuối cùng của các siêu anh hùng để cứu vũ trụ khỏi sự hủy diệt hoàn toàn."
}

type HallCategory = 'standard' | 'vip' | 'premium' | 'atmos'

type HallShowtimes = {
  hall: string
  type: HallCategory
  slots: { time: string; price: string; available: boolean }[]
}

type DayShowtimes = {
  date: string // yyyy-mm-dd
  label: string
  halls: HallShowtimes[]
}

const generateNext30Days = (): DayShowtimes[] => {
  const days: DayShowtimes[] = []
  const formatter = new Intl.DateTimeFormat("vi-VN", { weekday: "long" })
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = `${d.getMonth() + 1}`.padStart(2, "0")
    const dd = `${d.getDate()}`.padStart(2, "0")
    const iso = `${yyyy}-${mm}-${dd}`
    const w = formatter.format(d)
    const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : w.charAt(0).toUpperCase() + w.slice(1)

    // Mock halls and slots per day
    const halls: HallShowtimes[] = [
      // Thường
      {
        hall: "Phòng 1",
        type: 'standard',
        slots: [
          { time: "09:30", price: "80,000đ", available: true },
          { time: "13:30", price: "90,000đ", available: true },
          { time: "18:00", price: "100,000đ", available: true }
        ]
      },
      {
        hall: "Phòng 2",
        type: 'standard',
        slots: [
          { time: "10:00", price: "80,000đ", available: true },
          { time: "14:30", price: "90,000đ", available: Math.random() > 0.2 },
          { time: "19:30", price: "100,000đ", available: true }
        ]
      },
      {
        hall: "Phòng 3",
        type: 'standard',
        slots: [
          { time: "11:15", price: "80,000đ", available: true },
          { time: "16:00", price: "90,000đ", available: Math.random() > 0.3 },
          { time: "21:00", price: "100,000đ", available: Math.random() > 0.1 }
        ]
      },
      // VIP
      {
        hall: "Phòng VIP 1",
        type: 'vip',
        slots: [
          { time: "10:15", price: "120,000đ", available: true },
          { time: "15:00", price: "130,000đ", available: Math.random() > 0.2 },
          { time: "20:15", price: "140,000đ", available: Math.random() > 0.1 }
        ]
      },
      {
        hall: "Phòng VIP 2",
        type: 'vip',
        slots: [
          { time: "12:00", price: "120,000đ", available: true },
          { time: "17:30", price: "130,000đ", available: true },
          { time: "22:30", price: "140,000đ", available: Math.random() > 0.2 }
        ]
      },
      // Premium
      {
        hall: "Phòng Premium 1",
        type: 'premium',
        slots: [
          { time: "11:45", price: "160,000đ", available: true },
          { time: "16:45", price: "170,000đ", available: Math.random() > 0.5 },
          { time: "22:00", price: "180,000đ", available: true }
        ]
      },
      // Atmos/IMAX
      {
        hall: "Phòng Atmos",
        type: 'atmos',
        slots: [
          { time: "09:00", price: "180,000đ", available: true },
          { time: "14:00", price: "190,000đ", available: Math.random() > 0.4 },
          { time: "20:00", price: "200,000đ", available: true }
        ]
      }
    ]

    days.push({ date: iso, label, halls })
  }
  return days
}

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const days = useMemo(() => generateNext30Days(), [])
  const [selectedDate, setSelectedDate] = useState<string>(days[0].date)
  const [selectedHallCategory, setSelectedHallCategory] = useState<'all' | HallCategory>('all')
  const [page, setPage] = useState(1)
  const pageSize = 6
  const [selectedSelection, setSelectedSelection] = useState<{ time: string; hall: string } | null>(null)

  const handleContinue = () => {
    if (selectedSelection) {
      const q = new URLSearchParams({
        movieId: movieId ?? "",
        date: selectedDate,
        time: selectedSelection.time,
        hall: selectedSelection.hall
      })
      router.push(`/booking/seats?${q.toString()}`)
    }
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Đặt vé xem phim
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Info */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src={movieData.poster}
                    alt={movieData.title}
                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg mb-4"
                  />
                  <h2 className="text-2xl font-bold mb-2">{movieData.title}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span className="font-semibold">{movieData.imdbRating}/10</span>
                    <Badge variant="secondary">{movieData.rating}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{movieData.duration}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{movieData.year}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Thể loại</h4>
                    <p className="text-sm text-muted-foreground">{movieData.genre}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Mô tả</h4>
                    <p className="text-sm text-muted-foreground">{movieData.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showtime Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Chọn suất chiếu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection - 30 days scrollable */}
                <div>
                  <h3 className="font-semibold mb-3">Chọn ngày</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 pr-1">
                    {days.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => {
                          setSelectedDate(d.date)
                          setSelectedSelection(null)
                          setPage(1)
                        }}
                        className={`shrink-0 px-4 py-2 rounded-lg border transition-all ${
                          selectedDate === d.date
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-white hover:bg-gray-50 text-foreground border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-semibold">{d.label}</div>
                        <div className="text-xs opacity-80">{d.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection - filter by hall category and grouped by hall */}
                <div>
                  <h3 className="font-semibold mb-3">Chọn giờ chiếu</h3>
                  {/* Hall category filter */}
                  <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pr-1">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'standard', label: 'Phòng Thường' },
                      { key: 'vip', label: 'Phòng VIP' },
                      { key: 'premium', label: 'Phòng Premium' },
                      { key: 'atmos', label: 'Phòng Atmos/IMAX' }
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => { setSelectedHallCategory(c.key as any); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-all shrink-0 ${
                          selectedHallCategory === (c.key as any)
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-white hover:bg-gray-50 text-foreground border-gray-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const day = days.find(d => d.date === selectedDate)
                      if (!day) return null

                      // If a category is selected, merge halls of that category and show only unique times
                      if (selectedHallCategory !== 'all') {
                        const halls = day.halls.filter(h => h.type === selectedHallCategory)
                        const byTime = new Map<string, { time: string; price: string; hall: string; available: boolean }>()
                        halls.forEach(h => {
                          h.slots.forEach(slot => {
                            const existing = byTime.get(slot.time)
                            // Prefer an available slot; if none yet, take first seen
                            if (!existing || (!existing.available && slot.available)) {
                              byTime.set(slot.time, { time: slot.time, price: slot.price, hall: h.hall, available: slot.available })
                            }
                          })
                        })
                        const mergedAll = Array.from(byTime.values()).sort((a,b) => a.time.localeCompare(b.time))
                        const totalPages = Math.max(1, Math.ceil(mergedAll.length / pageSize))
                        const currentPage = Math.min(page, totalPages)
                        const start = (currentPage - 1) * pageSize
                        const merged = mergedAll.slice(start, start + pageSize)
                        return (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">
                                {selectedHallCategory === 'standard' ? 'Phòng Thường' : selectedHallCategory === 'vip' ? 'Phòng VIP' : selectedHallCategory === 'premium' ? 'Phòng Premium' : 'Phòng Atmos/IMAX'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {merged.map((item, idx) => {
                                const isSelected = selectedSelection && selectedSelection.time === item.time
                                return (
                                  <Button
                                    key={`${item.time}-${idx}`}
                                    variant={isSelected ? 'default' : 'outline'}
                                    disabled={!item.available}
                                    onClick={() => setSelectedSelection({ time: item.time, hall: item.hall })}
                                    className="flex flex-col items-center p-4 h-auto"
                                  >
                                    <div className="font-semibold text-base">{item.time}</div>
                                  </Button>
                                )
                              })}
                            </div>
                            {/* Pagination controls - prominent */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4">
                                <Button
                                  className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
                                  disabled={currentPage === 1}
                                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                  Trước
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                  Trang {currentPage}/{totalPages}
                                </div>
                                <Button
                                  className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
                                  disabled={currentPage === totalPages}
                                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                  Sau
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      }

                      // Default: show grouped by hall with pagination on halls
                      {
                        const hallsAll = day.halls
                        const hallsPerPage = 2
                        const totalPages = Math.max(1, Math.ceil(hallsAll.length / hallsPerPage))
                        const currentPage = Math.min(page, totalPages)
                        const start = (currentPage - 1) * hallsPerPage
                        const halls = hallsAll.slice(start, start + hallsPerPage)

                        return (
                          <>
                            {halls.map((h) => (
                              <div key={h.hall} className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-semibold">{h.hall}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 ml-2">
                                    {h.type === 'standard' ? 'Thường' : h.type === 'vip' ? 'VIP' : h.type === 'premium' ? 'Premium' : 'Atmos/IMAX'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {h.slots.map((slot, idx) => {
                                    const isSelected = selectedSelection && selectedSelection.time === slot.time && selectedSelection.hall === h.hall
                                    return (
                                      <Button
                                        key={`${h.hall}-${slot.time}-${idx}`}
                                        variant={isSelected ? 'default' : 'outline'}
                                        disabled={!slot.available}
                                        onClick={() => setSelectedSelection({ time: slot.time, hall: h.hall })}
                                        className="flex flex-col items-center p-4 h-auto"
                                      >
                                        <div className="font-semibold text-base">{slot.time}</div>
                                      </Button>
                                    )}
                                  )}
                                </div>
                              </div>
                            ))}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-2">
                                <Button
                                  className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
                                  disabled={currentPage === 1}
                                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                  Trước
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                  Trang {currentPage}/{totalPages}
                                </div>
                                <Button
                                  className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
                                  disabled={currentPage === totalPages}
                                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                  Sau
                                </Button>
                              </div>
                            )}
                          </>
                        )
                      }
                    })()}
                  </div>
                </div>

                {/* Continue Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedSelection}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg"
                  >
                    Tiếp tục chọn ghế
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
