"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Calendar, Clock, CreditCard, Crown, MapPin, Sofa, Users} from "lucide-react"
import {ReactNode, useEffect, useState, useRef, useCallback} from "react"
import {useRouter} from "next/navigation"
import {apiClient} from "@/src/api/interceptor"

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
  
  // Countdown - có thể truyền trực tiếp hoặc để component tự quản lý
  countdown?: number // Nếu truyền, sẽ dùng giá trị này (manual mode)
  
  // Props để component tự quản lý countdown (auto mode)
  showtimeId?: number | null
  userId?: number | null
  movieId?: string | null
  onCountdownExpire?: () => void
  
  // Trigger để sync TTL ngay khi user chọn ghế (từ component cha)
  triggerSync?: number | null
  
  // Callback để component cha register handler khi nhận EXPIRED message từ WebSocket
  // Component cha sẽ truyền function này: (handler) => { ref.current = handler }
  // Sau đó khi nhận EXPIRED message, component cha sẽ gọi handler()
  onSeatHoldExpired?: (handler: () => void) => void
  
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
  countdown: externalCountdown,
  showtimeId,
  userId,
  movieId,
  onCountdownExpire,
  actionButton,
  title = "Tóm tắt đơn hàng",
  showSeatTypeStats = false,
  triggerSync,
  onSeatHoldExpired
}: BookingOrderSummaryProps) {
  const router = useRouter()
  // Khởi tạo countdown = 0, chỉ hiển thị khi có TTL từ backend (> 0)
  const [internalCountdown, setInternalCountdown] = useState(0)
  const [hasTTLFromBackend, setHasTTLFromBackend] = useState(false) // Flag để biết đã có TTL từ backend chưa
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref để lưu timeout cho retry
  
  // Function để xử lý khi seat hold hết hạn (được gọi từ component cha khi nhận EXPIRED message)
  // Component cha đã xử lý redirect, chỉ cần reset state ở đây
  const handleSeatHoldExpired = useCallback(() => {
    console.log('[BookingOrderSummary] Seat hold expired from Redis notification')
    const storageKey = `booking_timer_${movieId}_${showtimeId}`
    sessionStorage.removeItem(storageKey)
    setInternalCountdown(0)
    setHasTTLFromBackend(false)
    
    // Gọi callback nếu có, component cha sẽ xử lý redirect
    if (onCountdownExpire) {
      onCountdownExpire()
    }
    // KHÔNG redirect ở đây - component cha đã xử lý redirect trong handleSeatHoldExpired của nó
  }, [movieId, showtimeId, onCountdownExpire])
  
  // Expose handleSeatHoldExpired qua onSeatHoldExpired callback
  useEffect(() => {
    if (onSeatHoldExpired) {
      // Component cha sẽ register handler này vào ref của nó
      // Sau đó khi nhận EXPIRED message, component cha sẽ gọi handler()
      onSeatHoldExpired(handleSeatHoldExpired)
    }
  }, [onSeatHoldExpired, handleSeatHoldExpired])

  // Determine if we're in auto mode (manage countdown internally) or manual mode (use external countdown)
  // Auto mode: tự động lấy TTL từ backend khi có đủ showtimeId, userId, movieId
  const isAutoMode = externalCountdown === undefined && showtimeId && userId && movieId
  
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
  const countdown = isAutoMode 
    ? (hasTTLFromBackend && internalCountdown > 0 ? internalCountdown : undefined)
    : (externalCountdown ?? undefined)

  // Auto mode: Sync countdown with backend TTL
  useEffect(() => {
    if (!isAutoMode) return

    const storageKey = `booking_timer_${movieId}_${showtimeId}`
    let isSyncInProgress = false // Flag để tránh duplicate calls

    async function syncTTLFromBackend() {
      // Tránh sync nếu đang có request đang chạy (debounce)
      if (isSyncInProgress) {
        return
      }
      
      // Nếu đã có TTL từ backend rồi (đã gọi lần đầu), không cần gọi lại
      // Vì countdown sẽ tự giảm dần, và Redis expiration notification sẽ thông báo khi hết hạn
      if (hasTTLFromBackend) {
        console.log('[BookingOrderSummary] Already have TTL, skipping sync (will use Redis expiration notification)')
        return
      }
      
      isSyncInProgress = true
      try {
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)
          console.log('[BookingOrderSummary] Backend TTL:', backendTTL)
          
          if (backendTTL > 0) {
            // Trực tiếp sử dụng TTL từ backend làm countdown
            // TTL chỉ tồn tại khi user đã chọn ghế (seatHold được tạo trong Redis)
            setInternalCountdown(backendTTL)
            setHasTTLFromBackend(true) // Đánh dấu đã có TTL từ backend
            
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
              // KHÔNG redirect ở đây - Redis expiration notification sẽ xử lý redirect qua WebSocket
              console.log('[BookingOrderSummary] Backend TTL = 0 và có sessionStorage -> đã hết hạn. Redis notification sẽ xử lý redirect.')
              
              // Xóa sessionStorage vì đã không còn hợp lệ
              sessionStorage.removeItem(storageKey)
              
              // Dừng countdown ngay (set về 0) và reset flag
              setInternalCountdown(0)
              setHasTTLFromBackend(false)
              
              // KHÔNG redirect - đợi Redis expiration notification qua WebSocket
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
      } catch (error) {
        console.error('[BookingOrderSummary] Error fetching TTL from backend:', error)
        
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
            // KHÔNG redirect ở đây - Redis expiration notification sẽ xử lý redirect qua WebSocket
            console.log('[BookingOrderSummary] SessionStorage expired. Redis notification sẽ xử lý redirect.')
            sessionStorage.removeItem(storageKey)
            setInternalCountdown(0)
            setHasTTLFromBackend(false)
            // KHÔNG redirect - đợi Redis expiration notification qua WebSocket
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
  }, [isAutoMode, showtimeId, userId, movieId, triggerSync, hasTTLFromBackend])
  
  // Trigger sync ngay khi user chọn ghế (triggerSync thay đổi)
  useEffect(() => {
    if (!isAutoMode || !triggerSync) return
    
    // Clear timeout cũ nếu có
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    const storageKey = `booking_timer_${movieId}_${showtimeId}`
    let retryCount = 0
    const maxRetries = 5 // Giảm xuống 5 lần retry (tối đa 1.5 giây)
    
    // Polling để lấy TTL ngay khi backend tạo seatHold
    // Delay nhỏ để backend kịp xử lý WebSocket selectSeats
    const syncTTL = async () => {
      try {
        console.log('[BookingOrderSummary] Trigger sync due to seat selection, attempt:', retryCount + 1)
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`
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
      } catch (error) {
        console.error('[BookingOrderSummary] Error in trigger sync:', error)
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
  // KHÔNG redirect khi countdown về 0 - Redis expiration notification sẽ xử lý redirect
  useEffect(() => {
    if (!isAutoMode || internalCountdown <= 0) return

    const timer = setInterval(() => {
      setInternalCountdown(prev => {
        const newValue = Math.max(0, prev - 1)
        // Chỉ dừng countdown khi về 0, KHÔNG redirect
        // Redirect sẽ được xử lý bởi Redis expiration notification qua WebSocket
        if (newValue <= 0) {
          setHasTTLFromBackend(false) // Reset flag để ẩn countdown
        }
        return newValue
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isAutoMode, internalCountdown])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSeatTypeCount = (type: string) => {
    return seats.filter(seat => seat.type === type).length
  }

  const getSeatIcon = (type: string) => {
    switch (type) {
      case 'vip': return <Crown className="h-4 w-4 text-purple-600" />
      default: return <Sofa className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <Card className="shadow-2xl border-2 border-primary/40 bg-white hover:shadow-primary/20 transition-all duration-300">
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-6 w-6" />
          <span className="text-xl font-semibold">{title}</span>
        </CardTitle>
       <CardContent className="p-6 space-y-6">
        {/* Movie Info */}
        {movieInfo && (
          <div className="flex gap-3 bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
            <img
              src={movieInfo.poster || "/placeholder.svg"}
              alt={movieInfo.title || "Movie"}
              className="w-16 h-20 object-cover rounded-lg shadow-sm border-2 border-gray-300"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground">{movieInfo.title}</h3>
              <div className="space-y-1 text-xs text-muted-foreground mt-1">
                {movieInfo.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {movieInfo.date}
                  </div>
                )}
                {movieInfo.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {movieInfo.time}
                  </div>
                )}
                {movieInfo.hall && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {movieInfo.hall}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selected Seats */}
        {seats.length > 0 && (
          <div>
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Ghế đã chọn ({seats.length})
            </h4>

            {/* Seat type summary - chỉ hiển thị ở seat selection */}
            {showSeatTypeStats && (
              <div className="mb-4 space-y-2 bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground font-medium">Ghế thường:</span>
                  <span className={`font-semibold ${
                    getSeatTypeCount('standard') > 0 ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}>
                    {getSeatTypeCount('standard')}/8
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground font-medium">Ghế VIP:</span>
                  <span className={`font-semibold ${
                    getSeatTypeCount('vip') > 0 ? 'text-violet-600' : 'text-muted-foreground'
                  }`}>
                    {getSeatTypeCount('vip')}/8
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {seats.map((seat) => (
                <div key={seat.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border-2 border-gray-300">
                  <div className="flex items-center gap-2">
                    {getSeatIcon(seat.type)}
                    <span className="font-medium text-foreground">Ghế {seat.id}</span>
                    <Badge variant="outline" className="text-xs border-2 border-gray-400 bg-white text-foreground">
                      {seat.type === 'vip' ? 'VIP' : seat.type === 'premium' ? 'Premium' : 'Thường'}
                    </Badge>
                  </div>
                  <span className="font-semibold text-foreground">{seat.price.toLocaleString()}đ</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No seats selected */}
        {seats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sofa className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa chọn ghế nào</p>
            <p className="text-sm">Hãy chọn ghế từ sơ đồ bên trái</p>
          </div>
        )}

        {/* Selected Concessions */}
        {concessions.length > 0 && (
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Sản phẩm đã chọn ({concessions.length})
            </h4>
            <div className="space-y-2">
              {concessions.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2 border-2 border-gray-300">
                  <span className="font-medium text-foreground">{item.name} x{item.quantity}</span>
                  <span className="font-semibold text-foreground">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown Timer - chỉ hiển thị khi có countdown */}
        {countdown !== undefined && (
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
                    <div className="flex justify-between items-center text-sm bg-emerald-50 rounded-lg p-2 border-2 border-emerald-400">
                        <span className="font-medium text-emerald-700">Giảm giá:</span>
                        <span className="font-semibold text-emerald-700">-{discount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right italic">
                        * Áp dụng từ điểm thành viên của bạn
                    </p>
                </>
            )}

          <div className="flex justify-between items-center font-semibold text-lg border-t-2 border-gray-300 pt-3 mt-2">
            <span className="text-foreground font-medium">Tổng cộng:</span>
            <span className="text-primary font-bold text-xl">{total.toLocaleString('vi-VN')} VNĐ</span>
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

