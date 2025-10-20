"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, MapPin } from "lucide-react"
import { SeatMap } from "@/components/staff/seat-map"

interface Movie {
  id: string
  title: string
  duration: string
  genre: string
  rating: string
  poster: string
}

interface Showtime {
  id: string
  time: string
  room: string
  price: number
  availableSeats: number
}

interface TicketSelectionProps {
  onAddToCart: (item: {
    type: "ticket" | "concession"
    name: string
    price: number
    quantity: number
    details?: string
  }) => void
}

const movies: Movie[] = [
  {
    id: "1",
    title: "Avengers: Endgame",
    duration: "181 phút",
    genre: "Hành động, Khoa học viễn tưởng",
    rating: "13+",
    poster: "/generic-superhero-team-poster.png",
  },
  {
    id: "2",
    title: "Spider-Man: No Way Home",
    duration: "148 phút",
    genre: "Hành động, Phiêu lưu",
    rating: "13+",
    poster: "/spiderman-no-way-home-movie-poster.jpg",
  },
  {
    id: "3",
    title: "The Batman",
    duration: "176 phút",
    genre: "Hành động, Tội phạm",
    rating: "16+",
    poster: "/images/posters/the-batman-poster.png",
  },
  {
    id: "4",
    title: "Top Gun: Maverick",
    duration: "130 phút",
    genre: "Hành động, Drama",
    rating: "13+",
    poster: "/top-gun-maverick-movie-poster.jpg",
  },
]

const showtimes: Record<string, Showtime[]> = {
  "1": [
    { id: "1-1", time: "09:00", room: "Phòng 1", price: 120000, availableSeats: 45 },
    { id: "1-2", time: "12:30", room: "Phòng 2", price: 150000, availableSeats: 32 },
    { id: "1-3", time: "16:00", room: "Phòng 1", price: 150000, availableSeats: 28 },
    { id: "1-4", time: "19:30", room: "Phòng 3", price: 180000, availableSeats: 15 },
    { id: "1-5", time: "22:00", room: "Phòng 2", price: 150000, availableSeats: 38 },
  ],
  "2": [
    { id: "2-1", time: "10:15", room: "Phòng 2", price: 120000, availableSeats: 42 },
    { id: "2-2", time: "13:45", room: "Phòng 1", price: 150000, availableSeats: 25 },
    { id: "2-3", time: "17:15", room: "Phòng 3", price: 150000, availableSeats: 30 },
    { id: "2-4", time: "20:45", room: "Phòng 2", price: 180000, availableSeats: 18 },
  ],
  "3": [
    { id: "3-1", time: "11:00", room: "Phòng 3", price: 120000, availableSeats: 35 },
    { id: "3-2", time: "14:30", room: "Phòng 1", price: 150000, availableSeats: 22 },
    { id: "3-3", time: "18:00", room: "Phòng 2", price: 150000, availableSeats: 27 },
    { id: "3-4", time: "21:30", room: "Phòng 3", price: 180000, availableSeats: 12 },
  ],
  "4": [
    { id: "4-1", time: "09:30", room: "Phòng 2", price: 120000, availableSeats: 40 },
    { id: "4-2", time: "13:00", room: "Phòng 3", price: 150000, availableSeats: 33 },
    { id: "4-3", time: "16:30", room: "Phòng 1", price: 150000, availableSeats: 29 },
    { id: "4-4", time: "20:00", room: "Phòng 2", price: 180000, availableSeats: 16 },
  ],
}

export function TicketSelection({ onAddToCart }: TicketSelectionProps) {
  const [selectedMovie, setSelectedMovie] = useState<string>("")
  const [selectedShowtime, setSelectedShowtime] = useState<string>("")
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  const currentMovie = movies.find((m) => m.id === selectedMovie)
  const currentShowtime = selectedMovie ? showtimes[selectedMovie]?.find((s) => s.id === selectedShowtime) : null

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId)
      } else {
        return [...prev, seatId]
      }
    })
  }

  const handleAddTickets = () => {
    if (currentMovie && currentShowtime && selectedSeats.length > 0) {
      onAddToCart({
        type: "ticket",
        name: `${currentMovie.title}`,
        price: currentShowtime.price,
        quantity: selectedSeats.length,
        details: `${currentShowtime.time} - ${currentShowtime.room} - Ghế: ${selectedSeats.join(", ")}`,
      })
      setSelectedSeats([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Movie Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Chọn phim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className={`cursor-pointer rounded-lg border-2 transition-all ${
                  selectedMovie === movie.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  setSelectedMovie(movie.id)
                  setSelectedShowtime("")
                  setSelectedSeats([])
                }}
              >
                <div className="p-4">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="movie-poster w-full object-cover rounded-md mb-3"
                  />
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{movie.title}</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {movie.duration}
                    </div>
                    <p>{movie.genre}</p>
                    <Badge variant="secondary" className="text-xs">
                      {movie.rating}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Showtime Selection */}
      {selectedMovie && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Chọn suất chiếu - {currentMovie?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {showtimes[selectedMovie]?.map((showtime) => (
                <div
                  key={showtime.id}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedShowtime === showtime.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedShowtime(showtime.id)
                    setSelectedSeats([])
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">{showtime.time}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {showtime.room}
                    </div>
                    <div className="text-sm font-medium text-primary mt-2">
                      {showtime.price.toLocaleString("vi-VN")}đ
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{showtime.availableSeats} ghế trống</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seat Selection */}
      {selectedShowtime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Chọn ghế - {currentShowtime?.room}
              </div>
              <div className="text-sm text-muted-foreground">Đã chọn: {selectedSeats.length} ghế</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeatMap selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} />

            {selectedSeats.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedSeats.length} vé × {currentShowtime?.price.toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-sm text-muted-foreground">Ghế: {selectedSeats.join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {((currentShowtime?.price || 0) * selectedSeats.length).toLocaleString("vi-VN")}đ
                    </p>
                    <Button onClick={handleAddTickets} className="mt-2">
                      Thêm vào giỏ
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
