"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, Clock, Calendar, Bell, Film, Search, Filter, X, ChevronDown } from "lucide-react"
import { 
  getComingSoonMoviesPaginated,
  type Movie
} from "../../src/api/movies"
import { useRouter } from "next/navigation"
import apiClient from "../../src/api/interceptor"

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
            {/* Hero Section */}
            <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(to right, #3BAEF0, #38AAEC, #3BAEF0)' }}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-white via-[#E6F5FF] to-white bg-clip-text text-transparent drop-shadow-lg">
                            Phim Sắp Chiếu
                        </span>
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto font-medium" style={{ color: '#E6F5FF' }}>
                        Những bộ phim hấp dẫn sắp ra mắt - Đặt vé ngay để không bỏ lỡ
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="h-1.5 w-24 rounded-full bg-white/50"></div>
                        <div className="h-1.5 w-2 rounded-full bg-white"></div>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <section className="py-8 bg-white">
                <div className="container mx-auto px-4">
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc phim</h3>
                            </div>
                            
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
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Movies Section */}
            <section className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #3BAEF0 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                
                {/* Decorative Border Top */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#3BAEF0' }}></div>
                
                <div className="movie-carousel-container container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full" style={{ background: 'linear-gradient(to bottom, #3BAEF0, #38AAEC)' }}></div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                                <span style={{ color: '#3BAEF0' }}>
                                    Phim sắp chiếu
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full" style={{ background: 'linear-gradient(to right, #3BAEF0, #38AAEC)' }}></div>
                                <div className="h-1.5 w-2 rounded-full" style={{ backgroundColor: '#3BAEF0' }}></div>
                            </div>
                        </div>
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

            {/* Section Divider */}
            <div className="relative h-2" style={{ background: 'linear-gradient(to right, transparent, rgba(59, 174, 240, 0.5), transparent)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(59, 174, 240, 0.3), rgba(56, 170, 236, 0.5), rgba(59, 174, 240, 0.3))' }}></div>
            </div>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #3BAEF0 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
                
                {/* Decorative Border Top */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#3BAEF0' }}></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16 relative">
                        <div className="inline-block mb-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider mb-2 px-3 py-1 rounded-md" style={{ color: '#3BAEF0', backgroundColor: '#E6F5FF' }}>
                                Benefits
                            </div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            <span style={{ color: '#3BAEF0' }}>
                                Lợi Ích Khi Đặt Vé Sớm
                            </span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                            Đặt vé trước để tận hưởng nhiều ưu đãi và đảm bảo chỗ ngồi tốt nhất
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="h-1.5 w-24 rounded-full" style={{ background: 'linear-gradient(to right, #3BAEF0, #38AAEC)' }}></div>
                            <div className="h-1.5 w-2 rounded-full" style={{ backgroundColor: '#3BAEF0' }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E6F5FF' }}>
                                    <Star className="h-8 w-8" style={{ color: '#3BAEF0' }} />
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
                                    <Film className="h-8 w-8" style={{ color: '#3BAEF0' }} />
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
                                    <Bell className="h-8 w-8" style={{ color: '#3BAEF0' }} />
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
