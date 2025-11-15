"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Ticket, CreditCard, User, QrCode, Loader2, RefreshCw, ShoppingBag } from "lucide-react"
import { OrderDetail, generateQRCode } from "@/src/api/orders"
import { QRCodeSVG } from "qrcode.react"
import { extractQRInfo, extractQRInfoFromString, createQRJSON } from "@/src/utils/qr-decoder"

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

      // 🧠 MERGE: giữ lại thông tin cũ (tên khách, phim, concessions, …)
      const mergedOrder: OrderDetail = {
        ...orderDetail,       // dữ liệu đang hiển thị
        ...updatedOrder,      // ghi đè các field QR mới, status mới, v.v.
        // đảm bảo nếu API không trả concessions thì vẫn giữ concessions cũ
        concessions:
            updatedOrder.concessions && updatedOrder.concessions.length > 0
                ? updatedOrder.concessions
                : orderDetail.concessions,
      }

      if (onQRGenerated) {
        onQRGenerated(mergedOrder)
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

            {/* Concessions Info */}
            {(() => {
              console.log("Checking concessions:", orderDetail.concessions);
              console.log("Concessions length:", orderDetail.concessions?.length);
              return orderDetail.concessions && orderDetail.concessions.length > 0;
            })() && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  Đồ ăn & Thức uống
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {orderDetail.concessions?.map((concession, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex-shrink-0">
                        <img 
                          src={concession.urlImage} 
                          alt={concession.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-food.png';
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-900">{concession.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            Số lượng: <span className="font-medium">{concession.quantity}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Đơn giá: <span className="font-medium">{concession.unitPrice.toLocaleString('vi-VN')} đ</span>
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-semibold text-blue-600">
                            Thành tiền: {(concession.quantity * concession.unitPrice).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-gray-700">Tổng tiền đồ ăn & thức uống:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(orderDetail.concessions || []).reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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

              </div>
            </div>

            {/* QR Code Section */}
            {/* QR Code Section - phiên bản gọn, sạch, dễ nhìn hơn */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                Mã QR vé xem phim
              </h3>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center gap-4 shadow-sm">
                {/* Thông báo lỗi nếu có */}
                {qrError && (
                    <div className="w-full mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{qrError}</p>
                    </div>
                )}

                {/* Trạng thái không hỗ trợ QR */}
                {!orderDetail.qrAvailable ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Badge variant="outline" className="text-base px-4 py-1 rounded-full">
                        Mã QR chưa khả dụng
                      </Badge>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        Đơn hàng này hiện chưa hỗ trợ sử dụng mã QR. Vui lòng dùng mã đặt chỗ hoặc thông tin vé để check-in.
                      </p>
                    </div>
                ) : orderDetail.qrExpired ? (
                    // Trạng thái QR hết hạn
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Badge variant="destructive" className="text-base px-4 py-1 rounded-full">
                        Mã QR đã hết hạn
                      </Badge>
                      {orderDetail.regenerateAllowed ? (
                          <>
                            <p className="text-sm text-gray-600 text-center max-w-md">
                              Bạn có thể tạo lại mã QR mới để tiếp tục sử dụng vé này.
                            </p>
                            <Button
                                onClick={handleGenerateQR}
                                disabled={generatingQR}
                                className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
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
                          <p className="text-sm text-gray-600 text-center max-w-md">
                            Không thể tạo lại mã QR cho đơn hàng này. Vui lòng liên hệ nhân viên để được hỗ trợ.
                          </p>
                      )}
                    </div>
                ) : orderDetail.qrJwt || orderDetail.payloadJson ? (
                    // Trạng thái có QR - dùng JSON trực tiếp (dễ đọc hơn JWT)
                    (() => {
                      // Tạo JSON từ orderDetail để encode vào QR (format mới - đơn giản)
                      const qrJSON = createQRJSON({
                        orderId: orderDetail.orderId,
                        orderCode: orderDetail.orderCode,
                        reservationCode: orderDetail.reservationCode,
                        orderStatus: orderDetail.orderStatus,
                        movieName: orderDetail.movieName,
                        roomName: orderDetail.roomName,
                        showtimeStart: orderDetail.showtimeStart,
                        showtimeEnd: orderDetail.showtimeEnd,
                        seats: orderDetail.seats,
                        userName: orderDetail.userName,
                        userId: orderDetail.userId,
                      })
                      
                      // Extract thông tin để hiển thị
                      const qrInfo = extractQRInfoFromString(qrJSON)
                      
                      return (
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md">
                            <QRCodeSVG
                                value={qrJSON}
                                size={220}
                                level="H"
                                includeMargin={true}
                            />
                          </div>
                          <div className="text-center space-y-2 w-full">
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full">
                              Mã QR hợp lệ
                            </Badge>
                            
                            {/* Hiển thị Order ID và Username từ QR */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 mt-2">
                              {qrInfo.orderId && (
                                <div className="flex items-center justify-center gap-2">
                                  <Ticket className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-gray-700">Order ID:</span>
                                  <span className="text-sm font-bold text-blue-700">#{qrInfo.orderId}</span>
                                </div>
                              )}
                              {qrInfo.userName && (
                                <div className="flex items-center justify-center gap-2">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-gray-700">Khách hàng:</span>
                                  <span className="text-sm font-semibold text-blue-700">{qrInfo.userName}</span>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600">
                              Quét mã này sẽ hiển thị thông tin đơn hàng dễ đọc. Hãy đưa cho nhân viên soát vé.
                            </p>
                            {orderDetail.graceMinutes && (
                                <p className="text-xs text-gray-500">
                                  Thời gian gia hạn: {orderDetail.graceMinutes} phút
                                </p>
                            )}
                            {orderDetail.qrExpiryAt && (
                                <p className="text-xs text-gray-400">
                                  Hết hạn: {new Date(orderDetail.qrExpiryAt).toLocaleString("vi-VN")}
                                </p>
                            )}
                          </div>
                        </div>
                      )
                    })()
                ) : orderDetail.qrImageUrl ? (
                    // Trạng thái có QR dạng ảnh
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md">
                        <img
                            src={orderDetail.qrImageUrl}
                            alt="QR Code"
                            className="w-56 h-56 object-contain"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full">
                          Mã QR hợp lệ
                        </Badge>
                        {orderDetail.graceMinutes && (
                            <p className="text-xs text-gray-500">
                              Thời gian gia hạn: {orderDetail.graceMinutes} phút
                            </p>
                        )}
                      </div>
                    </div>
                ) : (
                    // Trạng thái chưa tạo QR
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Badge variant="outline" className="text-base px-4 py-1 rounded-full">
                        Mã QR chưa được tạo
                      </Badge>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        Nhấn nút bên dưới để tạo mã QR cho đơn hàng này. Mã này sẽ được dùng để check-in nhanh tại rạp.
                      </p>
                      <Button
                          onClick={handleGenerateQR}
                          disabled={generatingQR}
                          className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
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
