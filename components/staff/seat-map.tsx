"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SeatMapProps {
  selectedSeats: string[]
  onSeatSelect: (seatId: string) => void
}

// Mock seat data - in real app this would come from API
const generateSeatMap = () => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
  const seatsPerRow = 12
  const bookedSeats = ["A3", "A4", "B7", "C5", "C6", "D8", "E2", "F9", "F10", "G3", "H7", "I5", "I6", "J8", "J9"]

  return rows.map((row) => {
    const seats = []
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatId = `${row}${i}`
      seats.push({
        id: seatId,
        row,
        number: i,
        isBooked: bookedSeats.includes(seatId),
        isVip: ["F", "G", "H"].includes(row) && i >= 4 && i <= 9, // VIP seats in middle rows
      })
    }
    return { row, seats }
  })
}

export function SeatMap({ selectedSeats, onSeatSelect }: SeatMapProps) {
  const seatMap = generateSeatMap()

  const getSeatStyle = (seat: { id: string; isBooked: boolean; isVip: boolean }) => {
    if (seat.isBooked) {
      return "bg-destructive text-destructive-foreground cursor-not-allowed"
    }
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-primary-foreground"
    }
    if (seat.isVip) {
      return "bg-yellow-600 text-white hover:bg-yellow-700"
    }
    return "bg-muted hover:bg-accent text-foreground"
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <span>Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded"></div>
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-destructive rounded"></div>
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <span>VIP</span>
        </div>
      </div>

      {/* Screen */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 px-12 py-2 rounded-t-full">
          <span className="text-sm font-medium">MÀN HÌNH</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-2 max-w-4xl mx-auto">
        {seatMap.map(({ row, seats }) => (
          <div key={row} className="flex items-center justify-center gap-1">
            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center mr-4">
              {row}
            </Badge>

            {seats.slice(0, 3).map((seat) => (
              <Button
                key={seat.id}
                size="sm"
                variant="ghost"
                className={`w-8 h-8 p-0 text-xs ${getSeatStyle(seat)}`}
                onClick={() => !seat.isBooked && onSeatSelect(seat.id)}
                disabled={seat.isBooked}
              >
                {seat.number}
              </Button>
            ))}

            <div className="w-4"></div>

            {seats.slice(3, 9).map((seat) => (
              <Button
                key={seat.id}
                size="sm"
                variant="ghost"
                className={`w-8 h-8 p-0 text-xs ${getSeatStyle(seat)}`}
                onClick={() => !seat.isBooked && onSeatSelect(seat.id)}
                disabled={seat.isBooked}
              >
                {seat.number}
              </Button>
            ))}

            <div className="w-4"></div>

            {seats.slice(9).map((seat) => (
              <Button
                key={seat.id}
                size="sm"
                variant="ghost"
                className={`w-8 h-8 p-0 text-xs ${getSeatStyle(seat)}`}
                onClick={() => !seat.isBooked && onSeatSelect(seat.id)}
                disabled={seat.isBooked}
              >
                {seat.number}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
