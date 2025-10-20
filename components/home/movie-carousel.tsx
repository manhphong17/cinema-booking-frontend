"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { 
  getNowShowingMovies, 
  getComingSoonMovies, 
  getHomepageMovies, 
  getHomepageComingSoon,
  type Movie,
  type MoviesResponse 
} from "../../src/api/movies"

interface MovieCarouselProps {
  title: string
  movies: Movie[]
  showViewAll?: boolean
  variant?: 'home' | 'page'
  showAllMovies?: boolean
  onShowMore?: () => void
  onShowLess?: () => void
}

export function MovieCarousel({ 
  title, 
  movies: movieList, 
  showViewAll = true, 
  variant = 'home',
  showAllMovies: externalShowAllMovies = false,
  onShowMore,
  onShowLess
}: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [internalShowAllMovies, setInternalShowAllMovies] = useState(false)
  const router = useRouter()

  // Use external state if provided, otherwise use internal state
  const showAllMovies = onShowMore ? externalShowAllMovies : internalShowAllMovies

  const isHome = variant === 'home'
  const itemsPerView = 4
  const maxMoviesToShow = 8

  const displayMovies = useMemo(() => {
    if (isHome) {
      return movieList.slice(0, maxMoviesToShow)
    }
    
    // For page variant, show all movies if showAllMovies is true, otherwise show limited
    return showAllMovies ? movieList : movieList.slice(0, maxMoviesToShow)
  }, [isHome, movieList, showAllMovies, maxMoviesToShow])

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= displayMovies.length ? 0 : prev + 1
    )
  }, [displayMovies.length, itemsPerView])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, displayMovies.length - itemsPerView) : prev - 1
    )
  }, [displayMovies.length, itemsPerView])

  const handleBookTicket = useCallback((movieId: number) => {
    router.push(`/booking?movieId=${movieId}`)
  }, [router])

  const handleViewDetails = useCallback((movieId: number) => {
    router.push(`/movie/${movieId}`)
  }, [router])

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="movie-carousel-container container mx-auto px-4 max-w-7xl">
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
              <Card key={movie.id} className="overflow-hidden hover:shadow-2xl transition-all duration-400 group bg-gradient-to-br from-white to-slate-50/30 border-2 border-gray-200/50 shadow-xl hover:-translate-y-3 cursor-pointer hover:border-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:shadow-blue-500/20 rounded-2xl" onClick={() => handleViewDetails(movie.id)}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-2xl">
                  <img
                    src={movie.posterUrl || movie.poster || "/placeholder.svg"}
                    alt={movie.name || movie.title || "Movie poster"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-white/20 px-4 py-2 text-sm font-bold shadow-2xl rounded-full">
                    P{movie.ageRating}
                  </Badge>
                </div>
                <CardContent className={`${isHome ? "p-4" : "p-5"} border-t-2 border-gray-200/30 bg-gradient-to-br from-white to-slate-50/50 rounded-b-2xl`}>
                  <h3 className="font-bold text-lg mb-4 text-foreground line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 min-h-[3.5rem] flex items-center">
                    {movie.name || movie.title}
                  </h3>
                  <div className="flex gap-3">
                    {title !== "Phim sắp chiếu" && (
                      <Button 
                        className="flex-1 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-bold py-3 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookTicket(movie.id)
                        }}
                      >
                        Đặt vé
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className={`${title === "Phim sắp chiếu" ? 'flex-1' : 'px-4'} border-2 border-gray-300 text-gray-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 font-semibold`}
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

          {/* Show More Button for Page Variant */}
          {!isHome && !showAllMovies && movieList.length > maxMoviesToShow && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={onShowMore || (() => setInternalShowAllMovies(true))}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Xem thêm {movieList.length - maxMoviesToShow} phim
              </Button>
            </div>
          )}

          {/* Show Less Button */}
          {!isHome && showAllMovies && movieList.length > maxMoviesToShow && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={onShowLess || (() => setInternalShowAllMovies(false))}
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                Thu gọn
              </Button>
            </div>
          )}

          {/* No Results Message */}
          {movieList.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Không tìm thấy phim nào phù hợp với bộ lọc
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}

        </div>

      </div>
    </section>
  )
}

export function NowShowingCarousel({ variant = 'home', filters }: { variant?: 'home' | 'page', filters?: { search: string, genre: string } }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllMovies, setShowAllMovies] = useState(false)

  console.log('NowShowingCarousel rendered with variant:', variant, 'filters:', filters) // Debug log

    const fetchMovies = async () => {
      try {
        setLoading(true)
      setError(null)
      
        const data = variant === 'home'
          ? await getHomepageMovies()
        : await getNowShowingMovies(filters)
      
        console.log('NowShowingCarousel fetched data:', data) // Debug log
        setMovies(data)
      } catch (error) {
        console.error('Error fetching movies:', error)
      setError('Không thể tải danh sách phim. Vui lòng thử lại sau.')
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchMovies()
  }, [variant, filters?.search, filters?.genre])

  const handleShowMore = () => {
    setShowAllMovies(true)
  }

  const handleShowLess = () => {
    setShowAllMovies(false)
  }

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

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div>
      <MovieCarousel 
        title="Phim đang chiếu" 
        movies={movies} 
        variant={variant}
        showAllMovies={showAllMovies}
        onShowMore={handleShowMore}
        onShowLess={handleShowLess}
      />
    </div>
  )
}

export function ComingSoonCarousel({ variant = 'home', filters }: { variant?: 'home' | 'page', filters?: { search: string, genre: string } }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllMovies, setShowAllMovies] = useState(false)

    const fetchMovies = async () => {
      try {
        setLoading(true)
      setError(null)
      
        const data = variant === 'home' 
          ? await getHomepageComingSoon()
        : await getComingSoonMovies(filters)
      
        setMovies(data)
      } catch (error) {
        console.error('Error fetching movies:', error)
      setError('Không thể tải danh sách phim sắp chiếu. Vui lòng thử lại sau.')
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchMovies()
  }, [variant, filters?.search, filters?.genre])

  const handleShowMore = () => {
    setShowAllMovies(true)
  }

  const handleShowLess = () => {
    setShowAllMovies(false)
  }

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

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div>
      <MovieCarousel 
        title="Phim sắp chiếu" 
        movies={movies} 
        variant={variant}
        showAllMovies={showAllMovies}
        onShowMore={handleShowMore}
        onShowLess={handleShowLess}
      />
    </div>
  )
}
