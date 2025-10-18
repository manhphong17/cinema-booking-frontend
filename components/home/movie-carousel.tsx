"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import apiClient from "@/src/api/interceptor"

export interface Movie {
  id: number
  title: string
  genre: string
  poster: string
  posterUrl?: string
  ageRating: string
  duration: string
  year: string
}

export interface MoviesResponse {
  status: number
  message: string
  data: {
    id?: number
    name?: string
    title?: string
    genre?: string
    poster?: string
    posterUrl?: string
    ageRating?: number | string
    duration?: string
    year?: string
  }[]
}

interface MovieCarouselProps {
  title: string
  movies: Movie[]
  showViewAll?: boolean
  variant?: 'home' | 'page'
}

export function MovieCarousel({ title, movies: movieList, showViewAll = true, variant = 'home' }: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()

  const isHome = variant === 'home'
  const itemsPerView = 4
  const maxMoviesToShow = 8

  const displayMovies = isHome ? movieList.slice(0, maxMoviesToShow) : movieList

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= displayMovies.length ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, displayMovies.length - itemsPerView) : prev - 1
    )
  }

  const handleBookTicket = (movieId: number) => {
    router.push(`/booking?movieId=${movieId}`)
  }

  const handleViewDetails = (movieId: number) => {
    router.push(`/movie/${movieId}`)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="movie-carousel-container container mx-auto px-4">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {title === "Phim đang chiếu" ? "Now Showing" : "Coming Soon"}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight leading-tight">
              <span className="text-foreground">
                {title}
              </span>
            </h2>
            <div className="h-1 w-16 rounded-full bg-black/80"></div>
          </div>
          {isHome && showViewAll && (
            <Button 
              variant="outline" 
              className="bg-white hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all duration-200 rounded-xl px-6 py-3 font-semibold shadow-sm"
              onClick={() => router.push(title === "Phim đang chiếu" ? "/movies/now-showing" : "/movies/coming-soon")}
            >
              Xem tất cả →
            </Button>
          )}
        </div>

        <div className="relative">

          {/* Navigation Buttons - Ẩn nếu không cần */}
          {isHome && displayMovies.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-10 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-500 hover:to-purple-500 text-slate-600 hover:text-white p-2 md:p-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-slate-300 hover:border-blue-400"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-10 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-500 hover:to-purple-500 text-slate-600 hover:text-white p-2 md:p-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-slate-300 hover:border-blue-400"
                disabled={currentIndex + itemsPerView >= displayMovies.length}
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </>
          )}

          {/* Movie Grid */}
          <div className="movie-carousel-grid">
            {displayMovies.map((movie) => (
              <Card key={movie.id} className="overflow-hidden hover:shadow-2xl transition-all duration-400 group bg-gradient-to-br from-white to-slate-50/30 border border-gray-200/50 shadow-lg hover:-translate-y-2 cursor-pointer hover:border-blue-300/50 hover:shadow-blue-500/10" onClick={() => handleViewDetails(movie.id)}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                  <img
                    src={movie.posterUrl || movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/50 px-3 py-1.5 text-xs font-semibold shadow-lg">
                    {movie.ageRating}
                  </Badge>
                </div>
                <CardContent className={`${isHome ? "p-3" : "p-4"} border-t border-gray-100/50 bg-gradient-to-br from-slate-50 to-gray-100/50`}>
                  <h3 className="font-semibold text-lg mb-2 text-foreground line-clamp-1 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{movie.genre}</p>
                  <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isHome ? "mb-1" : "mb-2"}`}>
                    <Clock className="h-3 w-3" />
                    <span>{movie.duration}</span>
                    <span>•</span>
                    <span>{movie.year}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-black hover:bg-black/90 text-white font-semibold py-2.5 transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookTicket(movie.id)
                      }}
                    >
                      Đặt vé
                    </Button>
                    <Button 
                      variant="outline"
                      className="px-3 border-gray-300 text-gray-800 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-900 hover:text-white hover:border-gray-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
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

      </div>
    </section>
  )
}

export function NowShowingCarousel({ variant = 'home' }: { variant?: 'home' | 'page' }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        const data = variant === 'home' 
          ? await getHomepageMovies()
          : await getNowShowingMovies()
        setMovies(data)
      } catch (error) {
        console.error('Error fetching movies:', error)
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [variant])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600">Đang tải phim...</p>
          </div>
        </div>
      </section>
    )
  }

  return <MovieCarousel title="Phim đang chiếu" movies={movies} variant={variant} />
}

export function ComingSoonCarousel({ variant = 'home' }: { variant?: 'home' | 'page' }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        const data = variant === 'home' 
          ? await getHomepageComingSoon()
          : await getComingSoonMovies()
        setMovies(data)
      } catch (error) {
        console.error('Error fetching movies:', error)
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [variant])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600">Đang tải phim...</p>
          </div>
        </div>
      </section>
    )
  }

  return <MovieCarousel title="Phim sắp chiếu" movies={movies} variant={variant} />
}

// API functions
const getNowShowingMovies = async (): Promise<Movie[]> => {
  try {
    const response = await apiClient.get<MoviesResponse>('/movies/now-showing')
    if (response.data.status === 200 && response.data.data) {
      return response.data.data.map(movie => ({
        id: movie.id || 0,
        title: movie.name || movie.title || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: movie.ageRating?.toString() || 'P13',
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString()
      }))
    }
    throw new Error('Failed to fetch now showing movies')
  } catch (error) {
    console.error('Error fetching now showing movies:', error)
    return []
  }
}

const getComingSoonMovies = async (): Promise<Movie[]> => {
  try {
    const response = await apiClient.get<MoviesResponse>('/movies/top/4?movieStatus=UPCOMING')
    if (response.data.status === 200 && response.data.data) {
      return response.data.data.map(movie => ({
        id: movie.id || 0,
        title: movie.name || movie.title || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: movie.ageRating?.toString() || 'P13',
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString()
      }))
    }
    throw new Error('Failed to fetch coming soon movies')
  } catch (error) {
    console.error('Error fetching coming soon movies:', error)
    return []
  }
}

const getHomepageMovies = async (): Promise<Movie[]> => {
  try {
    const response = await apiClient.get<MoviesResponse>('/movies/top/4?movieStatus=PLAYING')
    if (response.data.status === 200 && response.data.data) {
      return response.data.data.map(movie => ({
        id: movie.id || 0,
        title: movie.name || movie.title || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: movie.ageRating?.toString() || 'P13',
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString()
      }))
    }
    throw new Error('Failed to fetch homepage movies')
  } catch (error) {
    console.error('Error fetching homepage movies:', error)
    return []
  }
}

const getHomepageComingSoon = async (): Promise<Movie[]> => {
  try {
    const response = await apiClient.get<MoviesResponse>('/movies/top/4?movieStatus=UPCOMING')
    if (response.data.status === 200 && response.data.data) {
      return response.data.data.map(movie => ({
        id: movie.id || 0,
        title: movie.name || movie.title || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: movie.ageRating?.toString() || 'P13',
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString()
      }))
    }
    throw new Error('Failed to fetch homepage coming soon movies')
  } catch (error) {
    console.error('Error fetching homepage coming soon movies:', error)
    return []
  }
}
