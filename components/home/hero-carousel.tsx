"use client"

import { useState, useEffect, useRef } from "react"
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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [animationType, setAnimationType] = useState<'fade' | 'slide' | 'zoom' | 'flip'>('slide')
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length)
    }, 6000) // Tăng thời gian để người dùng có thể thấy hiệu ứng

    return () => clearInterval(timer)
  }, [])

  // Chỉ sử dụng slide animation
  useEffect(() => {
    setAnimationType('slide')
  }, [currentSlide])

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return
    setIsTransitioning(true)
    setCurrentSlide(index)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  const handleBookTicket = (movieId: number) => {
    router.push(`/booking?movieId=${movieId}`)
  }

  const getSlideClasses = (index: number) => {
    const isActive = index === currentSlide
    const isPrev = index === (currentSlide - 1 + featuredMovies.length) % featuredMovies.length
    const isNext = index === (currentSlide + 1) % featuredMovies.length
    const baseClasses = "absolute inset-0 transition-all duration-1000 ease-in-out"
    
    if (isActive) {
      return `${baseClasses} opacity-100 translate-x-0 z-10`
    } else if (isPrev) {
      return `${baseClasses} opacity-0 -translate-x-full z-0`
    } else if (isNext) {
      return `${baseClasses} opacity-0 translate-x-full z-0`
    } else {
      return `${baseClasses} opacity-0 translate-x-full z-0`
    }
  }

  return (
    <section ref={carouselRef} className="relative h-[85vh] overflow-hidden">
      {/* Background Images */}
      {featuredMovies.map((movie, index) => (
        <div
          key={movie.id}
          className={getSlideClasses(index)}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out hover:scale-105"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          >
            {/* Enhanced gradient overlays with modern color scheme */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-slate-700/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/60" />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/25 via-purple-600/15 to-pink-600/10" />
            <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/10 via-transparent to-orange-500/10" />
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className={`flex items-center gap-2 mb-4 transition-all duration-1000 ${
              isTransitioning ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'
            }`}>
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/50 px-3 py-1.5 shadow-lg">
                {featuredMovies[currentSlide].rating}
              </Badge>
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-yellow-400/30">
                <Star className="h-3 w-3 fill-current text-yellow-300" />
                <span className="text-xs font-semibold text-yellow-200">{featuredMovies[currentSlide].imdbRating}</span>
              </div>
              <span className="text-xs text-slate-200 bg-gradient-to-r from-slate-700/30 to-slate-600/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-500/30">{featuredMovies[currentSlide].year}</span>
            </div>

            <h1 className={`text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-2xl transition-all duration-1000 ${
              isTransitioning ? 'opacity-0 translate-y-8 blur-sm' : 'opacity-100 translate-y-0 blur-0'
            }`}>
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                {featuredMovies[currentSlide].title}
              </span>
            </h1>

            <p className={`text-lg md:text-xl text-slate-100 mb-6 max-w-2xl leading-relaxed drop-shadow-lg transition-all duration-1000 delay-200 ${
              isTransitioning ? 'opacity-0 translate-y-6 blur-sm' : 'opacity-100 translate-y-0 blur-0'
            }`}>
              {featuredMovies[currentSlide].description}
            </p>

            <div className={`flex flex-wrap gap-3 text-sm text-slate-200 mb-8 transition-all duration-1000 delay-300 ${
              isTransitioning ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'
            }`}>
              <span className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 backdrop-blur-sm px-4 py-2 rounded-full hover:from-slate-600/50 hover:to-slate-500/50 transition-all duration-300 hover:scale-105 border border-slate-500/30">{featuredMovies[currentSlide].genre}</span>
              <span className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 backdrop-blur-sm px-4 py-2 rounded-full hover:from-slate-600/50 hover:to-slate-500/50 transition-all duration-300 hover:scale-105 border border-slate-500/30">{featuredMovies[currentSlide].duration}</span>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-1000 delay-400 ${
              isTransitioning ? 'opacity-0 translate-y-6 blur-sm' : 'opacity-100 translate-y-0 blur-0'
            }`}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 border border-blue-400/30 rounded-xl button-glow"
                onClick={() => handleBookTicket(featuredMovies[currentSlide].id)}
              >
                <Play className="mr-2 h-5 w-5" />
                Đặt vé ngay
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border border-slate-300/60 text-slate-100 hover:bg-slate-100/90 hover:text-slate-900 px-8 py-3 text-lg font-semibold backdrop-blur-sm bg-slate-800/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-slate-300/20 rounded-xl button-glow"
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
        disabled={isTransitioning}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-slate-800/30 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/50 backdrop-blur-md text-slate-100 p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-slate-500/30 ${
          isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-slate-400/30'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-slate-800/30 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/50 backdrop-blur-md text-slate-100 p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-slate-500/30 ${
          isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-slate-400/30'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`relative w-4 h-4 rounded-full transition-all duration-500 hover:scale-125 ${
              index === currentSlide 
                ? "bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg scale-125" 
                : "bg-slate-400/60 hover:bg-slate-300/80"
            } ${isTransitioning ? 'cursor-not-allowed' : ''}`}
          >
            {index === currentSlide && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300/30 to-purple-300/30"></div>
            )}
          </button>
        ))}
      </div>

    </section>
  )
}
