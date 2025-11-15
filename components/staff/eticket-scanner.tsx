"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Scan, CheckCircle, XCircle, Clock, User, MapPin, Calendar, Loader2 } from "lucide-react"
import { verifyTicket, markTicketAsUsed, TicketCheckResult } from "@/src/api/orders"
import { toast } from "sonner"
import { extractQRInfoFromString } from "@/src/utils/qr-decoder"

interface TicketInfo {
  code: string
  movieTitle: string
  showtime: string
  theater: string
  seats: string[]
  customerName: string
  purchaseDate: string
  status: "valid" | "used" | "expired" | "invalid"
  totalAmount: number
  orderId?: number
}

export function ETicketScanner() {
  const [ticketCode, setTicketCode] = useState("")
  const [scannedTicket, setScannedTicket] = useState<TicketInfo | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isMarkingAsUsed, setIsMarkingAsUsed] = useState(false)
  const [scanHistory, setScanHistory] = useState<TicketInfo[]>([])

  // Convert API response to TicketInfo format
  const convertToTicketInfo = (result: TicketCheckResult, code: string): TicketInfo => {
    // Format showtime for display
    const formatShowtime = (showtime: string | null) => {
      if (!showtime) return ""
      try {
        const date = new Date(showtime)
        return date.toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      } catch {
        return showtime
      }
    }

    // Format purchase date
    const formatPurchaseDate = (date: string) => {
      try {
        const d = new Date(date)
        return d.toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      } catch {
        return date
      }
    }

    return {
      code: code || result.orderCode,
      movieTitle: result.movieName || "Không có thông tin",
      showtime: formatShowtime(result.showtimeStart),
      theater: result.roomName || "Không có thông tin",
      seats: result.seats,
      customerName: result.customerName || "Không có thông tin",
      purchaseDate: formatPurchaseDate(result.purchaseDate),
      status: result.status,
      totalAmount: result.totalAmount,
      orderId: result.orderId,
    }
  }

  const handleManualScan = async () => {
    if (!ticketCode.trim()) return

    // Extract thông tin từ QR (hỗ trợ cả JSON và JWT)
    const qrInfo = extractQRInfoFromString(ticketCode.trim())
    
    // Nếu là JWT token và có thông tin, hiển thị ngay lập tức
    if (qrInfo.userName || qrInfo.orderId) {
      // Hiển thị thông tin dễ đọc thay vì token dài
      const displayCode = qrInfo.orderCode || (qrInfo.orderId ? `Order #${qrInfo.orderId}` : ticketCode.trim().substring(0, 20) + "...")
      
      // Tạo ticket info từ QR ngay lập tức (không cần chờ API)
      const quickTicket: TicketInfo = {
        code: displayCode,
        movieTitle: qrInfo.movie || "Đang tải...",
        showtime: qrInfo.start 
          ? new Date(qrInfo.start).toLocaleString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Đang tải...",
        theater: qrInfo.room || "Đang tải...",
        seats: qrInfo.seats || [],
        customerName: qrInfo.userName || "Đang tải...",
        purchaseDate: "Đang tải...",
        status: "valid", // Tạm thời, sẽ update sau khi verify
        totalAmount: 0,
        orderId: qrInfo.orderId || undefined,
      }
      
      // Hiển thị thông tin ngay lập tức
      setScannedTicket(quickTicket)
      toast.info(`📱 Đã quét QR: ${qrInfo.userName || "Khách hàng"}${qrInfo.orderId ? ` | Order #${qrInfo.orderId}` : ''}`, { 
        duration: 2000 
      })
    }

    setIsVerifying(true)
    try {
      // Verify với backend để lấy đầy đủ thông tin và verify signature
      const result = await verifyTicket(ticketCode.trim())
      const ticket = convertToTicketInfo(result, qrInfo.orderCode || ticketCode.trim())
      
      // Ưu tiên thông tin từ QR JWT nếu có (nhanh hơn, không cần chờ API)
      if (qrInfo.userName && !ticket.customerName) {
        ticket.customerName = qrInfo.userName
      }
      if (qrInfo.orderId && !ticket.orderId) {
        ticket.orderId = qrInfo.orderId
      }
      
      setScannedTicket(ticket)
      
      // Add to scan history if not already there
      setScanHistory((prev) => {
        const exists = prev.find((t) => t.code === ticket.code || t.orderId === ticket.orderId)
        if (!exists) {
          return [ticket, ...prev.slice(0, 9)] // Keep last 10 scans
        }
        return prev
      })
      
      if (ticket.status === "valid") {
        toast.success("✅ Vé hợp lệ!")
      } else if (ticket.status === "used") {
        toast.warning("⚠️ Vé đã được sử dụng")
      } else if (ticket.status === "expired") {
        toast.error("⏰ Vé đã hết hạn")
      } else {
        toast.error("❌ Vé không hợp lệ")
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Không tìm thấy vé với mã này"
      
      // Nếu là QR JWT, vẫn giữ thông tin đã extract (ngay cả khi verify fail)
      if (qrInfo.userName || qrInfo.orderId) {
        // Cập nhật status thành invalid nhưng giữ thông tin từ QR
        if (scannedTicket) {
          setScannedTicket({
            ...scannedTicket,
            status: "invalid",
            movieTitle: scannedTicket.movieTitle === "Đang tải..." ? "Không tìm thấy" : scannedTicket.movieTitle,
            showtime: scannedTicket.showtime === "Đang tải..." ? "" : scannedTicket.showtime,
            theater: scannedTicket.theater === "Đang tải..." ? "Không tìm thấy" : scannedTicket.theater,
          })
        }
        
        toast.error(errorMessage, {
          description: qrInfo.userName 
            ? `Khách hàng: ${qrInfo.userName}${qrInfo.orderId ? ` | Order ID: #${qrInfo.orderId}` : ''}`
            : undefined
        })
      } else {
        toast.error(errorMessage)
        
        setScannedTicket({
          code: ticketCode.trim().toUpperCase(),
          movieTitle: "Không tìm thấy",
          showtime: "",
          theater: "",
          seats: [],
          customerName: "",
          purchaseDate: "",
          status: "invalid",
          totalAmount: 0,
        })
      }
    } finally {
      setIsVerifying(false)
      setTicketCode("")
    }
  }

  const handleQRScan = async () => {
    setIsScanning(true)
    // In a real app, this would use a camera QR scanner library
    // For now, we'll prompt the user to enter the QR code manually
    // You can integrate libraries like html5-qrcode or react-qr-reader here
    toast.info("Tính năng quét QR sẽ được tích hợp camera. Vui lòng nhập mã vé thủ công.")
    setIsScanning(false)
    
    // Example: If you have a QR scanner library, you would do:
    // const qrCode = await scanQRCode() // Your QR scanner function
    // if (qrCode) {
    //   await handleVerifyTicket(qrCode)
    // }
  }

  const handleMarkTicketAsUsed = async () => {
    if (!scannedTicket || scannedTicket.status !== "valid" || !scannedTicket.orderId) {
      return
    }

    setIsMarkingAsUsed(true)
    try {
      const result = await markTicketAsUsed(scannedTicket.orderId)
      const updatedTicket = convertToTicketInfo(result, scannedTicket.code)
      
      setScannedTicket(updatedTicket)
      
      // Update scan history
      setScanHistory((prev) =>
        prev.map((t) =>
          t.code === updatedTicket.code || t.orderId === updatedTicket.orderId ? updatedTicket : t
        )
      )
      
      toast.success("Đã xác nhận sử dụng vé thành công!")
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể xác nhận sử dụng vé"
      toast.error(errorMessage)
    } finally {
      setIsMarkingAsUsed(false)
    }
  }

  const getStatusColor = (status: TicketInfo["status"]) => {
    switch (status) {
      case "valid":
        return "bg-green-500"
      case "used":
        return "bg-blue-500"
      case "expired":
        return "bg-orange-500"
      case "invalid":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: TicketInfo["status"]) => {
    switch (status) {
      case "valid":
        return "Hợp lệ"
      case "used":
        return "Đã sử dụng"
      case "expired":
        return "Hết hạn"
      case "invalid":
        return "Không hợp lệ"
      default:
        return "Không xác định"
    }
  }

  const getStatusIcon = (status: TicketInfo["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "used":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "expired":
        return <Clock className="h-5 w-5 text-orange-500" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Quét vé điện tử
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Nhập mã vé thủ công:</label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã vé (VD: TK001234567)"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                className="flex-1"
              />
              <Button onClick={handleManualScan} disabled={!ticketCode.trim() || isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  "Kiểm tra"
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">HOẶC</span>
            <Separator className="flex-1" />
          </div>

          {/* QR Scanner */}
          <div className="text-center space-y-3">
            <Button onClick={handleQRScan} disabled={isScanning} size="lg" className="w-full">
              <QrCode className="h-5 w-5 mr-2" />
              {isScanning ? "Đang quét..." : "Quét mã QR"}
            </Button>
            {isScanning && (
              <div className="p-8 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                <div className="animate-pulse text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Đang quét mã QR...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {scannedTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Kết quả quét</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(scannedTicket.status)}
                <Badge className={getStatusColor(scannedTicket.status)}>{getStatusText(scannedTicket.status)}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scannedTicket.status !== "invalid" ? (
              <div className="space-y-4">
                {/* Highlight Order ID and Username from QR */}
                {(scannedTicket.orderId || scannedTicket.customerName) && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Thông tin từ QR Code</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scannedTicket.orderId && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-700">Order ID:</span>
                          <Badge variant="outline" className="font-mono font-bold text-blue-700 border-blue-300">
                            #{scannedTicket.orderId}
                          </Badge>
                        </div>
                      )}
                      {scannedTicket.customerName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Khách hàng:</span>
                          <span className="text-sm font-semibold text-blue-900">{scannedTicket.customerName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã đơn hàng:</label>
                      <p className="font-mono text-lg">{scannedTicket.code}</p>
                    </div>
                    {scannedTicket.orderId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID đơn hàng:</label>
                        <p className="font-mono text-sm text-muted-foreground">#{scannedTicket.orderId}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phim:</label>
                      <p className="font-semibold">{scannedTicket.movieTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Suất chiếu:</label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {scannedTicket.showtime}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phòng chiếu:</label>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {scannedTicket.theater}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ghế:</label>
                      <p className="font-semibold">{scannedTicket.seats.join(", ")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Khách hàng:</label>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {scannedTicket.customerName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngày mua:</label>
                      <p className="text-sm">{scannedTicket.purchaseDate}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tổng tiền:</label>
                    <p className="text-xl font-bold text-primary">
                      {scannedTicket.totalAmount.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  {scannedTicket.status === "valid" && (
                    <Button onClick={handleMarkTicketAsUsed} size="lg" disabled={isMarkingAsUsed}>
                      {isMarkingAsUsed ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xác nhận...
                        </>
                      ) : (
                        "Xác nhận sử dụng vé"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">Vé không hợp lệ</h3>
                <p className="text-muted-foreground">
                  Không tìm thấy thông tin vé với mã: <span className="font-mono">{scannedTicket.code}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử quét vé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanHistory.map((ticket, index) => (
                <div
                  key={`${ticket.code}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <p className="font-medium">{ticket.code}</p>
                      <p className="text-sm text-muted-foreground">{ticket.movieTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(ticket.status)}>{getStatusText(ticket.status)}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{ticket.showtime}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
