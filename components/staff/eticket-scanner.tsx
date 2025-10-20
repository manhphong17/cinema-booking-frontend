"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QrCode, Scan, CheckCircle, XCircle, Clock, User, MapPin, Calendar } from "lucide-react"

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
}

// Mock ticket database
const mockTickets: Record<string, TicketInfo> = {
  TK001234567: {
    code: "TK001234567",
    movieTitle: "Spider-Man: No Way Home",
    showtime: "2024-01-15 19:30",
    theater: "Phòng chiếu 1",
    seats: ["A5", "A6"],
    customerName: "Nguyễn Văn A",
    purchaseDate: "2024-01-10 14:30",
    status: "valid",
    totalAmount: 200000,
  },
  TK001234568: {
    code: "TK001234568",
    movieTitle: "The Batman",
    showtime: "2024-01-15 16:00",
    theater: "Phòng chiếu 2",
    seats: ["B3", "B4", "B5"],
    customerName: "Trần Thị B",
    purchaseDate: "2024-01-12 10:15",
    status: "used",
    totalAmount: 300000,
  },
  TK001234569: {
    code: "TK001234569",
    movieTitle: "Top Gun: Maverick",
    showtime: "2024-01-10 21:00",
    theater: "Phòng chiếu 3",
    seats: ["C1", "C2"],
    customerName: "Lê Văn C",
    purchaseDate: "2024-01-08 16:45",
    status: "expired",
    totalAmount: 180000,
  },
}

export function ETicketScanner() {
  const [ticketCode, setTicketCode] = useState("")
  const [scannedTicket, setScannedTicket] = useState<TicketInfo | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<TicketInfo[]>([])

  const handleManualScan = () => {
    if (!ticketCode.trim()) return

    const ticket = mockTickets[ticketCode.trim().toUpperCase()]
    if (ticket) {
      setScannedTicket(ticket)
      // Add to scan history if not already there
      setScanHistory((prev) => {
        const exists = prev.find((t) => t.code === ticket.code)
        if (!exists) {
          return [ticket, ...prev.slice(0, 9)] // Keep last 10 scans
        }
        return prev
      })
    } else {
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
    setTicketCode("")
  }

  const handleQRScan = () => {
    setIsScanning(true)
    // Simulate QR scanning process
    setTimeout(() => {
      // Mock QR scan result - in real app, this would use camera
      const mockQRResult = "TK001234567"
      const ticket = mockTickets[mockQRResult]
      if (ticket) {
        setScannedTicket(ticket)
        setScanHistory((prev) => {
          const exists = prev.find((t) => t.code === ticket.code)
          if (!exists) {
            return [ticket, ...prev.slice(0, 9)]
          }
          return prev
        })
      }
      setIsScanning(false)
    }, 2000)
  }

  const markTicketAsUsed = () => {
    if (scannedTicket && scannedTicket.status === "valid") {
      const updatedTicket = { ...scannedTicket, status: "used" as const }
      setScannedTicket(updatedTicket)
      // Update mock database
      mockTickets[scannedTicket.code] = updatedTicket
      // Update scan history
      setScanHistory((prev) => prev.map((t) => (t.code === scannedTicket.code ? updatedTicket : t)))
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
              <Button onClick={handleManualScan} disabled={!ticketCode.trim()}>
                Kiểm tra
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã vé:</label>
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
                      <label className="text-sm font-medium text-muted-foreground">Khách hàng:</label>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {scannedTicket.customerName}
                      </p>
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
                    <Button onClick={markTicketAsUsed} size="lg">
                      Xác nhận sử dụng vé
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
