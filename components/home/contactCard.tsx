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
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
                <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-2 py-1 bg-blue-50 rounded-md inline-block">
                                Now Showing
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Phim đang chiếu
                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
                                <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-blue-600 hover:text-white border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 rounded-xl px-8 py-3 font-bold shadow-lg hover:shadow-xl hover:scale-105"
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
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>

            <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-2 py-1 bg-blue-50 rounded-md inline-block">
                            Now Showing
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Phim đang chiếu
              </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
                            <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-blue-600 hover:text-white border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 rounded-xl px-8 py-3 font-bold shadow-lg hover:shadow-xl hover:scale-105"
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
            <section className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500"></div>
                <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-300 rounded-full"></div>
                            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2 px-2 py-1 bg-purple-50 rounded-md inline-block">
                                Coming Soon
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Phim sắp chiếu
                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-400"></div>
                                <div className="h-1.5 w-2 rounded-full bg-purple-400"></div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-purple-600 hover:text-white border-2 border-purple-500 hover:border-purple-600 transition-all duration-300 rounded-xl px-8 py-3 font-bold shadow-lg hover:shadow-xl hover:scale-105"
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
        <section className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #a855f7 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500"></div>

            <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-300 rounded-full"></div>
                        <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2 px-2 py-1 bg-purple-50 rounded-md inline-block">
                            Coming Soon
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Phim sắp chiếu
              </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-400"></div>
                            <div className="h-1.5 w-2 rounded-full bg-purple-400"></div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-purple-600 hover:text-white border-2 border-purple-500 hover:border-purple-600 transition-all duration-300 rounded-xl px-8 py-3 font-bold shadow-lg hover:shadow-xl hover:scale-105"
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
