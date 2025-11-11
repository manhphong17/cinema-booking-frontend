"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Calendar, Clock, CreditCard, Crown, MapPin, Sofa, Users} from "lucide-react"
import {ReactNode, useEffect, useState, useRef, useCallback, useMemo} from "react"
import {useRouter} from "next/navigation"
import {apiClient} from "@/src/api/interceptor"
import {useToast} from "@/hooks/use-toast"

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
  triggerSync
}: BookingOrderSummaryProps) {
  const router = useRouter()
  const { toast } = useToast()
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

  // Determine if we're in auto mode (manage countdown internally) or manual mode (use external countdown)
  // Auto mode: tự động lấy TTL từ backend khi có đủ showtimeId và userId
  // movieId chỉ dùng cho storageKey, không bắt buộc
  const isAutoMode = externalCountdown === undefined && showtimeId && userId

  // Debug log
  useEffect(() => {
    if (isAutoMode) {
      console.log('[BookingOrderSummary] Auto mode enabled:', { showtimeId, userId, movieId })
    } else {
      console.log('[BookingOrderSummary] Auto mode disabled:', {
        externalCountdown,
        showtimeId,
        userId,
        movieId
      })
    }
  }, [isAutoMode, showtimeId, userId, movieId, externalCountdown])

  // Countdown chỉ hiển thị khi:
  // - Manual mode: có externalCountdown
  // - Auto mode: đã có TTL từ backend (hasTTLFromBackend = true và internalCountdown > 0)
  const countdown = useMemo(() => {
    if (isAutoMode) {
      // Auto mode: chỉ hiển thị khi đã có TTL từ backend và countdown > 0
      if (hasTTLFromBackend && internalCountdown > 0) {
        return internalCountdown
      }
      return undefined
    } else {
      // Manual mode: dùng externalCountdown nếu có
      return externalCountdown ?? undefined
    }
  }, [isAutoMode, hasTTLFromBackend, internalCountdown, externalCountdown])

  // Debug log để kiểm tra countdown
  useEffect(() => {
    console.log('[BookingOrderSummary] Countdown state:', {
      isAutoMode,
      hasTTLFromBackend,
      internalCountdown,
      externalCountdown,
      countdown,
      showtimeId,
      userId,
      movieId
    })
  }, [isAutoMode, hasTTLFromBackend, internalCountdown, externalCountdown, countdown, showtimeId, userId, movieId])

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
      toast({
        title: "⏰ Hết thời gian giữ ghế",
        description: "Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế.",
        variant: "destructive",
      })
    }, 100) // Đợi một chút để trang home load xong
  }, [toast, onCountdownExpire, router, movieId, showtimeId, userId])

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
    let isSyncInProgress = false // Flag để tránh duplicate calls

    async function syncTTLFromBackend() {
      // Tránh sync nếu đang có request đang chạy (debounce)
      if (isSyncInProgress) {
        console.log('[BookingOrderSummary] Sync already in progress, skipping')
        return
      }

      console.log('[BookingOrderSummary] Starting TTL sync for:', { showtimeId, userId, movieId })

      isSyncInProgress = true
      try {
        // Tăng timeout cho request TTL vì có thể backend xử lý chậm
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`,
          { timeout: 30000 } // 30 giây cho request này
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)
          console.log('[BookingOrderSummary] Backend TTL received:', backendTTL, 'seconds')

          if (backendTTL > 0) {
            // Trực tiếp sử dụng TTL từ backend làm countdown
            // TTL chỉ tồn tại khi user đã chọn ghế (seatHold được tạo trong Redis)
            console.log('[BookingOrderSummary] Setting countdown to:', backendTTL)
            setInternalCountdown(backendTTL)
            setHasTTLFromBackend(true) // Đánh dấu đã có TTL từ backend
            console.log('[BookingOrderSummary] hasTTLFromBackend set to true, internalCountdown set to:', backendTTL)

            // Lưu expireTime (thời điểm hết hạn) vào sessionStorage để dùng làm fallback
            // khi backend không trả về TTL (ví dụ: mạng lỗi, refresh trang)
            const currentTime = Date.now()
            const expireTime = currentTime + backendTTL * 1000
            sessionStorage.setItem(storageKey, expireTime.toString())
          } else {
            // Backend TTL = 0 hoặc không tồn tại
            // Có 2 trường hợp:
            // 1. User chưa chọn ghế lần nào -> chưa có seatHold -> TTL = 0 (bình thường, không redirect)
            // 2. User đã chọn ghế nhưng key bị xóa/hết hạn -> TTL = 0 (cần redirect)

            const savedExpireTime = sessionStorage.getItem(storageKey)

            if (savedExpireTime) {
              // Có data trong sessionStorage -> đã từng có seatHold
              // Nghĩa là user đã chọn ghế nhưng backend đã xóa key hoặc hết hạn
              console.log('[BookingOrderSummary] Backend TTL = 0 và có sessionStorage -> đã hết hạn. Redirect về home.')

              // Xóa sessionStorage vì đã không còn hợp lệ
              sessionStorage.removeItem(storageKey)

              // Dừng countdown ngay (set về 0) và reset flag
              setInternalCountdown(0)
              setHasTTLFromBackend(false)

              // Redirect về home và thông báo
              handleCountdownExpire()
            } else {
              // Không có data trong sessionStorage -> user chưa chọn ghế lần nào
              // Đây là trường hợp bình thường, không redirect, chỉ không hiển thị countdown
              console.log('[BookingOrderSummary] Backend TTL = 0 và không có sessionStorage -> user chưa chọn ghế. Không redirect.')
              setInternalCountdown(0)
              setHasTTLFromBackend(false) // Chưa có TTL từ backend
              // Không redirect, user có thể tiếp tục ở trang chọn ghế
            }
          }
        }
      } catch (error: any) {
        console.error('[BookingOrderSummary] Error fetching TTL from backend:', error)
        
        // Log more details about the error
        if (error.response) {
          // Server responded with error status
          console.error('[BookingOrderSummary] Backend responded with error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          })
        } else if (error.request) {
          // Request was made but no response received
          const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
          if (isTimeout) {
            console.error('[BookingOrderSummary] Request timeout! Backend took too long to respond. This may indicate backend is slow or overloaded.')
          } else {
            console.error('[BookingOrderSummary] No response from backend. Check if backend is running and accessible.')
          }
        } else {
          // Error setting up the request
          console.error('[BookingOrderSummary] Error setting up request:', error.message)
        }

        // Nếu lỗi API, chỉ dùng sessionStorage làm fallback tạm thời
        // (có thể do mạng lỗi, không phải do backend xóa key)
        const savedExpireTime = sessionStorage.getItem(storageKey)
        if (savedExpireTime) {
          const expireTime = parseInt(savedExpireTime)
          const currentTime = Date.now()
          const remaining = Math.max(0, Math.floor((expireTime - currentTime) / 1000))

          if (remaining > 0) {
            // Tính lại countdown từ expireTime đã lưu (fallback khi mạng lỗi)
            console.log('[BookingOrderSummary] Using sessionStorage fallback due to API error, remaining:', remaining)
            setInternalCountdown(remaining)
          } else {
            // Đã hết hạn
            console.log('[BookingOrderSummary] SessionStorage expired. Redirect về home.')
            sessionStorage.removeItem(storageKey)
            setInternalCountdown(0)
            setHasTTLFromBackend(false)
            // Redirect về home và thông báo
            handleCountdownExpire()
          }
        } else {
          // Không có dữ liệu, có thể là lần đầu vào trang
          // Không set countdown (sẽ không hiển thị cho đến khi có TTL từ backend)
          console.log('[BookingOrderSummary] No sessionStorage data, waiting for backend TTL')
          setInternalCountdown(0)
        }
      } finally {
        isSyncInProgress = false
      }
    }

    // CHỈ gọi TTL 1 lần duy nhất khi component mount hoặc khi triggerSync thay đổi (user chọn ghế)
    // Không cần polling interval vì đã có Redis expiration notification qua WebSocket real-time
    // Countdown sẽ tự giảm dần, và khi nhận EXPIRED message thì dừng countdown
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

    // Tạo storageKey: ưu tiên dùng movieId nếu có, nếu không thì dùng userId
    const storageKey = movieId 
      ? `booking_timer_${movieId}_${showtimeId}`
      : `booking_timer_${showtimeId}_${userId}`
    let retryCount = 0
    const maxRetries = 5 // Giảm xuống 5 lần retry (tối đa 1.5 giây)

    // Polling để lấy TTL ngay khi backend tạo seatHold
    // Delay nhỏ để backend kịp xử lý WebSocket selectSeats
    const syncTTL = async () => {
      try {
        console.log('[BookingOrderSummary] Trigger sync due to seat selection, attempt:', retryCount + 1)
        // Tăng timeout cho request TTL vì có thể backend xử lý chậm
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`,
          { timeout: 30000 } // 30 giây cho request này
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)
          if (backendTTL > 0) {
            console.log('[BookingOrderSummary] Got TTL from backend after seat selection:', backendTTL)
            setInternalCountdown(backendTTL)
            setHasTTLFromBackend(true) // Đánh dấu đã có TTL từ backend -> hiển thị countdown
            const currentTime = Date.now()
            const expireTime = currentTime + backendTTL * 1000
            sessionStorage.setItem(storageKey, expireTime.toString())
            // Clear timeout nếu có
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current)
              retryTimeoutRef.current = null
            }
            return // Đã lấy được TTL, dừng retry
          } else if (retryCount < maxRetries) {
            // Backend chưa kịp tạo seatHold, retry sau 300ms (tăng delay để giảm tải)
            retryCount++
            retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)
          } else {
            console.log('[BookingOrderSummary] Max retries reached, backend may not have created seatHold')
          }
        }
      } catch (error: any) {
        console.error('[BookingOrderSummary] Error in trigger sync:', error)
        
        // Log more details about the error
        if (error.response) {
          console.error('[BookingOrderSummary] Backend responded with error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          })
        } else if (error.request) {
          const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
          if (isTimeout) {
            console.error('[BookingOrderSummary] Request timeout in trigger sync! Backend took too long to respond.')
          } else {
            console.error('[BookingOrderSummary] No response from backend. Check if backend is running and accessible.')
          }
        } else {
          console.error('[BookingOrderSummary] Error setting up request:', error.message)
        }
        
        // Retry nếu lỗi và chưa đạt max retries
        if (retryCount < maxRetries) {
          retryCount++
          retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)
        }
      }
    }

    // Delay nhỏ (300ms) để backend kịp xử lý WebSocket selectSeats trước khi fetch TTL
    retryTimeoutRef.current = setTimeout(() => syncTTL(), 300)

    // Cleanup: clear timeout khi component unmount hoặc dependencies thay đổi
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [triggerSync, isAutoMode, showtimeId, userId, movieId])

  // Auto mode: Decrease countdown every second (chỉ đếm ngược khi đã có TTL từ backend)
  // Redirect khi countdown về 0
  useEffect(() => {
    if (!isAutoMode || internalCountdown <= 0) {
      // Clear interval nếu không còn countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      return
    }

    // Clear interval cũ nếu có
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    const timer = setInterval(() => {
      setInternalCountdown(prev => {
        const newValue = Math.max(0, prev - 1)
        if (newValue <= 0) {
          setHasTTLFromBackend(false) // Reset flag để ẩn countdown
          // Xử lý khi countdown về 0
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

  // Manual mode: Xử lý khi externalCountdown về 0
  useEffect(() => {
    if (isAutoMode || externalCountdown === undefined || externalCountdown > 0) return

    // Countdown đã về 0
    if (externalCountdown === 0 && !hasRedirectedRef.current) {
      handleCountdownExpire()
    }
  }, [isAutoMode, externalCountdown, handleCountdownExpire])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSeatTypeCount = (type: string) => {
    return seats.filter(seat => seat.type === type).length
  }

  const getSeatIcon = (type: string) => {
  return <Sofa className="h-4 w-4 text-blue-600" />
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
               <div
                   className="
      flex items-center
      gap-4         /* tăng khoảng cách giữa ảnh và text */
      scale-[1.1]   /* phóng to toàn bộ khối/
        -mt-10          /* gần tiêu đề hơn */
      mb-5             /* cách khối ghế ra thêm 2~4px */
      origin-top-left /* để phóng to theo góc trái */
      transition-transform duration-300
    "
               >
                   <img
                       src={movieInfo.poster || "/placeholder.svg"}
                       alt={movieInfo.title || "Movie"}
                       className="w-20 h-24 object-cover rounded-md border border-gray-200 shadow-md"
                   />
                   <div className="flex-1">
                       <h3 className="font-semibold text- text-gray-900">{movieInfo.title}</h3>
                       <div className="space-y-1 text-base text-gray-600 mt-1">
                           {movieInfo.date && (
                               <div className="flex items-center gap-1">
                                   <Calendar className="h-4 w-4 text-blue-500" />
                                   {movieInfo.date}
                               </div>
                           )}
                           {movieInfo.time && (
                               <div className="flex items-center gap-1">
                                   <Clock className="h-4 w-4 text-blue-500" />
                                   {movieInfo.time}
                               </div>
                           )}
                           {movieInfo.hall && (
                               <div className="flex items-center gap-1">
                                   <MapPin className="h-4 w-4 text-blue-500" />
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
                       <Users className="h-5 w-5 text-indigo-500" />
                       Ghế đã chọn ({seats.length})
                   </h4>
                   <div className="space-y-3">
                       {seats.map((seat) => (
                           <div
                               key={seat.id}
                               className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 hover:shadow-sm transition"
                           >
                               <div className="flex items-center gap-2">
                                   {getSeatIcon(seat.type)}
                                   <span className="font-medium text-gray-800">Ghế {seat.id}</span>
                                   <Badge
                                       variant="outline"
                                       className="text-xs border border-indigo-300 bg-white text-indigo-700 capitalize"
                                   >
                                       {seat.type}
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
          <div className={`rounded-lg p-4 border-2 shadow-lg ${
            countdown <= 300 
              ? 'bg-gradient-to-r from-red-100 to-orange-100 border-red-400 ring-2 ring-red-300' 
              : countdown <= 600 
              ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-400 ring-2 ring-orange-300'
              : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 ring-2 ring-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${
                  countdown <= 300 ? 'text-red-600' : 
                  countdown <= 600 ? 'text-orange-600' : 'text-green-600'
                }`} />
                <span className={`text-sm font-bold ${
                  countdown <= 300 ? 'text-red-700' : 
                  countdown <= 600 ? 'text-orange-700' : 'text-green-700'
                }`}>Thời gian còn lại:</span>
              </div>
              <span className={`font-bold text-xl ${
                countdown <= 300 ? 'text-red-700 animate-pulse' : 
                countdown <= 600 ? 'text-orange-700' : 'text-green-700'
              }`}>
                {formatTime(countdown)}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 ${
              countdown <= 300 ? 'text-red-700' : 
              countdown <= 600 ? 'text-orange-700' : 'text-green-700'
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


            <div className="flex justify-between items-center text-sm bg-emerald-50 rounded-lg p-2 border-2 border-emerald-400">
            <span className=" font-medium text-emerald-700">Tổng cộng:</span>
            <span className="font-bold text-xl text-emerald-700">{total.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        {/* Action Button */}
        {actionButton && (
          <div className="pt-4">
            {actionButton}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

