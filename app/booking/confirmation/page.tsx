"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, Share2, Home, Calendar, Clock, MapPin, Users, QrCode } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

// Mock data
const bookingData = {
  id: "BK1703123456",
  movie: {
    title: "Avengers: Endgame",
    poster: "/generic-superhero-team-poster.png",
    time: "20:00",
    date: "2024-12-20",
    hall: "Hall 1"
  },
  seats: ["E5", "E6", "F5", "F6"],
  total: 600000,
  customer: {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0123456789"
  },
  paymentMethod: "Thẻ tín dụng",
  bookingTime: "2024-12-20 18:30:00"
}

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadTicket = () => {
    setIsDownloading(true)
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false)
      alert("Vé điện tử đã được tải xuống!")
    }, 1000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Vé xem phim ${bookingData.movie.title}`,
        text: `Tôi đã đặt vé xem phim ${bookingData.movie.title} tại rạp chiếu phim`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link đã được sao chép!")
    }
  }

  const getSeatType = (seatId: string) => {
    const row = seatId[0]
    if (row === 'H') return 'Premium'
    if (['E', 'F', 'G'].includes(row)) return 'VIP'
    return 'Thường'
  }

  const getSeatPrice = (seatId: string) => {
    const row = seatId[0]
    if (row === 'H') return 200000
    if (['E', 'F', 'G'].includes(row)) return 150000
    return 100000
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg text-muted-foreground mb-6">
             Bạn đã đặt vé thành công.
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-green-500 rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Chi tiết đặt vé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Movie Info */}
                <div className="flex gap-4">
                  <img
                    src={bookingData.movie.poster}
                    alt={bookingData.movie.title}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{bookingData.movie.title}</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{bookingData.movie.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{bookingData.movie.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{bookingData.movie.hall}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Thông tin đặt vé</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mã đặt vé:</span>
                        <span className="font-medium">{bookingData.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Thời gian đặt:</span>
                        <span className="font-medium">{bookingData.bookingTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phương thức thanh toán:</span>
                        <span className="font-medium">{bookingData.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Thông tin khách hàng</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Họ tên:</span>
                        <span className="font-medium">{bookingData.customer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{bookingData.customer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SĐT:</span>
                        <span className="font-medium">{bookingData.customer.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Seats */}
                <div>
                  <h4 className="font-semibold mb-3">Ghế đã chọn</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {bookingData.seats.map(seatId => (
                      <div key={seatId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium">Ghế {seatId}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getSeatType(seatId)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions & QR Code */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Vé điện tử
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quét mã QR tại rạp để vào xem phim
                  </p>
                </div>

                {/* Total Amount */}
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Tổng thanh toán</p>
                    <p className="text-2xl font-bold text-primary">
                      {bookingData.total.toLocaleString()}đ
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleDownloadTicket}
                    disabled={isDownloading}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg"
                  >
                    {isDownloading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang tải...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Tải vé điện tử
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>

                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Về trang chủ
                  </Button>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Lưu ý quan trọng:</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Vui lòng đến rạp trước 15 phút</li>
                    <li>• Mang theo CMND/CCCD để đối chiếu</li>
                    <li>• Vé không được hoàn trả sau khi mua</li>
                    <li>• Liên hệ hotline nếu cần hỗ trợ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
