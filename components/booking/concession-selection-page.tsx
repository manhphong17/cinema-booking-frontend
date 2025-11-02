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
              onSeatHoldExpired={(handler) => {
                bookingExpiredHandlerRef.current = handler
              }}
              actionButton={
                <Button
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold px-8 py-3 shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

