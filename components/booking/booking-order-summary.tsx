"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Calendar, Clock, CreditCard, Crown, MapPin, Sofa, Users} from "lucide-react"
import {ReactNode, useEffect, useState} from "react"
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
  showSeatTypeStats = false
}: BookingOrderSummaryProps) {
  const router = useRouter()
  const [internalCountdown, setInternalCountdown] = useState(600)
  const [startTime, setStartTime] = useState<number | null>(null)

  // Determine if we're in auto mode (manage countdown internally) or manual mode (use external countdown)
  const isAutoMode = externalCountdown === undefined && showtimeId && userId && movieId
  const countdown = isAutoMode ? internalCountdown : (externalCountdown ?? undefined)

  // Auto mode: Sync countdown with backend TTL
  useEffect(() => {
    if (!isAutoMode) return

    const storageKey = `booking_timer_${movieId}_${showtimeId}`

    async function syncTTLFromBackend() {
      try {
        const response = await apiClient.get(
          `/bookings/show-times/${showtimeId}/users/${userId}/seat-hold/ttl`
        )

        if (response.data?.status === 200 && response.data?.data !== undefined) {
          const backendTTL = Math.max(0, response.data.data as number)
          
          if (backendTTL > 0) {
            setInternalCountdown(backendTTL)
            
            const currentTime = Date.now()
            const estimatedDuration = 600
            const estimatedStartTime = currentTime - (estimatedDuration - backendTTL) * 1000
            setStartTime(estimatedStartTime)
            sessionStorage.setItem(storageKey, estimatedStartTime.toString())
          } else {
            const savedStartTime = sessionStorage.getItem(storageKey)

            if (savedStartTime) {
              const savedTime = parseInt(savedStartTime)
              const elapsed = Math.floor((Date.now() - savedTime) / 1000)
              const remaining = Math.max(0, 600 - elapsed)

              if (remaining > 0) {
                setStartTime(savedTime)
                setInternalCountdown(remaining)
              } else {
                sessionStorage.removeItem(storageKey)
                if (onCountdownExpire) {
                  onCountdownExpire()
                } else {
                  router.push('/booking')
                }
              }
            } else {
              const newStartTime = Date.now()
              setStartTime(newStartTime)
              setInternalCountdown(600)
              sessionStorage.setItem(storageKey, newStartTime.toString())
            }
          }
        }
      } catch (error) {
        console.error('[BookingOrderSummary] Error fetching TTL from backend:', error)
        const savedStartTime = sessionStorage.getItem(storageKey)
        if (savedStartTime) {
          const savedTime = parseInt(savedStartTime)
          const elapsed = Math.floor((Date.now() - savedTime) / 1000)
          const remaining = Math.max(0, 600 - elapsed)

          if (remaining > 0) {
            setStartTime(savedTime)
            setInternalCountdown(remaining)
          } else {
            sessionStorage.removeItem(storageKey)
            if (onCountdownExpire) {
              onCountdownExpire()
            } else {
              router.push('/booking')
            }
          }
        } else {
          const newStartTime = Date.now()
          setStartTime(newStartTime)
          setInternalCountdown(600)
          sessionStorage.setItem(storageKey, newStartTime.toString())
        }
      }
    }

    syncTTLFromBackend()
    const syncInterval = setInterval(syncTTLFromBackend, 10000) // Sync every 10 seconds

    return () => clearInterval(syncInterval)
  }, [isAutoMode, showtimeId, userId, movieId, onCountdownExpire, router])

  // Auto mode: Decrease countdown every second
  useEffect(() => {
    if (!isAutoMode || !startTime) return

    const timer = setInterval(() => {
      setInternalCountdown(prev => {
        if (prev <= 1) {
          if (onCountdownExpire) {
            onCountdownExpire()
          } else {
            router.push('/booking')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isAutoMode, startTime, onCountdownExpire, router])

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
      <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-6 w-6" />
          <span className="text-xl font-semibold">{title}</span>
        </CardTitle>
      </CardHeader>
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
            <div className="flex justify-between items-center text-sm bg-emerald-50 rounded-lg p-2 border-2 border-emerald-400">
              <span className="font-medium text-emerald-700">Giảm giá:</span>
              <span className="font-semibold text-emerald-700">-{discount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
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

