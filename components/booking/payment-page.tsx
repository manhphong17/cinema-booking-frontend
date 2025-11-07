"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import CustomerInfoCard, { CustomerInfo } from "./customer-info-card"
import PaymentMethodCard from "./payment-method-card"
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "./booking-order-summary"
import { apiClient } from "@/src/api/interceptor"
import { Movie } from "@/type/movie"
import { jwtDecode } from "jwt-decode"
import { useSeatWebSocket } from "@/hooks/use-seat-websocket"
import { toast } from "sonner"


type TicketResponse = {
    ticketId: number;
    seatCode: string;      // ← dùng để hiển thị “C7”, “C8”…
    seatType: string;
    ticketPrice: number;

    roomName: string;
    roomType: string;
    hall: string;

    showtimeId: number;
    showDate: string;      // yyyy-MM-dd
    showTime: string;      // HH:mm

    movieName: string;
    posterUrl: string;
}


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
  showtimeId
}: PaymentPageProps) {
  const router = useRouter()

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    loyalPoint: 0,
  })

  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [concessions, setConcessions] = useState<any[]>([])
  const [userId, setUserId] = useState<number | null>(null)
  const [comboQty, setComboQty] = useState<Record<string, number>>({})

  // Seat data
  const [seatData, setSeatData] = useState<TicketResponse[]>([])

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
      console.error("Error decoding token:", error)
    }
  }, [])
  
  // Callback khi seat hold hết hạn từ Redis notification (qua WebSocket)
  const handleSeatHoldExpired = useCallback(() => {
    if (userId && showtimeId) {
      console.log('[Payment] Seat hold expired via Redis notification')
      
      // Hiển thị toast thông báo cho user
        toast.error( "Thời gian giữ ghế đã hết hạn. Vui lòng chọn lại ghế.");
      
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


    useEffect(() => {
        async function fetchOrderSession() {
            if (!showtimeId || !userId) return;

            try {
                // Gọi API lấy OrderSession trong Redis
                const res = await apiClient.get(`/bookings/order-session`, {
                    params: { showtimeId, userId }
                });
                const session = res.data.data;
                console.log(" Order session from Redis:", session);

                //  Lưu ticketIds & concessionOrders
                const ticketIds = session.ticketIds || [];
                const concessionOrders = session.concessionOrders || [];

                //  Fetch ticket theo ticketIds
                if (ticketIds.length > 0) {
                    const seatRes = await apiClient.get(`/bookings/tickets/details`, {
                        params: { ids: ticketIds.join(",") }
                    });
                    setSeatData(seatRes.data.data || []);
                }

                //  Fetch concessions theo comboId
                if (concessionOrders.length > 0) {
                    const comboIds = concessionOrders.map((c: any) => c.comboId);
                    const consRes = await apiClient.get(`/concession/list-by-ids`, {
                        params: { ids: comboIds.join(",") }
                    });
                    setConcessions(consRes.data.data || []);

                    // Gắn map {comboId: quantity} cho dễ xử lý
                    setComboQty(() => {
                        const map: Record<string, number> = {};
                        concessionOrders.forEach((c: any) => {
                            map[c.comboId] = c.quantity;
                        });
                        return map;
                    });
                }
            } catch (err) {
                console.error(" Failed to fetch order session:", err);
                toast.error("Không thể tải thông tin đơn hàng");
            }
        }

        fetchOrderSession();
    }, [showtimeId, userId]);

//  Tính tổng tiền vé
    const calculateTicketTotal = useCallback(() => {
        return seatData.reduce((sum, seat) => sum + (seat.ticketPrice || 0), 0);
    }, [seatData]);

//  Map danh sách ghế cho OrderSummary
    // seatsInfo
    const seatsInfo: SeatInfo[] = useMemo(() => {
        return seatData.map(seat => ({
            id: seat.seatCode,
            type: seat.seatType.toLowerCase() ,
            price: seat.ticketPrice
        }));
    }, [seatData]);

// ⃣ Map concessions (combo đồ ăn)
    const concessionsInfo: ConcessionInfo[] = useMemo(() => {
        return concessions
            .filter((item) => comboQty[item.concessionId] > 0)
            .map((item) => ({
                id: item.concessionId,
                name: item.name,
                quantity: comboQty[item.concessionId] || 0,
                price: item.price,
            }));
    }, [concessions, comboQty]);

// ⃣ Tính tổng tiền đồ ăn
    const combosTotal = useMemo(() => {
        return concessionsInfo.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }, [concessionsInfo]);

// ⃣ Tính tổng cộng (sau khi trừ giảm giá)
    const calculateTotal = useCallback(() => {
        const subtotal = calculateTicketTotal() + combosTotal;
        return Math.max(0, subtotal - discountValue);
    }, [calculateTicketTotal, combosTotal, discountValue]);


// 6️⃣ Movie info (từ ticketDetails đầu tiên)
    const movieInfo: MovieInfo | undefined = useMemo(() => {
        if (!seatData.length) return undefined;
        const first = seatData[0];
        return {
            title: first.movieName,
            poster: first.posterUrl,
            date: first.showDate,
            time: first.showTime,
            hall: first.hall,
        };
    }, [seatData]);

    const handlePayment = async () => {
        if (!showtimeId || !userId) return;
        setIsProcessing(true);

        try {
            // Chuẩn bị payload theo DTO ở backend
            const payload = {
                userId,
                ticketIds: seatData.map((s) => s.ticketId),
                concessions: concessionsInfo.map((c) => ({
                    concessionId: c.id,
                    quantity: c.quantity,
                })),
                totalPrice: calculateTicketTotal() + combosTotal,
                discount: discountValue,
                amount: calculateTotal(),
                paymentMethod: selectedPayment,
                showtimeId: showtimeId,
            };

            const res = await apiClient.post("/payment/checkout", payload);
            const payUrl = res.data.data;

            // Nếu thanh toán bằng VNPay thì redirect
            if (selectedPayment === "vnpay") {
                window.location.href = payUrl;
            } else {
                toast.success("Thanh toán thành công bằng tiền mặt!");
                router.push("/home");
            }
        } catch (err) {
            toast.error("Không thể tạo đơn thanh toán");
        } finally {
            setIsProcessing(false);
        }
    };


  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Decorative Border Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-12 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
          <div className="inline-block mb-4">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-3 py-1 bg-blue-50 rounded-md">
              Step 3
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Thanh Toán
            </span>
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Hoàn tất thông tin và thanh toán đơn hàng
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
            <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
          </div>
        </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
            earnedPoints={Math.floor(calculateTotal() / 10000)}
            showtimeId={showtimeId ? parseInt(showtimeId) : null}
            userId={userId}
            movieId={movieId}
            onSeatHoldExpired={(handler) => {
              bookingExpiredHandlerRef.current = handler
            }}
          />

          {/* Payment Button */}
          <button
            disabled={isProcessing}
            onClick={handlePayment}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-blue-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative z-10">
              {isProcessing
                ? "Đang xử lý..."
                : `Thanh toán ${calculateTotal().toLocaleString()}đ`}
            </span>
          </button>

        </div>
      </div>
      </div>
    </div>
  )
}

