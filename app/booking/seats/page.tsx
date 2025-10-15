"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Sofa, CreditCard, Calendar, Clock, MapPin } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

// Mock data
const movieData = {
  id: 1,
  title: "Avengers: Endgame",
  poster: "/generic-superhero-team-poster.png",
  time: "20:00",
  date: "2024-12-20",
  hall: "Hall 1",
  price: "100,000đ"
}

// Seat layout - 8 rows, 12 seats per row
const seatLayout = [
  { row: "A", seats: Array.from({ length: 12 }, (_, i) => ({ id: `A${i + 1}`, type: "standard", price: 100000 })) },
  { row: "B", seats: Array.from({ length: 12 }, (_, i) => ({ id: `B${i + 1}`, type: "standard", price: 100000 })) },
  { row: "C", seats: Array.from({ length: 12 }, (_, i) => ({ id: `C${i + 1}`, type: "standard", price: 100000 })) },
  { row: "D", seats: Array.from({ length: 12 }, (_, i) => ({ id: `D${i + 1}`, type: "standard", price: 100000 })) },
  { row: "E", seats: Array.from({ length: 12 }, (_, i) => ({ id: `E${i + 1}`, type: "vip", price: 150000 })) },
  { row: "F", seats: Array.from({ length: 12 }, (_, i) => ({ id: `F${i + 1}`, type: "vip", price: 150000 })) },
  { row: "G", seats: Array.from({ length: 12 }, (_, i) => ({ id: `G${i + 1}`, type: "vip", price: 150000 })) },
  { row: "H", seats: Array.from({ length: 12 }, (_, i) => ({ id: `H${i + 1}`, type: "premium", price: 200000 })) }
]

// Mock occupied seats
const occupiedSeats = ["A5", "A6", "B3", "B4", "C8", "C9", "D1", "D2", "E7", "E8", "F5", "F6", "G3", "G4", "H9", "H10"]

export default function SeatSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const date = searchParams.get('date') || movieData.date
  const time = searchParams.get('time') || movieData.time
  const hall = searchParams.get('hall') || movieData.hall
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId)
      } else {
        return [...prev, seatId]
      }
    })
  }

  const getSeatType = (seatId: string) => {
    const row = seatId[0]
    if (row === 'H') return 'premium'
    if (['E', 'F', 'G'].includes(row)) return 'vip'
    return 'standard'
  }

  const getSeatPrice = (seatId: string) => {
    const type = getSeatType(seatId)
    switch (type) {
      case 'premium': return 200000
      case 'vip': return 150000
      default: return 100000
    }
  }

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seatId) => total + getSeatPrice(seatId), 0)
  }

  const handleContinue = () => {
    if (selectedSeats.length > 0) {
      const seatIds = selectedSeats.join(',')
      const q = new URLSearchParams({
        movieId: movieId ?? '',
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
                Chọn ghế
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Movie Info - Moved to top right */}
            <Card className="lg:col-span-1 lg:order-2">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src={movieData.poster}
                    alt={movieData.title}
                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg mb-4"
                  />
                  <h2 className="text-xl font-bold mb-2">{movieData.title}</h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{hall}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Selection */}
            <Card className="lg:col-span-2 lg:order-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sofa className="h-5 w-5" />
                  Chọn ghế ngồi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Screen */}
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 py-4 px-8 rounded-lg mx-auto inline-block font-semibold">
                    MÀN HÌNH
                  </div>
                </div>

                {/* Seat Layout - centered grid */}
                <div className="space-y-4 flex flex-col items-center">
                  {seatLayout.map((row) => (
                    <div key={row.row} className="flex items-center gap-4">
                      <div className="w-8 text-center font-semibold text-foreground">
                        {row.row}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {row.seats.map((seat) => {
                          const isOccupied = occupiedSeats.includes(seat.id)
                          const isSelected = selectedSeats.includes(seat.id)
                          const seatType = getSeatType(seat.id)
                          
                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat.id, isOccupied)}
                              disabled={isOccupied}
                              className={`
                                w-8 h-8 rounded text-xs font-medium transition-all duration-200
                                ${isOccupied 
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                  : isSelected
                                    ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                                    : seatType === 'premium'
                                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-300 hover:to-yellow-400'
                                      : seatType === 'vip'
                                        ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-purple-900 hover:from-purple-300 hover:to-purple-400'
                                        : 'bg-gradient-to-br from-blue-400 to-blue-500 text-blue-900 hover:from-blue-300 hover:to-blue-400'
                                }
                                hover:scale-105 active:scale-95
                              `}
                            >
                              {seat.id.slice(1)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded"></div>
                    <span>Ghế thường</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded"></div>
                    <span>Ghế VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded"></div>
                    <span>Ghế Premium</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="lg:col-span-1 lg:order-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tóm tắt đặt vé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Ghế đã chọn</h4>
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSeats.map(seatId => (
                        <div key={seatId} className="flex justify-between items-center text-sm">
                          <span>Ghế {seatId}</span>
                          <span className="font-medium">{getSeatPrice(seatId).toLocaleString()}đ</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Chưa chọn ghế</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                  </div>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg"
                >
                  Tiếp tục thanh toán
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
