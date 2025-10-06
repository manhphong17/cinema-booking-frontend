"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Seat {
  id: string
  row: string
  number: number
  type: "standard" | "vip"
}

interface SeatManagementProps {
  roomId: string
  onBack: () => void
}

export function SeatManagement({ roomId, onBack }: SeatManagementProps) {
  const { toast } = useToast()
  const [seats, setSeats] = useState<Seat[]>([
    { id: "1", row: "A", number: 1, type: "standard" },
    { id: "2", row: "A", number: 2, type: "standard" },
    { id: "3", row: "A", number: 3, type: "vip" },
    { id: "4", row: "A", number: 4, type: "vip" },
    { id: "5", row: "B", number: 1, type: "standard" },
    { id: "6", row: "B", number: 2, type: "standard" },
    { id: "7", row: "B", number: 3, type: "standard" },
    { id: "8", row: "B", number: 4, type: "standard" },
  ])

  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  const rows = Array.from(new Set(seats.map((s) => s.row))).sort()
  const maxSeatsPerRow = Math.max(...rows.map((row) => seats.filter((s) => s.row === row).length))

  const toggleSeatSelection = (seatId: string) => {
    setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
  }

  const changeSeatType = (type: "standard" | "vip") => {
    if (selectedSeats.length === 0) {
      toast({ title: "Chưa chọn ghế", description: "Vui lòng chọn ghế để thay đổi loại", variant: "destructive" })
      return
    }
    setSeats(seats.map((seat) => (selectedSeats.includes(seat.id) ? { ...seat, type } : seat)))
    toast({
      title: "Cập nhật thành công",
      description: `Đã đổi ${selectedSeats.length} ghế sang ${type === "standard" ? "Standard" : "VIP"}`,
    })
    setSelectedSeats([])
  }

  const deleteSelectedSeats = () => {
    if (selectedSeats.length === 0) {
      toast({ title: "Chưa chọn ghế", description: "Vui lòng chọn ghế để xóa", variant: "destructive" })
      return
    }
    setSeats(seats.filter((seat) => !selectedSeats.includes(seat.id)))
    toast({ title: "Xóa thành công", description: `Đã xóa ${selectedSeats.length} ghế` })
    setSelectedSeats([])
  }

  const addRow = () => {
    const nextRow = String.fromCharCode(65 + rows.length)
    const newSeats: Seat[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      row: nextRow,
      number: i + 1,
      type: "standard",
    }))
    setSeats([...seats, ...newSeats])
    toast({ title: "Thêm thành công", description: `Đã thêm hàng ${nextRow}` })
  }

  const standardCount = seats.filter((s) => s.type === "standard").length
  const vipCount = seats.filter((s) => s.type === "vip").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Ghế ngồi</h1>
          <p className="text-muted-foreground mt-1">Phòng {roomId} - Cấu hình sơ đồ ghế</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="bg-card border-border p-6">
            <div className="mb-6 text-center">
              <div className="inline-block bg-muted px-8 py-2 rounded text-muted-foreground font-medium">MÀN HÌNH</div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row} className="flex items-center gap-2">
                  <div className="w-8 text-center font-medium text-foreground">{row}</div>
                  <div className="flex gap-2 flex-1 justify-center">
                    {seats
                      .filter((seat) => seat.row === row)
                      .sort((a, b) => a.number - b.number)
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeatSelection(seat.id)}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 operator-transition-all flex items-center justify-center text-xs font-medium",
                            seat.type === "standard" && "operator-bg-standard-seat operator-border-standard-seat text-white",
                            seat.type === "vip" && "operator-bg-vip-seat operator-border-vip-seat text-white",
                            selectedSeats.includes(seat.id) &&
                              "ring-2 ring-operator-primary ring-offset-2 ring-offset-operator-background scale-110",
                          )}
                        >
                          {seat.number}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded operator-bg-standard-seat"></div>
                <span className="operator-text-foreground">Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded operator-bg-vip-seat"></div>
                <span className="operator-text-foreground">VIP</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-3">Thống kê</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng ghế:</span>
                <Badge variant="outline" className="border-border text-foreground">
                  {seats.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Standard:</span>
                <Badge className="bg-standard-seat text-white">{standardCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">VIP:</span>
                <Badge className="bg-vip-seat text-white">{vipCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Đã chọn:</span>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {selectedSeats.length}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-3">Thao tác</h3>
            <div className="space-y-2">
              <Button onClick={addRow} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Thêm hàng ghế
              </Button>
              <Button
                onClick={() => changeSeatType("standard")}
                variant="outline"
                className="w-full operator-border-standard-seat operator-text-standard-seat operator-hover-standard-seat"
              >
                Đổi sang Standard
              </Button>
              <Button
                onClick={() => changeSeatType("vip")}
                variant="outline"
                className="w-full operator-border-vip-seat operator-text-vip-seat operator-hover-vip-seat"
              >
                Đổi sang VIP
              </Button>
              <Button
                onClick={deleteSelectedSeats}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa ghế đã chọn
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
