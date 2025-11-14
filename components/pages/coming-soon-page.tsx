"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, Clock, Calendar, Bell, Film, Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { 
  getComingSoonMoviesPaginated,
  type Movie
} from "../../src/api/movies"
import { useRouter } from "next/navigation"
import apiClient from "../../src/api/interceptor"
import Image from "next/image"

interface Genre {
  id: number
  name: string
}

interface MovieFilters {
  search?: string
  genre?: string
  genreId?: number
  status?: 'PLAYING' | 'UPCOMING' | 'ENDED'
  pageNo?: number
  pageSize?: number
}

interface FilterState {
  search: string
  genre: string
}

export function ComingSoonPageContent() {
    const router = useRouter()
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        genre: ""
    })
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    
    // Filter states
    const [genres, setGenres] = useState<Genre[]>([])
    const [isLoadingGenres, setIsLoadingGenres] = useState(true)
    const [showGenreDropdown, setShowGenreDropdown] = useState(false)
    const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)

    // Banner state
    const [banners, setBanners] = useState<Array<{ id: string; bannerUrl: string }>>([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isLoadingBanner, setIsLoadingBanner] = useState(true)

    const fetchMovies = async (page: number = 1, append: boolean = false) => {
        try {
            if (page === 1) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            const movieFilters: MovieFilters = {
                search: filters?.search,
                genreId: filters?.genre ? parseInt(filters.genre) : undefined,
                status: 'UPCOMING',
                pageNo: page,
                pageSize: 8
            }

            const data = await getComingSoonMoviesPaginated(movieFilters)
            
            if (append) {
                setMovies(prev => [...prev, ...data.movies])
            } else {
                setMovies(data.movies)
            }
            
            setHasMore(data.pagination.hasMore)
        } catch (error) {
            console.error('Error fetching coming soon movies:', error)
            if (!append) {
                setMovies([])
            }
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                setIsLoadingGenres(true)
                const response = await apiClient.get('/movies/movie-genres')
                setGenres(response.data.data || [])
            } catch (error) {
                console.error("Failed to fetch genres:", error)
            } finally {
                setIsLoadingGenres(false)
            }
        }
        fetchGenres()
    }, [])

    // Fetch banners từ API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                setIsLoadingBanner(true)
                const response = await apiClient.get('/movies/banners')
                if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
                    // Transform banner data
                    const transformedBanners = response.data.data.map((banner: any) => ({
                        id: banner.movieId?.toString() || Math.random().toString(),
                        bannerUrl: banner.bannerUrl
                    })).filter((banner: any) => banner.bannerUrl)
                    setBanners(transformedBanners)
                }
            } catch (error) {
                console.error("Failed to fetch banners:", error)
            } finally {
                setIsLoadingBanner(false)
            }
        }
        fetchBanners()
    }, [])

    // Auto-play carousel
    useEffect(() => {
        if (banners.length <= 1) return

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length)
        }, 5000) // Change slide every 5 seconds

        return () => clearInterval(timer)
    }, [banners.length])

    // Navigation functions
    const nextSlide = () => {
        if (banners.length <= 1) return
        setCurrentSlide((prev) => (prev + 1) % banners.length)
    }

    const prevSlide = () => {
        if (banners.length <= 1) return
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
    }

    const goToSlide = (index: number) => {
        if (banners.length <= 1) return
        setCurrentSlide(index)
    }

    useEffect(() => {
        setCurrentPage(1)
        fetchMovies(1, false)
    }, [filters])

    const handleShowMore = () => {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        fetchMovies(nextPage, true)
    }

    const handleShowLess = () => {
        setCurrentPage(1)
        fetchMovies(1, false)
    }

    // Filter handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFilters = { ...filters, search: e.target.value }
        setFilters(newFilters)
    }

    const handleGenreSelect = (genre: Genre) => {
        setSelectedGenre(genre)
        const newFilters = { ...filters, genre: genre.id.toString() }
        setFilters(newFilters)
        setShowGenreDropdown(false)
    }

    const handleGenreRemove = () => {
        setSelectedGenre(null)
        const newFilters = { ...filters, genre: "" }
        setFilters(newFilters)
    }

    const handleClearFilters = () => {
        setFilters({
            search: "",
            genre: ""
        })
        setSelectedGenre(null)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Banner Carousel with Container */}
            <section className="py-6 md:py-8 lg:py-10 bg-white">
                <div className="container mx-auto px-2 md:px-3 lg:px-4 max-w-[98%] md:max-w-[96%] lg:max-w-[94%] xl:max-w-[92%]">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl h-[35vh] md:h-[40vh] lg:h-[45vh]">
                        {/* Loading Placeholder */}
                        {isLoadingBanner && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-gray-400">
                                        <Film className="w-16 h-16 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Banner Carousel */}
                        {!isLoadingBanner && banners.length > 0 ? (
                            <>
                                {banners.map((banner, index) => (
                                    <div
                                        key={banner.id}
                                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                    >
                                        <Image
                                            src={banner.bannerUrl}
                                            alt={`Movie Banner ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            priority={index === currentSlide}
                                            quality={90}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1280px"
                                            onError={(e) => {
                                                console.error(`Failed to load banner ${index + 1}`)
                                            }}
                                        />
                                    </div>
                                ))}

                                {/* Navigation Arrows - chỉ hiện khi có nhiều hơn 1 banner */}
                                {banners.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevSlide}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                                            aria-label="Previous banner"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={nextSlide}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                                            aria-label="Next banner"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {/* Dots Indicator - chỉ hiện khi có nhiều hơn 1 banner */}
                                {banners.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                        {banners.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToSlide(index)}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                                    index === currentSlide
                                                        ? 'bg-white w-8 shadow-lg'
                                                        : 'bg-white/50 hover:bg-white/75'
                                                }`}
                                                aria-label={`Go to slide ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : !isLoadingBanner && (
                            <>
                                {/* Fallback gradient nếu không có banner */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 flex items-center justify-center">
                                    <div className="text-center text-white/80">
                                        <Film className="w-20 h-20 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Không có banner</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Movies Section */}
            <section className="py-8 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #3BAEF0 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                
                <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                    {/* Title Section - Centered */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            PHIM SẮP CHIẾU
                        </h2>
                        <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                    </div>

                    {/* Filter Section */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Tìm kiếm phim..."
                                        value={filters.search}
                                        onChange={handleSearchChange}
                                        className="pl-10 h-11 border-gray-300"
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3BAEF0'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                                    />
                                </div>
                            </div>

                            {/* Genre Filter */}
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                                    className="h-11 px-4 border-gray-300 hover:bg-gray-50 min-w-[140px] justify-between"
                                    disabled={isLoadingGenres}
                                >
                                    {selectedGenre ? selectedGenre.name : "Tất cả thể loại"}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>

                                {/* Genre Dropdown */}
                                {showGenreDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                handleGenreRemove()
                                                setShowGenreDropdown(false)
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                                        >
                                            Tất cả thể loại
                                        </button>
                                        {genres.map((genre) => (
                                            <button
                                                key={genre.id}
                                                onClick={() => handleGenreSelect(genre)}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                            >
                                                {genre.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clear Filters */}
                            <Button
                                variant="outline"
                                onClick={handleClearFilters}
                                className="h-11 px-4 border-gray-300 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Xóa bộ lọc
                            </Button>
                        </div>

                        {/* Active Filters Display */}
                        {(filters.search || selectedGenre) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {filters.search && (
                                    <Badge variant="secondary" style={{ backgroundColor: '#E6F5FF', color: '#3BAEF0' }}>
                                        Tìm kiếm: "{filters.search}"
                                        <button
                                            onClick={() => {
                                                const newFilters = { ...filters, search: "" }
                                                setFilters(newFilters)
                                            }}
                                            className="ml-2"
                                            style={{ color: '#3BAEF0' }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {selectedGenre && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Thể loại: {selectedGenre.name}
                                        <button
                                            onClick={handleGenreRemove}
                                            className="ml-2 hover:text-green-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        {/* Movie Grid */}
                        <div className="movie-page-grid">
                            {movies.map((movie) => (
                                <div key={movie.id} className="movie-page-card" onClick={() => router.push(`/movie/${movie.id}`)}>
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={movie.posterUrl || movie.poster || "/placeholder.svg"}
                                            alt={movie.name || movie.title || "Movie poster"}
                                            className="movie-page-poster"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                if (target.src !== "/placeholder.svg") {
                                                    target.src = "/placeholder.svg";
                                                }
                                            }}
                                        />
                                        <div className="movie-page-badge">
                                            P{movie.ageRating}
                                        </div>
                                    </div>
                                    <div className="movie-page-content">
                                        <h3 className="movie-page-title">
                                            {movie.name || movie.title}
                                        </h3>
                                        <div className="movie-page-buttons">
                                            <button 
                                                className="movie-page-btn movie-page-btn-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(`/booking?movieId=${movie.id}`)
                                                }}
                                            >
                                                Đặt vé
                                            </button>
                                            <button 
                                                className="movie-page-btn movie-page-btn-secondary"
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

                        {/* Show More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <Button
                                    onClick={handleShowMore}
                                    disabled={loadingMore}
                                    style={{ backgroundColor: '#38AAEC' }}
                                    className="hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? 'Đang tải...' : 'Xem thêm 8 phim'}
                                </Button>
                            </div>
                        )}

                        {/* Show Less Button */}
                        {currentPage > 1 && (
                            <div className="flex justify-center mt-8">
                                <Button
                                    onClick={handleShowLess}
                                    variant="outline"
                                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    Thu gọn
                                </Button>
                            </div>
                        )}

                        {/* No Results Message */}
                        {movies.length === 0 && !loading && (
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

                        {/* Loading State */}
                        {loading && (
                            <div className="movie-page-grid">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="movie-page-card">
                                        <div className="skeleton w-full h-64 rounded-lg mb-3"></div>
                                        <div className="skeleton h-4 w-3/4 mb-2"></div>
                                        <div className="skeleton h-8 w-full mb-2"></div>
                                        <div className="skeleton h-8 w-full"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12 bg-gradient-to-br from-gray-50 via-white to-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #3BAEF0 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-10 relative">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Lợi Ích Khi Đặt Vé Sớm
                        </h2>
                        <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                            Đặt vé trước để tận hưởng nhiều ưu đãi và đảm bảo chỗ ngồi tốt nhất
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E6F5FF' }}>
                                    <Star className="h-8 w-8" style={{ color: '#2563eb' }} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Giảm Giá Sớm
                                </h3>
                                <p className="text-gray-600">
                                    Nhận ngay 20% giảm giá khi đặt vé trước 1 tuần
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E6F5FF' }}>
                                    <Film className="h-8 w-8" style={{ color: '#2563eb' }} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Chỗ Ngồi Tốt Nhất
                                </h3>
                                <p className="text-gray-600">
                                    Ưu tiên chọn chỗ ngồi đẹp nhất trong rạp
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E6F5FF' }}>
                                    <Bell className="h-8 w-8" style={{ color: '#2563eb' }} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Thông Báo Sớm
                                </h3>
                                <p className="text-gray-600">
                                    Nhận thông báo ngay khi có suất chiếu mới
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
