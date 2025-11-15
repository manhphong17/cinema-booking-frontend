"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Scan, CheckCircle, XCircle, Clock, MapPin, Calendar, Loader2 } from "lucide-react"
import { verifyTicket, markTicketAsUsed, TicketCheckResult, Concession } from "@/src/api/orders"
import { toast } from "sonner"

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
  concessions?: Concession[]
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
      concessions: result.concessions || [],
    }
  }

  const handleManualScan = async () => {
    if (!ticketCode.trim()) return

    setIsVerifying(true)
    try {
      const result = await verifyTicket(ticketCode.trim())
      const ticket = convertToTicketInfo(result, ticketCode.trim())
      
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
        toast.success("Đơn hàng hợp lệ!")
      } else if (ticket.status === "used") {
        toast.warning("Đơn hàng đã được sử dụng")
      } else if (ticket.status === "expired") {
        toast.error("Đơn hàng đã hết hạn")
      } else {
        toast.error("Đơn hàng không hợp lệ")
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Không tìm thấy đơn hàng với mã này"
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
        concessions: [],
      })
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
    toast.info("Tính năng quét QR sẽ được tích hợp camera. Vui lòng nhập mã đơn hàng thủ công.")
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
      
      toast.success("Đã xác nhận sử dụng đơn hàng thành công!")
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể xác nhận sử dụng đơn hàng"
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
            Kiểm tra đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Nhập mã đơn hàng:</label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã đơn hàng (VD: ORD001234567)"
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
              {isScanning ? "Đang quét..." : "Quét mã QR đơn hàng"}
            </Button>
            {isScanning && (
              <div className="p-8 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                <div className="animate-pulse text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Đang quét mã QR đơn hàng...</p>
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
              <span>Kết quả kiểm tra</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(scannedTicket.status)}
                <Badge className={getStatusColor(scannedTicket.status)}>{getStatusText(scannedTicket.status)}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scannedTicket.status !== "invalid" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã đơn hàng:</label>
                      <p className="font-mono text-lg">{scannedTicket.code}</p>
                    </div>
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
                      <label className="text-sm font-medium text-muted-foreground">Ngày mua:</label>
                      <p className="text-sm">{scannedTicket.purchaseDate}</p>
                    </div>
                  </div>
                </div>

                {/* Concessions/Combo Section */}
                {scannedTicket.concessions && scannedTicket.concessions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">Combo/Đồ ăn kèm:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scannedTicket.concessions.map((concession, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50"
                          >
                            {concession.urlImage && (
                              <img
                                src={concession.urlImage}
                                alt={concession.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{concession.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Số lượng: {concession.quantity} × {concession.unitPrice.toLocaleString("vi-VN")}đ
                              </p>
                              <p className="text-xs font-semibold text-primary mt-1">
                                = {(concession.quantity * concession.unitPrice).toLocaleString("vi-VN")}đ
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-end">
                  {scannedTicket.status === "valid" && (
                    <Button onClick={handleMarkTicketAsUsed} size="lg" disabled={isMarkingAsUsed}>
                      {isMarkingAsUsed ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xác nhận...
                        </>
                      ) : (
                        "Xác nhận sử dụng đơn hàng"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">Đơn hàng không hợp lệ</h3>
                <p className="text-muted-foreground">
                  Không tìm thấy thông tin đơn hàng với mã: <span className="font-mono">{scannedTicket.code}</span>
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
            <CardTitle>Lịch sử kiểm tra</CardTitle>
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
