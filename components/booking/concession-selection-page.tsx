"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart, Loader2, Image as ImageIcon } from "lucide-react"
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
  
  // WebSocket connection
  const { isConnected } = useSeatWebSocket(
    showtimeId ? parseInt(showtimeId) : null,
    userId,
    !!(showtimeId && userId) // Enable WebSocket nếu có showtimeId và userId
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


    const seat = seatData.find(ticket => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx)
      const seatNumber = ticket.columnInx + 1
      const expectedSeatId = `${rowLabel}${seatNumber}`
      return expectedSeatId === seatId
    })

    return seat ? seat.ticketPrice : 100000
  }

  const getSeatType = (seatId: string): 'standard' | 'vip' | 'premium' => {
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
        title: " Lỗi",
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
          router.push(`/booking/payment?showtimeId=${showtimeId}`)
      } else {
        toast({
          title: " Lỗi",
          description: "Không thể thêm sản phẩm vào đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding concessions to order session:", error)
      toast({
        title: " Lỗi",
        description: "Không thể thêm sản phẩm vào đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-white">

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content - Combo Selection */}
          <div className="lg:col-span-3">
            <Card className="shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <ShoppingCart className="h-5 w-5" />
                  Chọn sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative">
                {loadingConcessions ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden bg-white border-2 border-gray-200">
                        <div className="aspect-[4/3] bg-gray-200"></div>
                        <CardContent className="p-6 space-y-3">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : concessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="relative w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center mb-6 border-4 border-blue-300 shadow-lg">
                      <ImageIcon className="w-16 h-16 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Không có sản phẩm</h3>
                    <p className="text-gray-600 max-w-md text-lg font-medium">
                      Hiện tại không có sản phẩm khả dụng. Vui lòng thử lại sau.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {concessions.map((item) => {
                      const quantity = selectedConcessions[item.concessionId.toString()] || 0
                      
                      return (
                        <Card 
                          key={item.concessionId} 
                          className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center">
                            {item.urlImage ? (
                              <img
                                  src={item.urlImage}
                                  alt={item.name}
                                className="max-w-full max-h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <ImageIcon className="w-16 h-16 text-gray-400" />
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-blue-600 text-white">
                                {item.price.toLocaleString('vi-VN')} ₫
                              </Badge>
                            </div>
                              </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{item.description || "Không có mô tả"}</p>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateConcessionQuantity(item.concessionId.toString(), quantity - 1)}
                                  disabled={quantity === 0}
                                  className="w-8 h-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-semibold">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateConcessionQuantity(item.concessionId.toString(), quantity + 1)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                                <div className="text-right">
                                <div className="text-sm text-gray-500">Tổng</div>
                                <div className="font-semibold text-blue-600">
                                    {(quantity * item.price).toLocaleString('vi-VN')} ₫
                                  </div>
                                </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
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
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-7 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <span className="flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Tiếp tục thanh toán →"
                    )}
                  </span>
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

