"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { apiClient } from "@/src/api/interceptor"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { jwtDecode } from "jwt-decode"

type ConcessionSelectionPageProps = {
  movieId: string | null
  seats: string | null
  date: string | null
  time: string | null
  hall: string | null
  showtimeId: string | null
}

export default function ConcessionSelectionPage({ 
  movieId,
  seats,
  date,
  time,
  hall,
  showtimeId
}: ConcessionSelectionPageProps) {
  const router = useRouter()

  // Concessions
  const [concessions, setConcessions] = useState<any[]>([])
  const [loadingConcessions, setLoadingConcessions] = useState(false)
  const [selectedConcessions, setSelectedConcessions] = useState<{[key: string]: number}>({})
  const [userId, setUserId] = useState<number | null>(null)

  // Get userId from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error('[Concession Selection] Error decoding token:', error)
    }
  }, [])

  // Fetch concessions
  useEffect(() => {
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
  }, [])

  // Helper functions
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
    // Use hardcoded prices based on row
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
    if (!seats) return []
    return seats.split(',').map(seatId => {
      const trimmedSeatId = seatId.trim()
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
  }, [seats])

  const concessionsInfo: ConcessionInfo[] = useMemo(() => {
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
  }, [selectedConcessions, concessions])

  const movieInfo: MovieInfo | undefined = useMemo(() => {
    // Chỉ hiển thị thông tin có sẵn từ URL params, không cần fetch movie
    if (!date && !time && !hall) return undefined
    return {
      date: date || undefined,
      time: time || undefined,
      hall: hall || undefined
    }
  }, [date, time, hall])

  const handleContinue = () => {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
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
        </div>
      </div>
    </div>
  )
}

