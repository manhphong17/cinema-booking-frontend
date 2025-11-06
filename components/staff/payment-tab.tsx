"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, QrCode } from "lucide-react"
import { toast } from "sonner"
import BookingOrderSummary, { SeatInfo, ConcessionInfo } from "@/components/booking/booking-order-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PaymentMethod = "cash" | "vnpay"

interface PaymentTabProps {
  seats: SeatInfo[]
  seatsTotal: number
  concessions: ConcessionInfo[]
  concessionsTotal: number
  total: number
  onPaymentSuccess: () => void
  onNavigateToTickets?: () => void // Callback để chuyển về tab tickets
}

export function PaymentTab({ seats, seatsTotal, concessions, concessionsTotal, total, onPaymentSuccess, onNavigateToTickets }: PaymentTabProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [vnpayUrl, setVnpayUrl] = useState<string | null>(null)
  const [vnpayQrCode, setVnpayQrCode] = useState<string | null>(null)
  const [vnpayTransactionId, setVnpayTransactionId] = useState<string | null>(null)
  const [vnpayPaid, setVnpayPaid] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
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
  }

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
      
      // Gọi callback sau 1 giây
      setTimeout(() => {
        onPaymentSuccess()
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
  }, [onPaymentSuccess, onNavigateToTickets])

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
      
      // Generate transaction ID
      const txnRef = `TXN${Date.now()}`
      setVnpayTransactionId(txnRef)
      
      // DEMO: Tạo QR code demo trực tiếp từ API QR generator
      // Trong production, sẽ gọi API backend để tạo payment
      const currentUrl = window.location.origin + window.location.pathname
      const returnUrl = `${currentUrl}?payment=vnpay&txnRef=${txnRef}`
      
      const demoPaymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?amount=${total}&command=pay&createDate=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}&currCode=VND&locale=vn&returnUrl=${encodeURIComponent(returnUrl)}&txnRef=${txnRef}`
      
      // Tạo QR code từ URL demo
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(demoPaymentUrl)}`
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // DEMO: Set QR code và URL
      setVnpayQrCode(qrImageUrl)
      setVnpayUrl(demoPaymentUrl)
      
      toast.success("Đã tạo mã QR thanh toán VNPay (Demo)")
      toast.info("Sau khi thanh toán, hệ thống sẽ tự động cập nhật")
      
      // PRODUCTION CODE (đã comment):
      // Gọi API để tạo payment với VNPay
      // const res = await fetch("/api/payment/vnpay", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     total: total,
      //     returnUrl: returnUrl,
      //   }),
      // })
      // if (!res.ok) {
      //   throw new Error("Không thể tạo thanh toán VNPay")
      // }
      // const data = await res.json()
      // setVnpayTransactionId(data.transactionId || data.txnRef)
      // if (data.qrCode) {
      //   setVnpayQrCode(data.qrCode)
      // } else if (data.paymentUrl) {
      //   setVnpayUrl(data.paymentUrl)
      // } else {
      //   throw new Error("Dữ liệu thanh toán không hợp lệ")
      // }
    } catch (error: any) {
      console.error("VNPay payment error:", error)
      toast.error(error?.message || "Lỗi khi tạo thanh toán VNPay")
      setIsProcessing(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCashConfirm = async () => {
    try {
      setIsProcessing(true)
      
      // DEMO: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // DEMO: Mock booking creation
      console.log("DEMO: Creating booking with:", {
        seats,
        concessions,
        total,
        paymentMethod: "cash"
      })
      
      setCashConfirmed(true)
      
      // Gọi callback sau khi hiển thị success screen 2 giây
      setTimeout(() => {
        onPaymentSuccess()
        // Reset state để sẵn sàng cho lần thanh toán tiếp theo
        setCashConfirmed(false)
        setSelectedMethod("cash")
        setVnpayUrl(null)
        setVnpayQrCode(null)
      }, 2000)
      
      // PRODUCTION CODE (đã comment):
      // Tạo booking với phương thức thanh toán tiền mặt
      // const bookingData = {
      //   seats: seats.map(s => s.id),
      //   concessions: concessions.map(c => ({ id: c.id, quantity: c.quantity })),
      //   total: total,
      //   paymentMethod: "cash"
      // }
      // const response = await apiClient.post("/bookings/create", bookingData)
      // if (response.data.status === 200) {
      //   setCashConfirmed(true)
      //   toast.success("Đã xác nhận thanh toán tiền mặt")
      //   setTimeout(() => {
      //     onPaymentSuccess()
      //     setCashConfirmed(false)
      //     setSelectedMethod("cash")
      //   }, 1000)
      // } else {
      //   throw new Error("Không thể tạo booking")
      // }
    } catch (error: any) {
      console.error("Cash payment error:", error)
      toast.error(error?.message || "Lỗi khi xác nhận thanh toán")
    } finally {
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
                Tổng tiền: {total.toLocaleString("vi-VN")}đ
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
                Tổng tiền: {total.toLocaleString("vi-VN")}đ
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
      <Card>
        <CardHeader>
          <CardTitle>Chọn phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedMethod} onValueChange={(value) => handleMethodSelect(value as PaymentMethod)}>
            <div className="flex items-center space-x-2 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-3">
                <img src="/cash.png" alt="Tiền mặt" className="w-8 h-8" />
                <span className="font-semibold">Tiền mặt</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="vnpay" id="vnpay" />
              <Label htmlFor="vnpay" className="flex-1 cursor-pointer flex items-center gap-3">
                <img src="/vnpay-logo.png" alt="VNPay" className="w-8 h-8" />
                <span className="font-semibold">VNPay</span>
              </Label>
            </div>
          </RadioGroup>

          {selectedMethod === "cash" && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleCashConfirm}
                disabled={isProcessing || total === 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đã nhận tiền mặt"
                )}
              </Button>
            </div>
          )}

          {selectedMethod === "vnpay" && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleVnpayPayment}
                disabled={isProcessing || total === 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo mã QR...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Tạo mã QR thanh toán
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        {renderPaymentContent()}
      </div>

      <div className="shrink-0 w-80">
        <BookingOrderSummary
          seats={seats}
          seatsTotal={seatsTotal}
          concessions={concessions}
          concessionsTotal={concessionsTotal}
          total={total}
          title="Đơn hàng"
          showSeatTypeStats={false}
        />
      </div>
    </div>
  )
}

