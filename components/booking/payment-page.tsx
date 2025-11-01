"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import CustomerInfoCard, { CustomerInfo } from "./customer-info-card"
import PaymentMethodCard from "./payment-method-card"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { apiClient } from "@/src/api/interceptor"
import { Movie } from "@/type/movie"
import { jwtDecode } from "jwt-decode"

type PaymentPageProps = {
  movieId: string | null
  date: string | null
  time: string | null
  hall: string | null
  seats: string | null
  combosParam: string | null
  showtimeId: string | null
}

export default function PaymentPage({
  movieId,
  date,
  time,
  hall,
  seats,
  combosParam,
  showtimeId
}: PaymentPageProps) {
  const router = useRouter()

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
  })

  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loadingMovie, setLoadingMovie] = useState(true)
  const [concessions, setConcessions] = useState<any[]>([])
  const [loadingConcessions, setLoadingConcessions] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [comboQty, setComboQty] = useState<Record<string, number>>({})

  // Get userId from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded: any = jwtDecode(token)
        setUserId(decoded.userId)
      }
    } catch (error) {
      console.error("Error decoding token:", error)
    }
  }, [])

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) {
        setLoadingMovie(false)
        return
      }

      try {
        setLoadingMovie(true)
        const response = await apiClient.get(`/movies/${movieId}`)
        if (response.data?.status === 200 && response.data?.data) {
          setMovie(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching movie details:", error)
      } finally {
        setLoadingMovie(false)
      }
    }

    fetchMovieData()
  }, [movieId])

  // Fetch concessions data
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
        console.error("Error fetching concessions:", error)
      } finally {
        setLoadingConcessions(false)
      }
    }

    fetchConcessions()
  }, [])

  // Parse combo quantities from URL params
  useEffect(() => {
    if (combosParam) {
      try {
        const parsed = JSON.parse(combosParam)
        const map: Record<string, number> = {}

        parsed.forEach((c: any) => {
          map[c.comboId] = c.quantity
        })

        setComboQty(map)
      } catch (err) {
        console.error("Combo parse error:", err)
      }
    }
  }, [combosParam])

  // Price calculations
  const combosTotal = useMemo(() => {
    return Object.entries(comboQty).reduce((sum, [comboId, quantity]) => {
      const concession = concessions.find(c => c.concessionId.toString() === comboId)
      if (!concession) return sum
      return sum + (quantity * concession.price)
    }, 0)
  }, [comboQty, concessions])

  const getSeatPrice = (seatId: string) => {
    // Use hardcoded prices based on row
    const row = seatId[0]
    if (row === "H") return 200000
    if (["E", "F", "G"].includes(row)) return 150000
    return 100000
  }

  const calculateTicketTotal = () => {
    if (!seats) return 0
    return seats.split(',').reduce((total, seatId) => {
      return total + getSeatPrice(seatId.trim())
    }, 0)
  }

  const calculateTotal = () => {
    return calculateTicketTotal() + combosTotal - discountValue
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
    Object.entries(comboQty).forEach(([comboId, quantity]) => {
      if (quantity > 0) {
        const concession = concessions.find(c => c.concessionId.toString() === comboId)
        if (concession) {
          result.push({
            id: String(comboId),
            name: concession.name,
            quantity,
            price: concession.price
          })
        }
      }
    })
    return result
  }, [comboQty, concessions])

  const movieInfo: MovieInfo | undefined = useMemo(() => {
    if (!movie) return undefined
    return {
      title: movie.name,
      poster: movie.posterUrl,
      date: date || undefined,
      time: time || undefined,
      hall: hall || undefined
    }
  }, [movie, date, time, hall])

  // Payment handler
  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert("Vui lòng điền thông tin khách hàng")
      return
    }

    setIsProcessing(true)

    if (selectedPayment === "vnpay") {
      // Call API createPayment
      const res = await fetch("/api/payment/vnpay", {
        method: "POST",
        body: JSON.stringify({
          total: calculateTotal(),
        }),
      })

      const data = await res.json()
      window.location.href = data.paymentUrl
      return
    }

    // Cash mock
    setTimeout(() => {
      const bookingId = `BK${Date.now()}`
      router.push(`/booking/confirmation?bookingId=${bookingId}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 px-4">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-6">
          <CustomerInfoCard
            onChange={(info, discount) => {
              setCustomerInfo(info)
              setDiscountValue(discount)
            }}
          />
          <PaymentMethodCard onSelect={setSelectedPayment} />
        </div>

        {/* RIGHT - Order Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit space-y-6">
          <BookingOrderSummary
            movieInfo={movieInfo}
            seats={seatsInfo}
            seatsTotal={calculateTicketTotal()}
            concessions={concessionsInfo}
            concessionsTotal={combosTotal}
            total={calculateTotal()}
            discount={discountValue}
            showtimeId={showtimeId ? parseInt(showtimeId) : null}
            userId={userId}
            movieId={movieId}
          />

          {/* Payment Button */}
          <button
            disabled={isProcessing}
            onClick={handlePayment}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold text-lg shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? "Đang xử lý..."
              : `Thanh toán ${calculateTotal().toLocaleString()}đ`}
          </button>
        </div>
      </div>
    </div>
  )
}

