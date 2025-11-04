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
      
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="mb-12 space-y-6">
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="relative">
              <div className="w-2 h-16 bg-gradient-to-b from-primary via-purple-500 to-pink-500 rounded-full shadow-lg shadow-primary/50"></div>
              <div className="absolute inset-0 w-2 h-16 bg-gradient-to-b from-primary via-purple-500 to-pink-500 rounded-full blur-md opacity-50 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-primary via-purple-400 via-pink-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Chọn Combo & Đồ Uống
                </h1>
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 backdrop-blur-sm border border-primary/30">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary">Premium</span>
                </div>
              </div>
              <p className="text-slate-300 mt-3 text-lg md:text-xl font-medium">
                Thêm đồ ăn và thức uống cho buổi xem phim của bạn ✨
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content - Combo Selection */}
          <div className="lg:col-span-3">
            <Card className="relative shadow-2xl border-0 bg-white/10 backdrop-blur-xl hover:bg-white/15 transition-all duration-500 overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
              
              {/* Border Glow */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>

              <CardHeader className="relative bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border-b border-white/20 pb-5">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 text-white shadow-2xl shadow-primary/50 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="h-7 w-7" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 opacity-50 blur-lg"></div>
                  </div>
                  <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
                    Danh sách sản phẩm
                  </span>
                  {concessions.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-white/20 backdrop-blur-sm text-white border-white/30 shadow-lg px-4 py-1.5">
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
                      <Card key={i} className="overflow-hidden animate-pulse bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="aspect-[4/3] bg-gradient-to-br from-white/10 to-white/5"></div>
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-white/10 rounded w-3/4"></div>
                          <div className="h-3 bg-white/10 rounded w-full"></div>
                          <div className="h-3 bg-white/10 rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : concessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 animate-pulse">
                      <ImageIcon className="w-16 h-16 text-white/60" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-2xl"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Không có sản phẩm</h3>
                    <p className="text-white/70 max-w-md text-lg">
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
                          className={`relative overflow-hidden transition-all duration-500 group cursor-pointer border-2 backdrop-blur-xl ${
                            isSelected 
                              ? 'border-primary/80 shadow-2xl shadow-primary/50 scale-[1.02] ring-4 ring-primary/30 bg-white/20' 
                              : 'border-white/20 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/30 bg-white/10 hover:bg-white/15'
                          } animate-fade-in-up`}
                          style={{ 
                            animationDelay: `${index * 100}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          {/* Glow Effect */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 blur-2xl opacity-50 -z-10"></div>
                          )}

                          {/* Image Section */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
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
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                                <ImageIcon className="w-16 h-16 text-white/50" />
                              </div>
                            )}
                            
                            {/* Price Badge */}
                            <div className="absolute top-4 right-4 z-10 transform transition-all duration-300 group-hover:scale-110">
                              <Badge className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white shadow-2xl shadow-primary/50 border-0 text-sm font-bold px-4 py-1.5 backdrop-blur-sm">
                                {item.price.toLocaleString('vi-VN')} ₫
                              </Badge>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="absolute top-4 left-4 z-10 animate-bounce-subtle">
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl border-0 flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm">
                                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                                  Đã chọn
                                </Badge>
                              </div>
                            )}

                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                          </div>

                          <CardContent className="p-6 bg-white/10 backdrop-blur-sm border-t border-white/20">
                            <h3 className="font-bold text-xl mb-3 text-white group-hover:text-primary transition-colors line-clamp-2 drop-shadow-lg">
                              {item.name}
                            </h3>
                            <p className="text-sm text-white/70 mb-5 line-clamp-2 min-h-[2.5rem]">
                              {item.description || "Sản phẩm chất lượng cao"}
                            </p>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between gap-4 pt-5 border-t border-white/20">
                              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1.5 border border-white/20">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateConcessionQuantity(item.concessionId.toString(), quantity - 1)
                                  }}
                                  disabled={quantity === 0}
                                  className="h-9 w-9 p-0 rounded-lg hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-bold text-xl text-white drop-shadow-lg">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateConcessionQuantity(item.concessionId.toString(), quantity + 1)
                                  }}
                                  className="h-9 w-9 p-0 rounded-lg hover:bg-primary hover:text-white transition-all hover:scale-110 active:scale-95"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Total Price */}
                              {quantity > 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-white/60 mb-1 uppercase tracking-wide">Tổng</div>
                                  <div className="font-bold text-xl text-primary drop-shadow-lg">
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
                  className="relative w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-500 hover:to-pink-500 text-white font-bold px-8 py-7 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg overflow-hidden group"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                  
                  <span className="relative z-10 flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                        Tiếp tục thanh toán
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

