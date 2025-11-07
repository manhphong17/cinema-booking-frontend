"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart, Sparkles, Loader2, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/src/api/interceptor"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { jwtDecode } from "jwt-decode"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"
import Image from "next/image"

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
      {/* Custom Animations Styles */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      
      <div className="min-h-screen relative overflow-hidden bg-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Decorative Border Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="mb-12 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
          <div className="inline-block mb-4">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-3 py-1 bg-blue-50 rounded-md">
              Step 2.5
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Chọn Combo & Đồ Uống
              </span>
            </h1>
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700">Premium</span>
            </div>
          </div>
          <p className="text-lg text-gray-600 font-medium mt-3">
            Thêm đồ ăn và thức uống cho buổi xem phim của bạn ✨
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
            <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content - Combo Selection */}
          <div className="lg:col-span-3">
            <Card className="relative shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-500 overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-500/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
              
              {/* Border Glow */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/50 via-blue-500/50 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>

              <CardHeader className="relative bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200 pb-5">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-600 text-white shadow-2xl shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="h-7 w-7" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-600 opacity-50 blur-lg"></div>
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 via-blue-700 to-blue-700 bg-clip-text text-transparent">
                    Danh sách sản phẩm
                  </span>
                  {concessions.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 shadow-lg px-4 py-1.5">
                      <Sparkles className="w-3 h-3 mr-1.5 inline" />
                      {concessions.length} sản phẩm
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative">
                {loadingConcessions ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden animate-pulse bg-white border-2 border-gray-200">
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-100"></div>
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
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-6 border-4 border-blue-300 shadow-lg">
                      <ImageIcon className="w-16 h-16 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Không có sản phẩm</h3>
                    <p className="text-gray-600 max-w-md text-lg font-medium">
                      Hiện tại không có sản phẩm khả dụng. Vui lòng thử lại sau.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {concessions.map((item, index) => {
                      const quantity = selectedConcessions[item.concessionId.toString()] || 0
                      const isSelected = quantity > 0
                      
                      return (
                        <Card 
                          key={item.concessionId} 
                          className={`relative overflow-hidden transition-all duration-500 group cursor-pointer border-2 ${
                            isSelected 
                              ? 'border-blue-500 shadow-2xl shadow-blue-500/50 scale-[1.02] ring-4 ring-blue-300 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-300/30 bg-white hover:bg-blue-50/30'
                          } animate-fade-in-up`}
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          {/* Glow Effect */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-blue-500/30 to-blue-400/30 blur-2xl opacity-50 -z-10"></div>
                          )}

                          {/* Image Section */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b-2 border-gray-200">
                            {item.urlImage ? (
                              <>
                                <Image
                                  src={item.urlImage}
                                  alt={item.name}
                                  fill
                                  className="object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                                <ImageIcon className="w-16 h-16 text-blue-400" />
                              </div>
                            )}
                            
                            {/* Price Badge */}
                            <div className="absolute top-4 right-4 z-10 transform transition-all duration-300 group-hover:scale-110">
                              <Badge className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-500/50 border-2 border-blue-400 text-sm font-bold px-4 py-2">
                                {item.price.toLocaleString('vi-VN')} ₫
                              </Badge>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="absolute top-4 left-4 z-10 animate-bounce-subtle">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-2xl border-2 border-emerald-400 flex items-center gap-1.5 px-3 py-2">
                                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                                  <span className="font-bold">Đã chọn</span>
                                </Badge>
                              </div>
                            )}

                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                          </div>

                          <CardContent className="p-6 bg-white border-t-2 border-gray-200">
                            <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 line-clamp-2 min-h-[2.5rem]">
                              {item.description || "Sản phẩm chất lượng cao"}
                            </p>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between gap-4 pt-5 border-t-2 border-gray-200">
                              <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-2 border-2 border-blue-200 shadow-md">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateConcessionQuantity(item.concessionId.toString(), quantity - 1)
                                  }}
                                  disabled={quantity === 0}
                                  className="h-10 w-10 p-0 rounded-lg bg-white hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95 border-2 border-blue-300 shadow-sm"
                                >
                                  <Minus className="h-5 w-5" />
                                </Button>
                                <span className="w-14 text-center font-bold text-2xl text-blue-700 bg-white rounded-lg py-1 border-2 border-blue-300 shadow-sm">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateConcessionQuantity(item.concessionId.toString(), quantity + 1)
                                  }}
                                  className="h-10 w-10 p-0 rounded-lg bg-white hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95 border-2 border-blue-300 shadow-sm"
                                >
                                  <Plus className="h-5 w-5" />
                                </Button>
                              </div>
                              
                              {/* Total Price */}
                              {quantity > 0 && (
                                <div className="text-right bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl p-3 border-2 border-blue-200 shadow-md">
                                  <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide font-semibold">Tổng</div>
                                  <div className="font-bold text-2xl text-blue-600">
                                    {(quantity * item.price).toLocaleString('vi-VN')} ₫
                                  </div>
                                </div>
                              )}
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
              onSeatHoldExpired={(handler) => {
                bookingExpiredHandlerRef.current = handler
              }}
              actionButton={
                <Button
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  size="lg"
                  className="relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold px-8 py-7 shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/70 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg overflow-hidden group"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>

                  <span className="relative z-10 flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                        Tiếp tục thanh toán →
                      </>
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

