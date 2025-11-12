"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Ticket, CreditCard, User, QrCode, Loader2, RefreshCw } from "lucide-react"
import { OrderDetail, generateQRCode } from "@/src/api/orders"
import { QRCodeSVG } from "qrcode.react"

interface OrderDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderDetail: OrderDetail | null
  loading: boolean
  onQRGenerated?: (updatedOrder: OrderDetail) => void
}

export function OrderDetailModal({ open, onOpenChange, orderDetail, loading, onQRGenerated }: OrderDetailModalProps) {
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  if (!orderDetail && !loading) return null

  const handleGenerateQR = async () => {
    if (!orderDetail) return
    
    try {
      setGeneratingQR(true)
      setQrError(null)
      const updatedOrder = await generateQRCode(orderDetail.orderId)
      if (onQRGenerated) {
        onQRGenerated(updatedOrder)
      }
    } catch (error: any) {
      console.error("Failed to generate QR code:", error)
      setQrError(error?.response?.data?.message || error?.message || "Không thể tạo mã QR. Vui lòng thử lại.")
    } finally {
      setGeneratingQR(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
            Hoàn thành
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
            Đang chờ
          </Badge>
        )
      case "UPCOMING":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
            Sắp tới
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
            Đã hủy
          </Badge>
        )
      default:
        return <Badge className="text-sm px-3 py-1">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Chi tiết đơn hàng
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-gray-600">Đang tải...</div>
        ) : orderDetail ? (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng</p>
                  <p className="text-lg font-bold text-gray-900">{orderDetail.orderCode || "N/A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <div className="mt-1">{getStatusBadge(orderDetail.orderStatus)}</div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Tên khách hàng</p>
                  <p className="text-base font-medium text-gray-900">{orderDetail.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo đơn</p>
                  <p className="text-base font-medium text-gray-900">{formatDate(orderDetail.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Movie Info */}
            {orderDetail.movieName && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Thông tin phim
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Tên phim</p>
                      <p className="text-base font-medium text-gray-900">{orderDetail.movieName}</p>
                    </div>
                    {orderDetail.roomName && (
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Phòng chiếu
                        </p>
                        <p className="text-base font-medium text-gray-900">{orderDetail.roomName}</p>
                      </div>
                    )}
                    {orderDetail.showtimeStart && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Giờ bắt đầu
                          </p>
                          <p className="text-base font-medium text-gray-900">{formatTime(orderDetail.showtimeStart)}</p>
                        </div>
                        {orderDetail.showtimeEnd && (
                          <div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Giờ kết thúc
                            </p>
                            <p className="text-base font-medium text-gray-900">{formatTime(orderDetail.showtimeEnd)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {orderDetail.seats && orderDetail.seats.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Ghế đã chọn</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {orderDetail.seats.map((seat, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                              {seat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Payment Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Thông tin thanh toán
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-base text-gray-600">Tổng tiền</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {orderDetail.totalPrice.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                {orderDetail.paymentMethods && orderDetail.paymentMethods.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {orderDetail.paymentMethods.map((method, idx) => (
                        <Badge key={idx} variant="secondary" className="text-sm">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {orderDetail.bookingCode && (
                  <div>
                    <p className="text-sm text-gray-600">Mã đặt chỗ</p>
                    <p className="text-base font-medium text-gray-900">{orderDetail.bookingCode}</p>
                  </div>
                )}
                {orderDetail.reservationCode && (
                  <div>
                    <p className="text-sm text-gray-600">Mã đặt trước</p>
                    <p className="text-base font-medium text-gray-900">{orderDetail.reservationCode}</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                Mã QR
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                {qrError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{qrError}</p>
                  </div>
                )}
                
                {!orderDetail.qrAvailable ? (
                  <div className="text-center py-6">
                    <Badge variant="outline" className="text-base px-4 py-2 mb-3">
                      Mã QR chưa khả dụng
                    </Badge>
                    <p className="text-sm text-gray-600 mt-3 mb-4">
                      Đơn hàng này chưa hỗ trợ tạo mã QR
                    </p>
                  </div>
                ) : orderDetail.qrExpired ? (
                  <div className="text-center py-6">
                    <Badge variant="destructive" className="text-base px-4 py-2 mb-3">
                      Mã QR đã hết hạn
                    </Badge>
                    {orderDetail.regenerateAllowed ? (
                      <>
                        <p className="text-sm text-gray-600 mt-3 mb-4">
                          Bạn có thể tạo lại mã QR mới
                        </p>
                        <Button 
                          onClick={handleGenerateQR}
                          disabled={generatingQR}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {generatingQR ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang tạo mã QR...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Tạo lại mã QR
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 mt-3">
                        Không thể tạo lại mã QR cho đơn hàng này
                      </p>
                    )}
                  </div>
                ) : orderDetail.qrJwt ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <QRCodeSVG 
                        value={orderDetail.qrJwt}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                        Mã QR hợp lệ
                      </Badge>
                      {orderDetail.graceMinutes && (
                        <p className="text-sm text-gray-600">
                          Thời gian gia hạn: {orderDetail.graceMinutes} phút
                        </p>
                      )}
                      {orderDetail.qrExpiryAt && (
                        <p className="text-xs text-gray-500">
                          Hết hạn: {new Date(orderDetail.qrExpiryAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : orderDetail.qrImageUrl ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <img 
                        src={orderDetail.qrImageUrl} 
                        alt="QR Code" 
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                        Mã QR hợp lệ
                      </Badge>
                      {orderDetail.graceMinutes && (
                        <p className="text-sm text-gray-600 mt-2">
                          Thời gian gia hạn: {orderDetail.graceMinutes} phút
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Badge variant="outline" className="text-base px-4 py-2 mb-3">
                      Mã QR chưa được tạo
                    </Badge>
                    <p className="text-sm text-gray-600 mt-3 mb-4">
                      Nhấn nút bên dưới để tạo mã QR cho đơn hàng này
                    </p>
                    <Button 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tạo mã QR...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Tạo mã QR
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-600">Không tìm thấy thông tin đơn hàng</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
