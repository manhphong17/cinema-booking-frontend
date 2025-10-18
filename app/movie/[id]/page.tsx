"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Calendar, Play, ArrowLeft, Share2, Heart } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data - in real app, this would come from API
const movieData = {
  id: 1,
  title: "Avengers: Endgame",
  description: "Cuộc chiến cuối cùng của các siêu anh hùng để cứu vũ trụ khỏi sự hủy diệt hoàn toàn. Sau khi Thanos thực hiện Snap và tiêu diệt một nửa vũ trụ, các siêu anh hùng còn lại phải đoàn kết để tìm cách đảo ngược thảm họa và cứu lấy những người thân yêu.",
  poster: "/generic-superhero-team-poster.png",
  backdrop: "/modern-cinema-theater-interior-luxury.jpg",
  rating: "P13",
  imdbRating: 8.4,
  genre: "Hành động, Phiêu lưu, Khoa học viễn tưởng",
  duration: "181 phút",
  year: "2019",
  director: "Anthony Russo, Joe Russo",
  cast: "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth, Scarlett Johansson",
  trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
  showtimes: [
    { time: "10:00", hall: "Hall 1", price: "80,000đ" },
    { time: "13:30", hall: "Hall 2", price: "80,000đ" },
    { time: "16:45", hall: "Hall 1", price: "90,000đ" },
    { time: "20:00", hall: "Hall 3", price: "100,000đ" },
    { time: "22:30", hall: "Hall 2", price: "90,000đ" }
  ]
}

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const movie = movieData // In real app, fetch by params.id

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        {/* Hero Section */}
        <div className="relative h-[70vh] overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="mb-6 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-red-600/90 text-white border-red-500 px-3 py-1">
                    {movie.rating}
                  </Badge>
                  <div className="flex items-center gap-1 bg-yellow-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">{movie.imdbRating}</span>
                  </div>
                  <span className="text-sm text-gray-200 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">{movie.year}</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  {movie.title}
                </h1>

                <p className="text-xl text-gray-100 mb-6 max-w-3xl leading-relaxed drop-shadow-md">
                  {movie.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-200 mb-8">
                  <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">{movie.genre}</span>
                  <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">{movie.duration}</span>
                </div>

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push(`/booking?movieId=${movie.id}`)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 text-lg font-bold shadow-2xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-105 border-2 border-red-500/50"
                  >
                    <Play className="mr-3 h-6 w-6" />
                    Đặt vé ngay
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/80 text-white hover:bg-white hover:text-black px-8 py-3 text-lg font-bold backdrop-blur-sm bg-white/10 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-white/25"
                  >
                    <Play className="mr-3 h-6 w-6" />
                    Xem trailer
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/80 text-white hover:bg-white hover:text-black px-6 py-3 text-lg font-bold backdrop-blur-sm bg-white/10 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-white/25"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Yêu thích
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/80 text-white hover:bg-white hover:text-black px-6 py-3 text-lg font-bold backdrop-blur-sm bg-white/10 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-white/25"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    Chia sẻ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Info */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Thông tin phim</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Đạo diễn</h4>
                      <p className="text-muted-foreground">{movie.director}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Diễn viên</h4>
                      <p className="text-muted-foreground">{movie.cast}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Thể loại</h4>
                      <p className="text-muted-foreground">{movie.genre}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Thời lượng</h4>
                      <p className="text-muted-foreground">{movie.duration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Lịch chiếu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movie.showtimes.map((showtime, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                        onClick={() => router.push(`/booking?movieId=${movie.id}&showtimeId=${index}`)}
                      >
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary group-hover:text-primary/80">{showtime.time}</div>
                          <div className="text-sm text-muted-foreground">{showtime.hall}</div>
                          <div className="text-sm font-medium text-foreground mt-1">{showtime.price}</div>
                          <div className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Click để đặt vé
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full max-w-xs mx-auto rounded-lg shadow-lg mb-4"
                    />
                    <h3 className="text-xl font-bold mb-2">{movie.title}</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold">{movie.imdbRating}/10</span>
                      <Badge variant="secondary">{movie.rating}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{movie.duration}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{movie.year}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4">Đánh giá của bạn</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Điểm:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 text-gray-300 hover:text-yellow-400 cursor-pointer" />
                        ))}
                      </div>
                    </div>
                    <Button className="w-full">Gửi đánh giá</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
