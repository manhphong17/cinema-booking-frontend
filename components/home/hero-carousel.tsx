"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react"
import { useRouter } from "next/navigation"

const featuredMovies = [
  {
    id: 1,
    title: "Avengers: Endgame",
    description: "Cuộc chiến cuối cùng của các siêu anh hùng để cứu vũ trụ khỏi sự hủy diệt hoàn toàn.",
    poster: "/generic-superhero-team-poster.png",
    backdrop: "/modern-cinema-theater-interior-luxury.jpg",
    rating: "P13",
    imdbRating: 8.4,
    genre: "Hành động, Phiêu lưu",
    duration: "181 phút",
    year: "2019"
  },
  {
    id: 2,
    title: "Spider-Man: No Way Home",
    description: "Peter Parker phải đối mặt với những hậu quả khi danh tính bí mật của anh bị tiết lộ.",
    poster: "/spiderman-no-way-home-movie-poster.jpg",
    backdrop: "/modern-cinema-theater-interior-luxury.jpg",
    rating: "P13",
    imdbRating: 8.2,
    genre: "Hành động, Khoa học viễn tưởng",
    duration: "148 phút",
    year: "2021"
  },
  {
    id: 3,
    title: "The Batman",
    description: "Khi một kẻ giết người hàng loạt bắt đầu nhắm vào giới thượng lưu Gotham, Batman phải điều tra.",
    poster: "/images/posters/the-batman-poster.png",
    backdrop: "/modern-cinema-theater-interior-luxury.jpg",
    rating: "P16",
    imdbRating: 7.8,
    genre: "Hành động, Tội phạm",
    duration: "176 phút",
    year: "2022"
  }
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleBookTicket = (movieId: number) => {
    router.push(`/booking?movieId=${movieId}`)
  }

  return (
    <section className="relative h-[85vh] overflow-hidden">
      {/* Background Images */}
      {featuredMovies.map((movie, index) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-all duration-1200 ease-in-out ${
            index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          >
            {/* Consistent gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs bg-red-600/80 text-white border-red-500 px-2 py-1">
                {featuredMovies[currentSlide].rating}
              </Badge>
              <div className="flex items-center gap-1 bg-yellow-400/15 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star className="h-3 w-3 fill-current text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">{featuredMovies[currentSlide].imdbRating}</span>
              </div>
              <span className="text-xs text-gray-200 bg-white/8 backdrop-blur-sm px-2 py-1 rounded-full">{featuredMovies[currentSlide].year}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              <span className="bg-gradient-to-r from-white via-gray-50 to-gray-200 bg-clip-text text-transparent">
                {featuredMovies[currentSlide].title}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-100 mb-6 max-w-2xl leading-relaxed drop-shadow-md">
              {featuredMovies[currentSlide].description}
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-gray-200 mb-8">
              <span className="bg-white/8 backdrop-blur-sm px-3 py-1 rounded-full">{featuredMovies[currentSlide].genre}</span>
              <span className="bg-white/8 backdrop-blur-sm px-3 py-1 rounded-full">{featuredMovies[currentSlide].duration}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 border border-red-500/30 rounded-xl"
                onClick={() => handleBookTicket(featuredMovies[currentSlide].id)}
              >
                <Play className="mr-2 h-5 w-5" />
                Đặt vé ngay
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border border-white/60 text-white hover:bg-white/90 hover:text-gray-900 px-8 py-3 text-lg font-semibold backdrop-blur-sm bg-white/5 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20 rounded-xl"
              >
                <Play className="mr-2 h-5 w-5" />
                Xem trailer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
              index === currentSlide 
                ? "bg-white shadow-md scale-110" 
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
