"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  getHomepageMovies, 
  getHomepageComingSoon,
  type Movie
} from "../../src/api/movies"
import { useRouter } from "next/navigation"

// Component riêng cho trang home - Now Showing
export function HomeNowShowingCarousel() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const data = await getHomepageMovies()
      setMovies(data)
    } catch (error) {
      console.error('Error fetching homepage movies:', error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="movie-carousel-container container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Now Showing
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight leading-tight">
                <span className="text-foreground">
                  Phim đang chiếu
                </span>
              </h2>
              <div className="h-1 w-16 rounded-full bg-black/80"></div>
            </div>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all duration-200 rounded-xl px-6 py-3 font-semibold shadow-sm"
              onClick={() => router.push("/movies/now-showing")}
            >
              Xem tất cả →
            </Button>
          </div>
          <div className="home-movie-grid-compact">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="home-movie-card">
                <div className="skeleton w-full h-64 rounded-lg mb-3"></div>
                <div className="skeleton h-4 w-3/4 mb-2"></div>
                <div className="skeleton h-8 w-full mb-2"></div>
                <div className="skeleton h-8 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="movie-carousel-container container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Now Showing
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight leading-tight">
              <span className="text-foreground">
                Phim đang chiếu
              </span>
            </h2>
            <div className="h-1 w-16 rounded-full bg-black/80"></div>
          </div>
          <Button 
            variant="outline" 
            className="bg-white hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all duration-200 rounded-xl px-6 py-3 font-semibold shadow-sm"
            onClick={() => router.push("/movies/now-showing")}
          >
            Xem tất cả →
          </Button>
        </div>

        <div className="relative">
          {/* Movie Grid */}
          <div className="home-movie-grid-compact">
            {movies.map((movie) => (
              <div key={movie.id} className="home-movie-card" onClick={() => router.push(`/movie/${movie.id}`)}>
                <div className="relative overflow-hidden">
                  <img
                    src={movie.posterUrl || movie.poster || "/placeholder.svg"}
                    alt={movie.name || movie.title || "Movie poster"}
                    className="home-movie-poster"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/placeholder.svg") {
                        target.src = "/placeholder.svg";
                      }
                    }}
                  />
                  <div className="home-movie-badge">
                    P{movie.ageRating}
                  </div>
                </div>
                <div className="home-movie-content">
                  <h3 className="home-movie-title">
                    {movie.name || movie.title}
                  </h3>
                  <div className="home-movie-buttons">
                    <button 
                      className="home-movie-btn home-movie-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/booking?movieId=${movie.id}`)
                      }}
                    >
                      Đặt vé
                    </button>
                    <button 
                      className="home-movie-btn home-movie-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/movie/${movie.id}`)
                      }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {movies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Không có phim đang chiếu
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Component riêng cho trang home - Coming Soon
export function HomeComingSoonCarousel() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const data = await getHomepageComingSoon()
      setMovies(data)
    } catch (error) {
      console.error('Error fetching homepage coming soon movies:', error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="movie-carousel-container container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Coming Soon
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight leading-tight">
                <span className="text-foreground">
                  Phim sắp chiếu
                </span>
              </h2>
              <div className="h-1 w-16 rounded-full bg-black/80"></div>
            </div>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all duration-200 rounded-xl px-6 py-3 font-semibold shadow-sm"
              onClick={() => router.push("/movies/coming-soon")}
            >
              Xem tất cả →
            </Button>
          </div>
          <div className="home-movie-grid-compact">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="home-movie-card">
                <div className="skeleton w-full h-64 rounded-lg mb-3"></div>
                <div className="skeleton h-4 w-3/4 mb-2"></div>
                <div className="skeleton h-8 w-full mb-2"></div>
                <div className="skeleton h-8 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="movie-carousel-container container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Coming Soon
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight leading-tight">
              <span className="text-foreground">
                Phim sắp chiếu
              </span>
            </h2>
            <div className="h-1 w-16 rounded-full bg-black/80"></div>
          </div>
          <Button 
            variant="outline" 
            className="bg-white hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-all duration-200 rounded-xl px-6 py-3 font-semibold shadow-sm"
            onClick={() => router.push("/movies/coming-soon")}
          >
            Xem tất cả →
          </Button>
        </div>

        <div className="relative">
          {/* Movie Grid */}
          <div className="home-movie-grid-compact">
            {movies.map((movie) => (
              <div key={movie.id} className="home-movie-card" onClick={() => router.push(`/movie/${movie.id}`)}>
                <div className="relative overflow-hidden">
                  <img
                    src={movie.posterUrl || movie.poster || "/placeholder.svg"}
                    alt={movie.name || movie.title || "Movie poster"}
                    className="home-movie-poster"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/placeholder.svg") {
                        target.src = "/placeholder.svg";
                      }
                    }}
                  />
                  <div className="home-movie-badge">
                    P{movie.ageRating}
                  </div>
                </div>
                <div className="home-movie-content">
                  <h3 className="home-movie-title">
                    {movie.name || movie.title}
                  </h3>
                  <div className="home-movie-buttons">
                    <button 
                      className="home-movie-btn home-movie-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/booking?movieId=${movie.id}`)
                      }}
                    >
                      Đặt vé
                    </button>
                    <button 
                      className="home-movie-btn home-movie-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/movie/${movie.id}`)
                      }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {movies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Không có phim sắp chiếu
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
