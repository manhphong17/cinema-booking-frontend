"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, QrCode } from "lucide-react"
import { toast } from "sonner"
import BookingOrderSummary, { SeatInfo, ConcessionInfo } from "@/components/booking/booking-order-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CustomerInfoCard, { CustomerInfo } from "@/components/booking/customer-info-card"
import PaymentMethodCard from "@/components/booking/payment-method-card"
import { apiClient } from "@/src/api/interceptor"

interface PaymentTabProps {
  seats: SeatInfo[]
  seatsTotal: number
  concessions: ConcessionInfo[]
  concessionsTotal: number
  total: number
  onPaymentSuccess: (paymentMethod: string, isCallback?: boolean, discount?: number, earnedPoints?: number) => void
  onNavigateToTickets?: () => void // Callback để chuyển về tab tickets
  showtimeId?: number | null
  userId?: number | null
}

type TicketResponse = {
  ticketId: number;
  seatCode: string;
  seatType: string;
  ticketPrice: number;
  roomName: string;
  roomType: string;
  hall: string;
  showtimeId: number;
  showDate: string;
  showTime: string;
  movieName: string;
  posterUrl: string;
}

export function PaymentTab({ seats, seatsTotal, concessions, concessionsTotal, total, onPaymentSuccess, onNavigateToTickets, showtimeId, userId }: PaymentTabProps) {
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>("CASH")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [vnpayUrl, setVnpayUrl] = useState<string | null>(null)
  const [vnpayQrCode, setVnpayQrCode] = useState<string | null>(null)
  const [vnpayTransactionId, setVnpayTransactionId] = useState<string | null>(null)
  const [vnpayPaid, setVnpayPaid] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    loyalPoint: 0,
  })
  const [discountValue, setDiscountValue] = useState(0)
  const [seatData, setSeatData] = useState<TicketResponse[]>([])
  const [concessionsData, setConcessionsData] = useState<any[]>([])
  const [comboQty, setComboQty] = useState<Record<string, number>>({})
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch order session from Redis (giống customer page)
  useEffect(() => {
    async function fetchOrderSession() {
      if (!showtimeId || !userId) return;

      try {
        // Gọi API lấy OrderSession trong Redis
        const res = await apiClient.get(`/bookings/order-session`, {
          params: { showtimeId, userId }
        });
        const session = res.data.data;
        console.log("[PaymentTab] Order session from Redis:", session);

        // Lưu ticketIds & concessionOrders
        const ticketIds = session.ticketIds || [];
        const concessionOrders = session.concessionOrders || [];

        // Fetch ticket theo ticketIds
        if (ticketIds.length > 0) {
          const seatRes = await apiClient.get(`/bookings/tickets/details`, {
            params: { ids: ticketIds.join(",") }
          });
          const tickets = seatRes.data.data || [];
          setSeatData(tickets);
        }

        // Fetch concessions theo comboId
        if (concessionOrders.length > 0) {
          const comboIds = concessionOrders.map((c: any) => c.comboId);
          const consRes = await apiClient.get(`/concession/list-by-ids`, {
            params: { ids: comboIds.join(",") }
          });
          setConcessionsData(consRes.data.data || []);

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
        console.error("[PaymentTab] Failed to fetch order session:", err);
        toast.error("Không thể tải thông tin đơn hàng");
      }
    }

    fetchOrderSession();
  }, [showtimeId, userId]);

  // Calculate totals from API data (giống customer page)
  const calculateTicketTotal = seatData.reduce((sum, seat) => sum + (seat.ticketPrice || 0), 0);
  
  const seatsInfo: SeatInfo[] = seatData.map(seat => ({
    id: seat.seatCode,
    type: seat.seatType.toLowerCase(),
    price: seat.ticketPrice
  }));

  const concessionsInfo: ConcessionInfo[] = concessionsData
    .filter((item) => comboQty[item.concessionId] > 0)
    .map((item) => ({
      id: item.concessionId,
      name: item.name,
      quantity: comboQty[item.concessionId] || 0,
      price: item.price,
    }));

  const combosTotal = concessionsInfo.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Movie info (từ ticketDetails đầu tiên) - giống customer page
  const movieInfo = seatData.length > 0 ? {
    title: seatData[0].movieName,
    poster: seatData[0].posterUrl,
    date: seatData[0].showDate,
    time: seatData[0].showTime,
    hall: seatData[0].hall,
  } : undefined;

  // Use API data if available, otherwise fallback to props
  const actualSeatsTotal = seatData.length > 0 ? calculateTicketTotal : seatsTotal;
  const actualConcessionsTotal = concessionsData.length > 0 ? combosTotal : concessionsTotal;
  const actualSeats = seatData.length > 0 ? seatsInfo : seats;
  const actualConcessions = concessionsData.length > 0 ? concessionsInfo : concessions;
  const actualTotal = actualSeatsTotal + actualConcessionsTotal;

  // Calculate total with discount
  const finalTotal = actualTotal - discountValue
  const earnedPoints = Math.floor(finalTotal / 10000)

  const handleMethodSelect = useCallback((methodCode: string) => {
    console.log("[PaymentTab] Method selected:", methodCode)
    setSelectedPaymentCode(methodCode)
    setCashConfirmed(false)
    setVnpayUrl(null)
    setVnpayQrCode(null)
    setVnpayPaid(false)
    setVnpayTransactionId(null)
    // Clear polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Cleanup polling khi component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Kiểm tra URL params khi component mount (nếu user quay lại từ VNPay)
  useEffect(() => {
    // Kiểm tra URL params (vnpay callback)
    const params = new URLSearchParams(window.location.search)
    const vnp_ResponseCode = params.get("vnp_ResponseCode")
    const vnp_TransactionNo = params.get("vnp_TransactionNo")
    
    if (vnp_ResponseCode === "00" && vnp_TransactionNo) {
      // Thanh toán thành công từ VNPay callback
      setVnpayPaid(true)
      toast.success("Thanh toán VNPay thành công!")
      
      // Cleanup URL params
      window.history.replaceState({}, "", window.location.pathname)
      
      // Gọi callback sau 1 giây với paymentMethod "vnpay" và isCallback = true
      setTimeout(() => {
        onPaymentSuccess("VNPAY", true, discountValue, earnedPoints)
        // Reset state
        setVnpayQrCode(null)
        setVnpayUrl(null)
        setVnpayTransactionId(null)
        setVnpayPaid(false)
        // Tự động chuyển về tab tickets nếu có callback
        if (onNavigateToTickets) {
          setTimeout(() => {
            onNavigateToTickets()
          }, 500)
        }
      }, 1000)
    }
  }, [onPaymentSuccess, onNavigateToTickets, discountValue, earnedPoints])

  // Polling để kiểm tra trạng thái thanh toán VNPay (nếu có transaction ID)
  useEffect(() => {
    if (!vnpayTransactionId || vnpayPaid) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    // DEMO: Polling mechanism
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // DEMO: Simulate checking payment status
        // Trong production, gọi API backend để kiểm tra trạng thái
        // const res = await fetch(`/api/payment/status/${vnpayTransactionId}`)
        // const data = await res.json()
        // if (data.status === "paid") {
        //   setVnpayPaid(true)
        //   toast.success("Thanh toán VNPay thành công!")
        //   onPaymentSuccess()
        //   if (onNavigateToTickets) {
        //     setTimeout(() => onNavigateToTickets(), 500)
        //   }
        // }
        
        // DEMO: Skip polling, chỉ dùng callback URL
        // Trong production sẽ có polling thực tế
      } catch (error) {
        console.error("Error checking payment status:", error)
      }
    }, 3000) // Check every 3 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [vnpayTransactionId, vnpayPaid, onPaymentSuccess, onNavigateToTickets])

  const handleVnpayPayment = async () => {
    try {
      setIsProcessing(true)
      console.log("[PaymentTab] Starting VNPay payment with code:", selectedPaymentCode)
      
      // Call onPaymentSuccess with payment method code and data from API
      // The parent component will handle the API call and redirect
      // Cần await để bắt lỗi nếu có
      await onPaymentSuccess(selectedPaymentCode, false, discountValue, earnedPoints)
      
      // Note: If VNPay, the parent will redirect immediately, 
      // nên code này sẽ không chạy nếu redirect thành công
      // Nếu đến đây nghĩa là không redirect (có thể là CASH hoặc lỗi)
      setIsProcessing(false)
    } catch (error: any) {
      console.error("[PaymentTab] Payment error:", error)
      toast.error(error?.message || "Lỗi khi tạo thanh toán")
      setIsProcessing(false)
    }
  }

  const handleCashConfirm = async () => {
    try {
      setIsProcessing(true)
      
      // Call onPaymentSuccess with "CASH" payment method and data from API
      // The parent component will handle the API call
      await onPaymentSuccess("CASH", false, discountValue, earnedPoints)
      
      // If successful, show success screen
      setCashConfirmed(true)
      
      // Reset state after showing success screen
      setTimeout(() => {
        setCashConfirmed(false)
        setSelectedPaymentCode("CASH")
        setVnpayUrl(null)
        setVnpayQrCode(null)
        setIsProcessing(false)
      }, 2000)
    } catch (error: any) {
      console.error("Cash payment error:", error)
      toast.error(error?.message || "Lỗi khi xác nhận thanh toán")
      setIsProcessing(false)
    }
  }

  const renderPaymentContent = () => {
    if (vnpayQrCode) {
      // Hiển thị QR code
      return (
        <Card>
          <CardHeader>
            <CardTitle>Thanh toán VNPay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vui lòng quét mã QR bằng ứng dụng VNPay để thanh toán
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
                <img 
                  src={vnpayQrCode} 
                  alt="VNPay QR Code" 
                  className="w-64 h-64"
                  onError={(e) => {
                    // Fallback nếu không có QR code image, tạo QR từ URL
                    const target = e.currentTarget as HTMLImageElement
                    if (vnpayUrl) {
                      target.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(vnpayUrl)}`
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setVnpayQrCode(null)
                  setVnpayUrl(null)
                }}
                className="flex-1"
              >
                Quay lại
              </Button>
              {vnpayUrl && (
                <Button 
                  onClick={() => window.open(vnpayUrl, '_blank')}
                  className="flex-1"
                >
                  Mở trang thanh toán
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (vnpayUrl && !vnpayQrCode) {
      // Nếu chỉ có URL mà không có QR code, tạo QR từ URL
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(vnpayUrl)}`
      return (
        <Card>
          <CardHeader>
            <CardTitle>Thanh toán VNPay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vui lòng quét mã QR bằng ứng dụng VNPay để thanh toán
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
                <img 
                  src={qrImageUrl} 
                  alt="VNPay QR Code" 
                  className="w-64 h-64"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setVnpayUrl(null)
                }}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button 
                onClick={() => window.open(vnpayUrl, '_blank')}
                className="flex-1"
              >
                Mở trang thanh toán
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (vnpayPaid) {
      // VNPay thanh toán thành công
      return (
        <Card>
          <CardContent className="text-center space-y-4 py-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Thanh toán VNPay thành công!
              </h3>
              <p className="text-base text-muted-foreground mb-1">Đã nhận được phản hồi từ VNPay</p>
              <p className="text-lg font-semibold text-foreground">
                Tổng tiền: {finalTotal.toLocaleString("vi-VN")}đ
              </p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground animate-in fade-in delay-500">
                  Đang xử lý đơn hàng...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (cashConfirmed) {
      return (
        <Card>
          <CardContent className="text-center space-y-4 py-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Thanh toán thành công!
              </h3>
              <p className="text-base text-muted-foreground mb-1">Đã xác nhận nhận tiền mặt</p>
              <p className="text-lg font-semibold text-foreground">
                Tổng tiền: {finalTotal.toLocaleString("vi-VN")}đ
              </p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground animate-in fade-in delay-500">
                  Đang xử lý đơn hàng...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Chọn phương thức thanh toán
    return (
      <div className="space-y-6">
        <CustomerInfoCard
          onChange={(info, discount) => {
            setCustomerInfo(info)
            setDiscountValue(discount)
          }}
        />
        
        <PaymentMethodCard onSelect={handleMethodSelect} includeCash={true} />

        <Card>
          <CardHeader>
            <CardTitle>Xác nhận thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPaymentCode === "CASH" ? (
              <Button
                onClick={handleCashConfirm}
                disabled={isProcessing || finalTotal <= 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Xác nhận đã nhận tiền mặt - ${finalTotal.toLocaleString("vi-VN")}đ`
                )}
              </Button>
            ) : (
              <Button
                onClick={handleVnpayPayment}
                disabled={isProcessing || finalTotal <= 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo thanh toán...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Thanh toán {finalTotal.toLocaleString("vi-VN")}đ
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        {renderPaymentContent()}
      </div>

      <div className="shrink-0 w-80">
        <BookingOrderSummary
          movieInfo={movieInfo}
          seats={actualSeats}
          seatsTotal={actualSeatsTotal}
          concessions={actualConcessions}
          concessionsTotal={actualConcessionsTotal}
          total={finalTotal}
          discount={discountValue}
          earnedPoints={earnedPoints}
          title="Đơn hàng"
          showSeatTypeStats={false}
          showtimeId={showtimeId}
          userId={userId}
        />
      </div>
    </div>
  )
}

