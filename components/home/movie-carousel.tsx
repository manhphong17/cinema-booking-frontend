"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Star, Clock, Play } from "lucide-react"
import { useRouter } from "next/navigation"

const movies = [
  {
    id: 1,
    title: "Avengers: Endgame",
    genre: "Hành động, Phiêu lưu",
    poster: "/generic-superhero-team-poster.png",
    rating: "P13",
    imdbRating: 8.4,
    duration: "181 phút",
    year: "2019"
  },
  {
    id: 2,
    title: "Spider-Man: No Way Home",
    genre: "Hành động, Khoa học viễn tưởng",
    poster: "/spiderman-no-way-home-movie-poster.jpg",
    rating: "P13",
    imdbRating: 8.2,
    duration: "148 phút",
    year: "2021"
  },
  {
    id: 3,
    title: "The Batman",
    genre: "Hành động, Tội phạm",
    poster: "/images/posters/the-batman-poster.png",
    rating: "P16",
    imdbRating: 7.8,
    duration: "176 phút",
    year: "2022"
  },
  {
    id: 4,
    title: "Doctor Strange 2",
    genre: "Hành động, Phiêu lưu",
    poster: "/doctor-strange-2-movie-poster.jpg",
    rating: "P13",
    imdbRating: 6.9,
    duration: "126 phút",
    year: "2022"
  },
  {
    id: 5,
    title: "Top Gun: Maverick",
    genre: "Hành động, Chính kịch",
    poster: "/top-gun-maverick-movie-poster.jpg",
    rating: "P13",
    imdbRating: 8.3,
    duration: "131 phút",
    year: "2022"
  },
  {
    id: 6,
    title: "Jurassic World Dominion",
    genre: "Hành động, Phiêu lưu",
    poster: "/jurassic-world-dominion-movie-poster.jpg",
    rating: "P13",
    imdbRating: 5.6,
    duration: "147 phút",
    year: "2022"
  }
]

interface MovieCarouselProps {
  title: string
  movies: typeof movies
  showViewAll?: boolean
}

export function MovieCarousel({ title, movies: movieList, showViewAll = true }: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const router = useRouter()
  const itemsPerView = 4
  const pageSize = 8

  const filteredMovies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return movieList
    return movieList.filter(m =>
      m.title.toLowerCase().includes(term) ||
      m.genre.toLowerCase().includes(term)
    )
  }, [movieList, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pagedMovies = filteredMovies.slice(pageStart, pageStart + pageSize)

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= movieList.length ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, movieList.length - itemsPerView) : prev - 1
    )
  }

  const handleBookTicket = (movieId: number) => {
    router.push(`/booking?movieId=${movieId}`)
  }

  const handleViewDetails = (movieId: number) => {
    router.push(`/movie/${movieId}`)
  }

  const visibleMovies = pagedMovies.slice(0, Math.min(itemsPerView, pagedMovies.length))

  return (
    <section className="py-20 bg-gradient-to-b from-background to-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm phim..."
              className="h-10 w-56 md:w-72 px-3 rounded-lg border border-gray-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {showViewAll && (
              <Button 
                variant="outline" 
                className="hidden md:flex bg-white/90 hover:bg-primary hover:text-white border border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 shadow-md rounded-lg"
                onClick={() => router.push(title === "Phim đang chiếu" ? "/movies/now-showing" : "/movies/coming-soon")}
              >
                Xem tất cả
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/95 hover:bg-white text-gray-600 hover:text-primary p-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-gray-200 hover:border-primary/40"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/95 hover:bg-white text-gray-600 hover:text-primary p-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-gray-200 hover:border-primary/40"
            disabled={currentIndex + itemsPerView >= movieList.length}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Movie Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pagedMovies.map((movie) => (
              <Card key={movie.id} className="overflow-hidden hover:shadow-xl transition-all duration-400 group bg-white border-0 shadow-md hover:-translate-y-1 cursor-pointer" onClick={() => handleViewDetails(movie.id)}>
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-2 right-2 bg-red-600/85 text-white border-red-500 px-2 py-1 text-xs font-semibold shadow-md">
                    {movie.rating}
                  </Badge>
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400/85 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-semibold shadow-md">
                    <Star className="h-3 w-3 fill-current text-yellow-600" />
                    <span>{movie.imdbRating}</span>
                  </div>
                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 shadow-xl hover:scale-110 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookTicket(movie.id)
                      }}
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full w-14 h-14 shadow-xl hover:scale-110 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(movie.id)
                      }}
                    >
                      <span className="text-xs font-bold">Chi tiết</span>
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{movie.genre}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="h-3 w-3" />
                    <span>{movie.duration}</span>
                    <span>•</span>
                    <span>{movie.year}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookTicket(movie.id)
                      }}
                    >
                      Đặt vé
                    </Button>
                    <Button 
                      variant="outline"
                      className="px-3 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(movie.id)
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination Controls for Movies */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
              disabled={currentPage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <div className="text-sm text-muted-foreground">
              Trang {currentPage}/{totalPages}
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md hover:shadow-primary/30 hover:from-primary/90 hover:to-primary rounded-full px-5"
              disabled={currentPage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export function NowShowingCarousel() {
  return <MovieCarousel title="Phim đang chiếu" movies={movies} />
}

export function ComingSoonCarousel() {
  const comingSoonMovies = [
    {
      id: 7,
      title: "Black Panther: Wakanda Forever",
      genre: "Hành động, Phiêu lưu",
      poster: "/placeholder.svg",
      rating: "P13",
      imdbRating: 7.3,
      duration: "161 phút",
      year: "2022"
    },
    {
      id: 8,
      title: "Avatar: The Way of Water",
      genre: "Hành động, Phiêu lưu",
      poster: "/placeholder.svg",
      rating: "P13",
      imdbRating: 7.8,
      duration: "192 phút",
      year: "2022"
    },
    {
      id: 9,
      title: "Thor: Love and Thunder",
      genre: "Hành động, Hài kịch",
      poster: "/placeholder.svg",
      rating: "P13",
      imdbRating: 6.2,
      duration: "119 phút",
      year: "2022"
    },
    {
      id: 10,
      title: "Black Adam",
      genre: "Hành động, Siêu anh hùng",
      poster: "/placeholder.svg",
      rating: "P13",
      imdbRating: 6.2,
      duration: "125 phút",
      year: "2022"
    }
  ]

  return <MovieCarousel title="Phim sắp chiếu" movies={comingSoonMovies} />
}
