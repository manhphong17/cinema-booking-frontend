"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { HomeLayout } from "@/components/layouts/home-layout"
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  ShoppingCart, 
  Plus, 
  Minus,
  ArrowLeft,
  ArrowRight,
  Popcorn,
  Coffee,
  IceCream
} from "lucide-react"

const combos = [
  {
    id: "combo1",
    name: "Combo Standard",
    description: "1 bỏng ngô lớn + 2 nước ngọt",
    price: 85000,
    image: "/combo-standard.jpg",
    items: [
      { name: "Bỏng ngô lớn", quantity: 1 },
      { name: "Nước ngọt 500ml", quantity: 2 }
    ]
  },
  {
    id: "combo2",
    name: "Combo Premium",
    description: "1 bỏng ngô lớn + 2 nước ngọt + 1 hot dog",
    price: 120000,
    image: "/combo-premium.jpg",
    items: [
      { name: "Bỏng ngô lớn", quantity: 1 },
      { name: "Nước ngọt 500ml", quantity: 2 },
      { name: "Hot dog", quantity: 1 }
    ]
  },
  {
    id: "combo3",
    name: "Combo Family",
    description: "2 bỏng ngô lớn + 4 nước ngọt + 1 bánh mì kẹp",
    price: 180000,
    image: "/combo-family.jpg",
    items: [
      { name: "Bỏng ngô lớn", quantity: 2 },
      { name: "Nước ngọt 500ml", quantity: 4 },
      { name: "Bánh mì kẹp", quantity: 1 }
    ]
  },
  {
    id: "combo4",
    name: "Combo Sweet",
    description: "1 bỏng ngô ngọt + 2 nước ép + 1 kem",
    price: 95000,
    image: "/combo-sweet.jpg",
    items: [
      { name: "Bỏng ngô ngọt", quantity: 1 },
      { name: "Nước ép 350ml", quantity: 2 },
      { name: "Kem", quantity: 1 }
    ]
  }
]

const movies = [
  { id: 1, title: "Avengers: Endgame", poster: "/generic-superhero-team-poster.png" },
  { id: 2, title: "Spider-Man: No Way Home", poster: "/spiderman-no-way-home-movie-poster.jpg" },
  { id: 3, title: "The Batman", poster: "/images/posters/the-batman-poster.png" }
]

export default function ComboSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const movieId = searchParams.get('movieId')
  const showtimeId = searchParams.get('showtimeId')
  const seats = searchParams.get('seats')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const hall = searchParams.get('hall')
  const combosParam = searchParams.get('combos')

  const [selectedCombos, setSelectedCombos] = useState<{[key: string]: number}>({})
  const [countdown, setCountdown] = useState(300) // 5 minutes in seconds

  const movie = movies.find(m => m.id === parseInt(movieId || '1'))

  // Reset countdown when component mounts
  useEffect(() => {
    setCountdown(300) // Reset to 5 minutes
  }, [])

  // Initialize selectedCombos from URL parameters if they exist
  useEffect(() => {
    if (combosParam) {
      try {
        const parsedCombos = JSON.parse(combosParam)
        const comboMap: {[key: string]: number} = {}
        parsedCombos.forEach((combo: {comboId: string, quantity: number}) => {
          comboMap[combo.comboId] = combo.quantity
        })
        setSelectedCombos(comboMap)
      } catch (e) {
        console.error('Error parsing combos from URL:', e)
      }
    }
  }, [combosParam])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/booking')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const updateComboQuantity = (comboId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedCombos }
      delete newSelected[comboId]
      setSelectedCombos(newSelected)
    } else {
      setSelectedCombos(prev => ({ ...prev, [comboId]: quantity }))
    }
  }

  const getSeatTotal = () => {
    if (!seats) return 0
    return seats.split(',').reduce((total, seatId) => {
      const row = seatId[0]
      if (row === 'H') return total + 200000
      if (['E', 'F', 'G'].includes(row)) return total + 150000
      return total + 100000
    }, 0)
  }

  const getComboTotal = () => {
    return Object.entries(selectedCombos).reduce((total, [comboId, quantity]) => {
      const combo = combos.find(c => c.id === comboId)
      return total + (combo ? combo.price * quantity : 0)
    }, 0)
  }

  const getTotalPrice = () => {
    return getSeatTotal() + getComboTotal()
  }

  const getTotalItems = () => {
    return Object.values(selectedCombos).reduce((total, quantity) => total + quantity, 0)
  }

  const handleContinue = () => {
    const comboData = Object.entries(selectedCombos)
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
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-muted-foreground">Thêm đồ ăn và thức uống cho buổi xem phim</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Thời gian còn lại</div>
                <div className={`text-2xl font-bold ${countdown < 60 ? 'text-red-600' : 'text-primary'}`}>
                  {formatTime(countdown)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Combo Selection */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {combos.map((combo) => (
              <Card key={combo.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={combo.image || "/placeholder.svg"}
                    alt={combo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white">
                      {combo.price.toLocaleString('vi-VN')} VNĐ
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{combo.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{combo.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {combo.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateComboQuantity(combo.id, (selectedCombos[combo.id] || 0) - 1)}
                        disabled={!selectedCombos[combo.id]}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {selectedCombos[combo.id] || 0}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateComboQuantity(combo.id, (selectedCombos[combo.id] || 0) + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Tổng</div>
                      <div className="font-semibold">
                        {((selectedCombos[combo.id] || 0) * combo.price).toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Tóm tắt đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Movie Info */}
                  <div className="flex gap-3">
                    <img 
                      src={movie?.poster || "/placeholder.svg"} 
                      alt={movie?.title}
                      className="w-16 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{movie?.title}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hall}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Seats */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Ghế đã chọn</h4>
                    <div className="space-y-1">
                      {seats?.split(',').map(seatId => {
                        const getSeatType = (seatId: string) => {
                          const row = seatId[0]
                          if (row === 'H') return 'Premium'
                          if (['E', 'F', 'G'].includes(row)) return 'VIP'
                          return 'Thường'
                        }
                        const getSeatPrice = (seatId: string) => {
                          const row = seatId[0]
                          if (row === 'H') return 200000
                          if (['E', 'F', 'G'].includes(row)) return 150000
                          return 100000
                        }
                        return (
                          <div key={seatId} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span>Ghế {seatId}</span>
                              <Badge variant="outline" className="text-xs">
                                {getSeatType(seatId)}
                              </Badge>
                            </div>
                            <span className="font-medium">
                              {getSeatPrice(seatId).toLocaleString()}đ
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selected Combos */}
                  {Object.entries(selectedCombos).some(([_, qty]) => qty > 0) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Combo đã chọn</h4>
                      <div className="space-y-1">
                        {Object.entries(selectedCombos).map(([comboId, quantity]) => {
                          if (quantity === 0) return null
                          const combo = combos.find(c => c.id === comboId)
                          if (!combo) return null
                          return (
                            <div key={comboId} className="flex justify-between items-center text-sm">
                              <span>{combo.name} x{quantity}</span>
                              <span className="font-medium">{(combo.price * quantity).toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Seat Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>Ghế ngồi:</span>
                      <span>{getSeatTotal().toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    {getComboTotal() > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span>Combo:</span>
                        <span>{getComboTotal().toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">{getTotalPrice().toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  </div>
                </CardContent>

                  <Button
                      onClick={handleContinue}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold px-8 py-3 shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                  >
                      Tiếp tục thanh toán
                      <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
              </Card>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tổng combo</div>
                <div className="text-xl font-bold text-primary">
                  {getTotalPrice().toLocaleString('vi-VN')} VNĐ
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
