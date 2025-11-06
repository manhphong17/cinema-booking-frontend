"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/src/api/interceptor"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { jwtDecode } from "jwt-decode"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Seat data
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)

  const { toast } = useToast()
  const bookingExpiredHandlerRef = useRef<(() => void) | null>(null)
  
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
  
  // Callback khi seat hold hết hạn từ Redis notification (qua WebSocket)
  const handleSeatHoldExpired = useCallback(() => {
    if (userId && showtimeId) {
      console.log('[ConcessionSelection] Seat hold expired via Redis notification')
      
      // Hiển thị toast thông báo cho user
      toast({
        title: "⏰ Hết thời gian giữ ghế",
        description: "Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế.",
        variant: "destructive",
      })
      
      // Redirect về home sau khi hiển thị toast
      setTimeout(() => {
        router.push('/home')
      }, 3000)
    }
  }, [userId, showtimeId, router, toast])
  
  // Callback để truyền vào BookingOrderSummary
  const handleBookingExpired = useCallback(() => {
    if (bookingExpiredHandlerRef.current) {
      bookingExpiredHandlerRef.current()
    }
    handleSeatHoldExpired()
  }, [handleSeatHoldExpired])
  
  // WebSocket connection để nhận EXPIRED message từ Redis
  const { isConnected } = useSeatWebSocket(
    showtimeId ? parseInt(showtimeId) : null,
    userId,
    !!(showtimeId && userId), // Enable WebSocket nếu có showtimeId và userId
    handleSeatHoldExpired
  )

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

  // Fetch seat data
  useEffect(() => {
    const fetchSeatData = async () => {
      if (!showtimeId) return

      try {
        setLoadingSeats(true)
        const response = await apiClient.get<ShowtimeSeatResponse>(
          `/bookings/show-times/${showtimeId}/seats`
        )

        if (response.data?.status === 200 && response.data?.data?.length > 0) {
          const data = response.data.data[0]
          setSeatData(data.ticketResponses)
        }
      } catch (error) {
        console.error("Error fetching seat data:", error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeatData()
  }, [showtimeId])

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
    if (seatData.length === 0) {
      // Fallback to hardcoded prices if seat data not loaded yet
      const row = seatId[0]
      if (row === 'H') return 200000
      if (['E', 'F', 'G'].includes(row)) return 150000
      return 100000
    }

    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.ticketPrice : 100000
  }

  const getSeatType = (seatId: string): 'standard' | 'vip' | 'premium' => {
    if (seatData.length === 0) {
      // Fallback to hardcoded type if seat data not loaded yet
      const row = seatId[0]
      if (row === 'H') return 'premium'
      if (['E', 'F', 'G'].includes(row)) return 'vip'
      return 'standard'
    }

    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    if (!seat) return 'standard'
    
    const seatTypeLower = seat.seatType.toLowerCase()
    if (seatTypeLower === 'vip') return 'vip'
    if (seatTypeLower === 'premium') return 'premium'
    return 'standard'
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
      return { 
        id: trimmedSeatId, 
        type: getSeatType(trimmedSeatId), 
        price: getSeatPrice(trimmedSeatId) 
      }
    })
  }, [seats, seatData])

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

  const handleContinue = async () => {
    if (!showtimeId || !userId) {
      toast({
        title: "❌ Lỗi",
        description: "Thông tin đặt vé không hợp lệ",
        variant: "destructive",
      })
      return
    }

    if (isSubmitting) return // Prevent multiple submissions

    try {
      setIsSubmitting(true)
      
      // Prepare concession data
      const concessions = Object.entries(selectedConcessions)
        .map(([comboId, quantity]) => ({ 
          comboId: parseInt(comboId), 
          quantity 
        }))
        .filter(item => item.quantity > 0)

      // Call API to add concessions to order session
      const response = await apiClient.post("/bookings/order-session/concessions", {
        showtimeId: parseInt(showtimeId),
        userId: userId,
        concessions: concessions
      })

      if (response.data?.status === 200) {
        // Navigate to payment page
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
      } else {
        toast({
          title: "❌ Lỗi",
          description: "Không thể thêm sản phẩm vào đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding concessions to order session:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể thêm sản phẩm vào đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Chọn Combo & Đồ Uống
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full"></div>
          <p className="text-muted-foreground mt-4 text-lg">Thêm đồ ăn và thức uống cho buổi xem phim của bạn</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="shadow-2xl border-2 border-primary/20 bg-white/80 backdrop-blur-sm hover:shadow-primary/30 transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-b-2 border-primary/30">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Chọn sản phẩm
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loadingConcessions ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium">Đang tải danh sách sản phẩm...</p>
                      </div>
                    </div>
                  ) : concessions.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground text-lg">Không có sản phẩm khả dụng</p>
                    </div>
                  ) : (
                    concessions.map((item, index) => {
                      const quantity = selectedConcessions[item.concessionId.toString()] || 0
                      const isSelected = quantity > 0
                      
                      return (
                        <Card 
                          key={item.concessionId} 
                          className={`overflow-hidden transition-all duration-300 group border-2 animate-in fade-in slide-in-from-bottom-4 ${
                            isSelected 
                              ? 'border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 to-purple-50/50 ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]'
                          }`}
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          {/* Image Container with Gradient Overlay */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
                            <img
                              src={item.urlImage || "/placeholder.svg"}
                              alt={item.name}
                              className="max-w-full max-h-full object-contain rounded-md transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Price Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg border-0 px-3 py-1 text-sm font-semibold">
                                {item.price.toLocaleString('vi-VN')} ₫
                              </Badge>
                            </div>
                            
                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg border-0 px-3 py-1 text-sm font-semibold animate-pulse">
                                  Đã chọn: {quantity}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <CardContent className="p-5 bg-white">
                            <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {item.description || "Không có mô tả"}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateConcessionQuantity(item.concessionId.toString(), quantity - 1)}
                                  disabled={quantity === 0}
                                  className={`w-9 h-9 p-0 rounded-full border-2 transition-all duration-200 ${
                                    quantity === 0
                                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                      : 'border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95'
                                  }`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className={`w-10 text-center font-bold text-lg ${
                                  isSelected ? 'text-primary' : 'text-gray-600'
                                }`}>
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateConcessionQuantity(item.concessionId.toString(), quantity + 1)}
                                  className="w-9 h-9 p-0 rounded-full border-2 border-primary/30 text-primary hover:bg-gradient-to-r hover:from-primary hover:to-purple-600 hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Total Price */}
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Tổng</div>
                                <div className={`font-bold text-base ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent' 
                                    : 'text-gray-600'
                                }`}>
                                  {(quantity * item.price).toLocaleString('vi-VN')} ₫
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
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
              onSeatHoldExpired={(handler) => {
                bookingExpiredHandlerRef.current = handler
              }}
              actionButton={
                <Button
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-purple-600 hover:via-pink-600 hover:to-primary text-white font-bold px-8 py-4 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Tiếp tục thanh toán
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

