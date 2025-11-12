"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getHomepageMovies, getHomepageComingSoon, type Movie } from "../../src/api/movies";
import { useRouter } from "next/navigation";

// ==================== NOW SHOWING (MÀU ĐỎ RẠP PHIM) ====================
export function HomeNowShowingCarousel() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const data = await getHomepageMovies();
            setMovies(data);
        } catch (error) {
            console.error('Error fetching homepage movies:', error);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Title Section - Centered */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            PHIM ĐANG CHIẾU
                        </h2>
                        <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                    </div>

                    <div className="home-movie-grid-compact">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="home-movie-card">
                                <div className="bg-gray-200 rounded-lg w-full h-64 mb-3 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Title Section - Centered */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-foreground mb-4">
                        PHIM ĐANG CHIẾU
                    </h2>
                    <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                </div>

                <div className="relative">
                    <div className="home-movie-grid-compact">
                        {movies.map((movie) => (
                            <div
                                key={movie.id}
                                className="home-movie-card"
                                onClick={() => router.push(`/movie/${movie.id}`)}
                            >
                                <div className="relative overflow-hidden rounded-lg">
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
                                    <div className="absolute top-2 left-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                                        P{movie.ageRating}
                                    </div>
                                </div>
                                <div className="home-movie-content">
                                    <h3 className="home-movie-title font-bold text-gray-800">
                                        {movie.name || movie.title}
                                    </h3>
                                    <div className="home-movie-buttons">
                                        <button
                                            className="home-movie-btn home-movie-btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/booking?movieId=${movie.id}`);
                                            }}
                                        >
                                            Đặt vé
                                        </button>
                                        <button
                                            className="home-movie-btn home-movie-btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/movie/${movie.id}`);
                                            }}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {movies.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-500 text-lg">Không có phim đang chiếu</div>
                        </div>
                    )}
                </div>

                {/* View All Button - Right aligned below movies */}
                {movies.length > 0 && (
                    <div className="flex justify-end mt-8">
                        <Button
                            variant="outline"
                            style={{ borderColor: '#38AAEC', color: '#38AAEC' }}
                            className="border-2 hover:bg-[#38AAEC] hover:text-white rounded-xl px-8 py-3 font-bold transition-colors"
                            onClick={() => router.push("/movies/now-showing")}
                        >
                            Xem tất cả
                        </Button>
                    </div>
                )}
            </div>

            {/* VIỀN PHÂN CÁCH GIỮA 2 SECTION */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-16"></div>
        </section>
    );
}

// ==================== COMING SOON (MÀU VÀNG ÁNH KIM) ====================
export function HomeComingSoonCarousel() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const data = await getHomepageComingSoon();
            setMovies(data);
        } catch (error) {
            console.error('Error fetching homepage coming soon movies:', error);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-gradient-to-br from-amber-50/30 to-orange-50/20">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Title Section - Centered */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            PHIM SẮP CHIẾU
                        </h2>
                        <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                    </div>

                    <div className="home-movie-grid-compact">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="home-movie-card">
                                <div className="bg-gray-200 rounded-lg w-full h-64 mb-3 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-gradient-to-br from-amber-50/30 to-orange-50/20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Title Section - Centered */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-foreground mb-4">
                        PHIM SẮP CHIẾU
                    </h2>
                    <div className="w-16 h-1 bg-black mx-auto mb-8"></div>
                </div>

                <div className="relative">
                    <div className="home-movie-grid-compact">
                        {movies.map((movie) => (
                            <div
                                key={movie.id}
                                className="home-movie-card"
                                onClick={() => router.push(`/movie/${movie.id}`)}
                            >
                                <div className="relative overflow-hidden rounded-lg">
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
                                    <div className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">
                                        P{movie.ageRating}
                                    </div>
                                </div>
                                <div className="home-movie-content">
                                    <h3 className="home-movie-title font-bold text-gray-800">
                                        {movie.name || movie.title}
                                    </h3>
                                    <div className="home-movie-buttons">
                                        <button
                                            className="home-movie-btn home-movie-btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/booking?movieId=${movie.id}`);
                                            }}
                                        >
                                            Đặt vé
                                        </button>
                                        <button
                                            className="home-movie-btn home-movie-btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/movie/${movie.id}`);
                                            }}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {movies.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-500 text-lg">Không có phim sắp chiếu</div>
                        </div>
                    )}
                </div>

                {/* View All Button - Right aligned below movies */}
                {movies.length > 0 && (
                    <div className="flex justify-end mt-8">
                        <Button
                            variant="outline"
                            style={{ borderColor: '#38AAEC', color: '#38AAEC' }}
                            className="border-2 hover:bg-[#38AAEC] hover:text-white rounded-xl px-8 py-3 font-bold transition-colors"
                            onClick={() => router.push("/movies/coming-soon")}
                        >
                            Xem tất cả
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}