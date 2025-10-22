"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Calendar, Play, ArrowLeft, MapPin, Users, Monitor, Crown, Zap, Volume2 } from "lucide-react"
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

const generateNext7Days = (): DayShowtimes[] => {
  const days: DayShowtimes[] = []
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
  const days = useMemo(() => generateNext7Days(), [])
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
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Info - Fixed Left Sidebar */}
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
                      src={movieData.poster}
                      alt={movieData.title}
                      className="w-full max-w-48 mx-auto rounded-lg shadow-lg mb-3"
                    />
                    <h2 className="text-lg font-bold mb-2 text-foreground">{movieData.title}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold text-foreground">{movieData.imdbRating}/10</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {movieData.rating}
                      </Badge>
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
                  
              </CardContent>
            </Card>
            </div>

            {/* Date and Time Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date and Time Selection Card */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Chọn ngày và giờ chiếu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection - 7 days scrollable */}
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

                  {/* Time Selection */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Chọn khung giờ chiếu</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {(() => {
                        const day = days.find(d => d.date === selectedDate)
                        if (!day) return null

                        // Get all unique times from all halls
                        const allTimes = new Set<string>()
                        day.halls.forEach(hall => {
                          hall.slots.forEach(slot => {
                            allTimes.add(slot.time)
                          })
                        })
                        
                        const sortedTimes = Array.from(allTimes).sort()
                        
                        return sortedTimes.map((time) => {
                          const isSelected = selectedSelection && selectedSelection.time === time
                          return (
                            <Button
                              key={time}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => {
                                // Find the first available hall for this time
                                const availableHall = day.halls.find(hall => 
                                  hall.slots.some(slot => slot.time === time && slot.available)
                                )
                                if (availableHall) {
                                  setSelectedSelection({ time, hall: availableHall.hall })
                                }
                              }}
                              className={`p-3 h-12 flex flex-col items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                                  : 'hover:bg-primary/10 hover:scale-105'
                              }`}
                            >
                              <div className="text-base font-bold">{time}</div>
                              <div className="text-xs opacity-80">Giờ</div>
                            </Button>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hall Selection Card */}
              {selectedSelection && (
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Chọn phòng chiếu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        const day = days.find(d => d.date === selectedDate)
                        if (!day) return null
                        
                        const availableHalls = day.halls.filter(hall => 
                          hall.slots.some(slot => slot.time === selectedSelection.time && slot.available)
                        )
                        
                        return availableHalls.map((hall) => {
                          const slot = hall.slots.find(s => s.time === selectedSelection.time)
                          const isSelected = selectedSelection.hall === hall.hall
                          
                          const getHallIcon = (type: HallCategory) => {
                            switch (type) {
                              case 'standard': return <Monitor className="h-5 w-5" />
                              case 'vip': return <Crown className="h-5 w-5" />
                              case 'premium': return <Zap className="h-5 w-5" />
                              case 'atmos': return <Volume2 className="h-5 w-5" />
                              default: return <Monitor className="h-5 w-5" />
                            }
                          }
                          
                          const getHallColor = (type: HallCategory) => {
                            switch (type) {
                              case 'standard': return 'border-blue-200 bg-blue-50'
                              case 'vip': return 'border-yellow-200 bg-yellow-50'
                              case 'premium': return 'border-purple-200 bg-purple-50'
                              case 'atmos': return 'border-red-200 bg-red-50'
                              default: return 'border-gray-200 bg-gray-50'
                            }
                          }

                          return (
                            <Card 
                              key={hall.hall}
                              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                isSelected 
                                  ? 'ring-2 ring-primary shadow-lg' 
                                  : 'hover:shadow-md'
                              } ${getHallColor(hall.type)}`}
                              onClick={() => setSelectedSelection({ 
                                time: selectedSelection.time, 
                                hall: hall.hall 
                              })}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getHallIcon(hall.type)}
                                    <span className="font-semibold text-base">{hall.hall}</span>
                                  </div>
                                  <Badge 
                                    variant={hall.type === 'standard' ? 'secondary' : 
                                            hall.type === 'vip' ? 'default' : 
                                            hall.type === 'premium' ? 'outline' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {hall.type === 'standard' ? 'Thường' : 
                                     hall.type === 'vip' ? 'VIP' : 
                                     hall.type === 'premium' ? 'Premium' : 'Atmos/IMAX'}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Giờ:</span>
                                    <span className="font-semibold text-sm">{selectedSelection.time}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Giá:</span>
                                    <span className="font-bold text-base text-primary">{slot?.price}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Trạng thái:</span>
                                    <span className={`text-xs font-medium ${
                                      slot?.available ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {slot?.available ? 'Còn chỗ' : 'Hết chỗ'}
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
                        })
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Showtime Summary */}
              {selectedSelection && (
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
                          {days.find(d => d.date === selectedDate)?.label} ({selectedDate})
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Giờ:</span>
                        <span className="ml-2 font-medium">{selectedSelection.time}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phòng:</span>
                        <span className="ml-2 font-medium">{selectedSelection.hall}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Continue Button */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-4">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedSelection}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary/30 rounded-xl text-base"
                  >
                    {selectedSelection ? 'Tiếp tục chọn ghế' : 'Vui lòng chọn suất chiếu'}
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
