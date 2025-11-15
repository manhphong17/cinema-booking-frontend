"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {ArrowLeft, Calendar, Clock, CreditCard, Crown, MapPin, Sofa, Users, ShoppingCart, Ticket} from "lucide-react"
import {ReactNode, useEffect, useState, useRef, useCallback, useMemo} from "react"
import {useRouter} from "next/navigation"
import {apiClient} from "@/src/api/interceptor"
import {toast} from "sonner"

export type SeatInfo = {
  id: string
  type: string
  price: number
}

export type ConcessionInfo = {
  id: string | number
  name: string
  quantity: number
  price: number
}

export type MovieInfo = {
  title?: string
  poster?: string
  date?: string
  time?: string
  hall?: string
}

type BookingOrderSummaryProps = {
  // Movie info
  movieInfo?: MovieInfo

  // Seats
  seats?: SeatInfo[]
  seatsTotal?: number

  // Concessions (optional)
  concessions?: ConcessionInfo[]
  concessionsTotal?: number

  // Pricing
  total: number
  discount?: number
  earnedPoints?: number

  // Countdown - có thể truyền trực tiếp hoặc để component tự quản lý
  countdown?: number // Nếu truyền, sẽ dùng giá trị này (manual mode)

  // Props để component tự quản lý countdown (auto mode)
  showtimeId?: number | null
  userId?: number | null
  movieId?: string | null
  onCountdownExpire?: () => void

  // Trigger để sync TTL ngay khi user chọn ghế (từ component cha)
  triggerSync?: number | null

  // Action button (optional)
  actionButton?: ReactNode

  // Custom title
  title?: string
  showSeatTypeStats?: boolean // Hiển thị thống kê ghế thường/VIP (chỉ dùng ở seat selection)
  
  // Tab navigation (for staff)
  onTabChange?: (tab: string) => void
}

export default function BookingOrderSummary({
  movieInfo,
  seats = [],
  seatsTotal,
  concessions = [],
  concessionsTotal = 0,
  total,
  discount = 0,
  earnedPoints =0,
  countdown: externalCountdown,
  showtimeId,
  userId,
  movieId,
  onCountdownExpire,
  actionButton,
  title = "Tóm tắt đơn hàng",
  showSeatTypeStats = false,
  triggerSync,
  onTabChange
}: BookingOrderSummaryProps) {
  const router = useRouter()
  // Khởi tạo countdown = 0, chỉ hiển thị khi có TTL từ backend (> 0)
  const [internalCountdown, setInternalCountdown] = useState(0)
  const [hasTTLFromBackend, setHasTTLFromBackend] = useState(false) // Flag để biết đã có TTL từ backend chưa
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref để lưu timeout cho retry
  const hasRedirectedRef = useRef(false) // Flag để tránh redirect nhiều lần
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null) // Ref để lưu countdown interval

  // Reset hasRedirectedRef khi showtimeId hoặc movieId thay đổi
  useEffect(() => {
    hasRedirectedRef.current = false
  }, [showtimeId, movieId])

  // Cleanup tất cả timers khi component unmount
  useEffect(() => {
    return () => {
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [])

  const isAutoMode = externalCountdown === undefined && showtimeId && userId

  const countdown = useMemo(() => {
    if (isAutoMode) {
      if (hasTTLFromBackend && internalCountdown > 0) {
        return internalCountdown
      }
      return undefined
    }
    return externalCountdown ?? undefined
  }, [isAutoMode, hasTTLFromBackend, internalCountdown, externalCountdown])

  // Function để xử lý khi countdown hết hạn
  const handleCountdownExpire = useCallback(() => {
    if (hasRedirectedRef.current) return // Tránh redirect nhiều lần
    hasRedirectedRef.current = true

    // Xóa sessionStorage
    if (showtimeId && userId) {
      const storageKey = movieId 
        ? `booking_timer_${movieId}_${showtimeId}`
        : `booking_timer_${showtimeId}_${userId}`
      sessionStorage.removeItem(storageKey)
    }

    // Gọi callback nếu có
    if (onCountdownExpire) {
      onCountdownExpire()
    }

    // Redirect về home trước
    router.push('/home')

    // Hiển thị toast thông báo sau khi redirect
    setTimeout(() => {
      toast.error("⏰ Hết thời gian giữ ghế. Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế.")
    }, 100) // Đợi một chút để trang home load xong
  }, [onCountdownExpire, router, movieId, showtimeId, userId])

  // Auto mode: Sync countdown with backend TTL
  useEffect(() => {
    if (!isAutoMode) {
      // Reset state khi không ở auto mode
      setHasTTLFromBackend(false)
      setInternalCountdown(0)
      return
    }

    // Tạo storageKey: ưu tiên dùng movieId nếu có, nếu không thì dùng userId
    const storageKey = movieId 
      ? `booking_timer_${movieId}_${showtimeId}`
      : `booking_timer_${showtimeId}_${userId}`
    
    const savedExpireTime = sessionStorage.getItem(storageKey)
    if (savedExpireTime) {
      const expireTime = parseInt(savedExpireTime)
      if (expireTime <= Date.now()) {
        sessionStorage.removeItem(storageKey)
      }
    }
    
    let isSyncInProgress = false // Flag để tránh duplicate calls

    async function syncTTLFromBackend() {
        if (isSyncInProgress) return

      isSyncInProgress = true
      try {
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`,
          { timeout: 30000 }
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)

          if (backendTTL > 0) {
            setInternalCountdown(backendTTL)
            setHasTTLFromBackend(true)
            const currentTime = Date.now()
            const expireTime = currentTime + backendTTL * 1000
            sessionStorage.setItem(storageKey, expireTime.toString())
          } else {
            // Khi backend trả về TTL = 0 (không còn ghế được giữ), kiểm tra sessionStorage trước
            const savedExpireTime = sessionStorage.getItem(storageKey)
            if (savedExpireTime) {
              const expireTime = parseInt(savedExpireTime)
              const currentTime = Date.now()
              const remaining = Math.max(0, Math.floor((expireTime - currentTime) / 1000))
              
              if (remaining > 0) {
                // Vẫn còn thời gian trong sessionStorage, tiếp tục dùng
                setInternalCountdown(remaining)
                setHasTTLFromBackend(true)
              } else {
                // Thời gian đã hết, xóa và expire
                sessionStorage.removeItem(storageKey)
                setInternalCountdown(0)
                setHasTTLFromBackend(false)
                handleCountdownExpire()
              }
            } else {
              // Không có sessionStorage, reset về 0
              setInternalCountdown(0)
              setHasTTLFromBackend(false)
            }
          }
        }
      } catch (error: any) {
        console.error('[BookingOrderSummary] Error fetching TTL:', error)
        const savedExpireTime = sessionStorage.getItem(storageKey)
        if (savedExpireTime) {
          const expireTime = parseInt(savedExpireTime)
          const currentTime = Date.now()
          const remaining = Math.max(0, Math.floor((expireTime - currentTime) / 1000))
          if (remaining > 0) {
            setInternalCountdown(remaining)
            setHasTTLFromBackend(true)
          } else {
            sessionStorage.removeItem(storageKey)
            setInternalCountdown(0)
            setHasTTLFromBackend(false)
          }
        } else {
          setInternalCountdown(0)
          setHasTTLFromBackend(false)
        }
      } finally {
        isSyncInProgress = false
      }
    }

    syncTTLFromBackend()

    return () => {
      isSyncInProgress = false
    }
  }, [isAutoMode, showtimeId, userId, movieId, triggerSync, handleCountdownExpire])

  // Trigger sync ngay khi user chọn ghế (triggerSync thay đổi)
  useEffect(() => {
    if (!isAutoMode || !triggerSync) return

    // Clear timeout cũ nếu có
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    const storageKey = movieId 
      ? `booking_timer_${movieId}_${showtimeId}`
      : `booking_timer_${showtimeId}_${userId}`
    let retryCount = 0
    const maxRetries = 5

    const syncTTL = async () => {
      try {
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`,
          { timeout: 30000 }
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)
          if (backendTTL > 0) {
            setInternalCountdown(backendTTL)
            setHasTTLFromBackend(true)
            const currentTime = Date.now()
            const expireTime = currentTime + backendTTL * 1000
            sessionStorage.setItem(storageKey, expireTime.toString())
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current)
              retryTimeoutRef.current = null
            }
            return
          } else {
            // Khi backend trả về TTL = 0, kiểm tra sessionStorage trước
            const savedExpireTime = sessionStorage.getItem(storageKey)
            if (savedExpireTime) {
              const expireTime = parseInt(savedExpireTime)
              const currentTime = Date.now()
              const remaining = Math.max(0, Math.floor((expireTime - currentTime) / 1000))
              
              if (remaining > 0) {
                // Vẫn còn thời gian trong sessionStorage, tiếp tục dùng
                setInternalCountdown(remaining)
                setHasTTLFromBackend(true)
                if (retryTimeoutRef.current) {
                  clearTimeout(retryTimeoutRef.current)
                  retryTimeoutRef.current = null
                }
                return
              }
            }
            // Không có TTL từ backend và không có thời gian trong sessionStorage, retry
            if (retryCount < maxRetries) {
              retryCount++
              retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)
            }
          }
        }
      } catch (error: any) {
        console.error('[BookingOrderSummary] Error in trigger sync:', error)
        if (retryCount < maxRetries) {
          retryCount++
          retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)
        }
      }
    }

    retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)

    // Cleanup: clear timeout khi component unmount hoặc dependencies thay đổi
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [triggerSync, isAutoMode, showtimeId, userId, movieId])

  useEffect(() => {
    if (!isAutoMode || internalCountdown <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      return
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    const timer = setInterval(() => {
      setInternalCountdown(prev => {
        const newValue = Math.max(0, prev - 1)
        if (newValue <= 0) {
          setHasTTLFromBackend(false)
          handleCountdownExpire()
        }
        return newValue
      })
    }, 1000)

    countdownIntervalRef.current = timer
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [isAutoMode, internalCountdown, handleCountdownExpire])

  useEffect(() => {
    if (isAutoMode || externalCountdown === undefined || externalCountdown > 0) return
    if (externalCountdown === 0 && !hasRedirectedRef.current) {
      handleCountdownExpire()
    }
  }, [isAutoMode, externalCountdown, handleCountdownExpire])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }


  return (
    <Card className="shadow-2xl border-2 border-primary/40 bg-white hover:shadow-primary/20 transition-all duration-300">
        <CardHeader className="pb-2 px-6 pt-4">
            <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-6 w-6" />
                <span className="text-xl font-semibold">{title}</span>
            </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">

           {/* 🎬 Movie Info */}
           {movieInfo && (
               <div className="flex items-center gap-4 -mt-4 mb-4">
                   <img
                       src={movieInfo.poster || "/placeholder.svg"}
                       alt={movieInfo.title || "Movie"}
                       className="w-20 h-24 object-cover rounded-md border border-gray-200 shadow-md"
                   />
                   <div className="flex-1">
                       <h3 className="font-semibold text-gray-900 mb-2">{movieInfo.title}</h3>
                       <div className="space-y-1 text-sm text-gray-600">
                           {movieInfo.date && (
                               <div className="flex items-center gap-1">
                                   <Calendar className="h-4 w-4 text-gray-600" />
                                   {movieInfo.date}
                               </div>
                           )}
                           {movieInfo.time && (
                               <div className="flex items-center gap-1">
                                   <Clock className="h-4 w-4 text-gray-600" />
                                   {movieInfo.time}
                               </div>
                           )}
                           {movieInfo.hall && (
                               <div className="flex items-center gap-1">
                                   <MapPin className="h-4 w-4 text-gray-600" />
                                   {movieInfo.hall}
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}

           {/* 🪑 Seats */}
           {seats.length > 0 && (
               <div>
                   <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                       <Users className="h-5 w-5 text-gray-700" />
                       Ghế đã chọn ({seats.length})
                   </h4>
                   <div className="space-y-3">
                       {seats.map((seat) => (
                           <div
                               key={seat.id}
                               className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-sm transition"
                           >
                               <div className="flex items-center gap-2">
                                   <Sofa className="h-4 w-4 text-gray-700" />
                                   <span className="font-medium text-gray-800">Ghế {seat.id}</span>
                                   <Badge
                                       variant="outline"
                                       className={`text-xs capitalize ${
                                         seat.type === 'vip' || seat.type === 'VIP'
                                           ? 'border border-violet-400 bg-violet-50 text-violet-700'
                                           : 'border border-gray-300 bg-gray-50 text-gray-700'
                                       }`}
                                   >
                                       {seat.type === 'vip' ? 'VIP' : seat.type === 'standard' ? 'Thường' : seat.type}
                                   </Badge>
                               </div>
                               <span className="font-semibold text-gray-900">
            {seat.price.toLocaleString()}đ
          </span>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {/* 🍿 Concessions */}
           {concessions.length > 0 && (
               <div>
                   <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                       <Users className="h-5 w-5 text-indigo-500" />
                       Sản phẩm đã chọn ({concessions.length})
                   </h4>
                   <div className="space-y-2">
                       {concessions.map((item) => (
                           <div
                               key={item.id}
                               className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 hover:shadow-sm transition"
                           >
          <span className="font-medium text-gray-800">
            {item.name} x{item.quantity}
          </span>
                               <span className="font-semibold text-gray-900">
            {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
          </span>
                           </div>
                       ))}
                   </div>
               </div>
           )}


           {/* Countdown Timer - chỉ hiển thị khi có countdown */}
        {countdown !== undefined && countdown > 0 && (
          <div className="rounded-lg p-4 border-2 shadow-lg bg-gray-50 border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-700" />
                <span className="text-sm font-bold text-gray-700">Thời gian còn lại:</span>
              </div>
              <span className={`font-bold text-xl ${
                countdown <= 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'
              }`}>
                {formatTime(countdown)}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 ${
              countdown <= 300 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {countdown <= 300 ? '⚠️ Hãy hoàn tất đặt vé sớm!' :
               countdown <= 600 ? '⏰ Thời gian sắp hết!' : '✓ Bạn có đủ thời gian'}
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="border-2 border-gray-300 pt-4 space-y-3 bg-gray-50 rounded-lg p-4">
          {seatsTotal !== undefined && seatsTotal > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground font-medium">Ghế ngồi:</span>
              <span className="font-semibold text-foreground">{seatsTotal.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}

          {concessionsTotal > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground font-medium">Đồ ăn kèm:</span>
              <span className="font-semibold text-foreground">{concessionsTotal.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}

            {discount > 0 && (
                <>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-red-600">Giảm giá:</span>
                        <span className="font-semibold text-red-600">-{discount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right italic">
                        * Áp dụng từ điểm thành viên của bạn
                    </p>
                </>
            )}

            { earnedPoints > 0 && (
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium ">Điểm thành viên nhận được:</span>
                    <span className="font-semibold ">+{earnedPoints} điểm</span>
                </div>
            )}


            <div className="flex justify-between items-center text-sm bg-gray-100 rounded-lg p-2 border-2 border-gray-300">
            <span className="font-medium text-gray-900">Tổng cộng:</span>
            <span className="font-bold text-xl text-gray-900">{total.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        {/* Action Button */}
        {actionButton && (
          <div className="pt-4">
            {actionButton}
          </div>
        )}

        {/* Tab Navigation Buttons (for staff) */}
        {onTabChange && (
          <div className="pt-4 border-t border-gray-200 space-y-2">
            {seats.length === 0 && (
              <Button
                onClick={() => onTabChange("tickets")}
                className="w-full"
                size="lg"
                variant="outline"
                style={{ borderColor: "#38AAEC", color: "#38AAEC" }}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Chọn suất chiếu
              </Button>
            )}
            {seats.length > 0 && concessions.length === 0 && (
              <Button
                onClick={() => onTabChange("concessions")}
                className="w-full"
                size="lg"
                variant="outline"
                style={{ borderColor: "#38AAEC", color: "#38AAEC" }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Chọn bắp nước
              </Button>
            )}
            {(seats.length > 0 || concessions.length > 0) && (
              <Button
                onClick={() => onTabChange("payment")}
                className="w-full"
                size="lg"
                style={{ backgroundColor: "#38AAEC" }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Chuyển đến thanh toán
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

