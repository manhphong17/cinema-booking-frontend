"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, QrCode } from "lucide-react"
import { toast } from "sonner"

type PaymentMethod = "cash" | "vnpay"

interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onPaymentSuccess: () => void
}

export function PaymentMethodModal({ open, onOpenChange, total, onPaymentSuccess }: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [vnpayUrl, setVnpayUrl] = useState<string | null>(null)
  const [vnpayQrCode, setVnpayQrCode] = useState<string | null>(null)

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setCashConfirmed(false)
    setVnpayUrl(null)
    setVnpayQrCode(null)
  }

  const handleVnpayPayment = async () => {
    try {
      setIsProcessing(true)
      
      // Gọi API để tạo payment với VNPay
      const res = await fetch("/api/payment/vnpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total: total,
        }),
      })

      if (!res.ok) {
        throw new Error("Không thể tạo thanh toán VNPay")
      }

      const data = await res.json()
      
      // Có thể API trả về QR code hoặc payment URL
      // Nếu có QR code thì hiển thị, nếu không thì redirect
      if (data.qrCode) {
        setVnpayQrCode(data.qrCode)
      } else if (data.paymentUrl) {
        setVnpayUrl(data.paymentUrl)
        // Nếu có paymentUrl nhưng muốn hiển thị QR, có thể tạo QR từ URL
        // Hoặc mở window mới để redirect
      } else {
        throw new Error("Dữ liệu thanh toán không hợp lệ")
      }
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
      
      // Tạo booking với phương thức thanh toán tiền mặt
      // TODO: Gọi API tạo booking ở đây
      // const response = await apiClient.post("/bookings/create", {...})
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCashConfirmed(true)
      toast.success("Đã xác nhận thanh toán tiền mặt")
      
      // Đóng modal sau 1 giây và gọi callback
      setTimeout(() => {
        onPaymentSuccess()
        handleClose()
      }, 1000)
    } catch (error: any) {
      console.error("Cash payment error:", error)
      toast.error(error?.message || "Lỗi khi xác nhận thanh toán")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing && !cashConfirmed) {
      setSelectedMethod("cash")
      setCashConfirmed(false)
      setVnpayUrl(null)
      setVnpayQrCode(null)
      onOpenChange(false)
    }
  }

  const renderPaymentContent = () => {
    if (vnpayQrCode) {
      // Hiển thị QR code
      return (
        <div className="space-y-4">
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
        </div>
      )
    }

    if (vnpayUrl && !vnpayQrCode) {
      // Nếu chỉ có URL mà không có QR code, tạo QR từ URL
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(vnpayUrl)}`
      return (
        <div className="space-y-4">
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
        </div>
      )
    }

    if (cashConfirmed) {
      return (
        <div className="text-center space-y-4 py-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Thanh toán thành công!</h3>
            <p className="text-sm text-muted-foreground">Đã xác nhận nhận tiền mặt</p>
          </div>
        </div>
      )
    }

    // Chọn phương thức thanh toán
    return (
      <div className="space-y-6">
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
              disabled={isProcessing}
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
              disabled={isProcessing}
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
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
          <DialogDescription>
            Tổng tiền: <span className="font-semibold text-foreground">{total.toLocaleString("vi-VN")}đ</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderPaymentContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

