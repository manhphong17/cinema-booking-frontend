"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import {
    getHomepageMovies,
    getHomepageComingSoon,
    type Movie
} from "@/src/api/movies" // ✅ dùng alias thay vì đường dẫn tương đối

/* ----------------------------------------------------------------
   ContactCard (gộp vào chung file, giữ nguyên UI + props + nghiệp vụ)
----------------------------------------------------------------- */
interface ContactCardProps {
    Icon: LucideIcon;
    title: string;
    content: string;
    linkHref?: string;
    linkText?: string;
    subContent?: string;
}

export const ContactCard: React.FC<ContactCardProps> = ({
                                                            Icon,
                                                            title,
                                                            content,
                                                            linkHref,
                                                            linkText,
                                                            subContent
                                                        }) => {
    return (
        <div className="p-5 rounded-xl text-white
      bg-gray-900 shadow-2xl shadow-black/80 ring-1 ring-white/10
      bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
      transition-all duration-300 hover:shadow-pink-500/30">
            <div className="flex items-start gap-4">
                <Icon className="h-6 w-6 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-lg font-bold text-white mb-0.5">{title}</p>
                    <p className="text-base font-medium text-gray-200">{content}</p>

                    {linkHref && (
                        <a
                            href={linkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1 inline-block"
                        >
                            {linkText || "Chi tiết"}
                        </a>
                    )}

                    {subContent && (
                        <p className="text-xs text-slate-400 mt-1">{subContent}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ----------------------------------------------------------------
   HomeNowShowingCarousel
----------------------------------------------------------------- */
export function HomeNowShowingCarousel() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const data = await getHomepageMovies()
                setMovies(data)
            } catch (e) {
                console.error("Error fetching homepage movies:", e)
                setMovies([])
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    if (loading) {
        return (
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full" />
                            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-2 py-1 bg-blue-50 rounded-md inline-block">
                                Now Showing
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Phim đang chiếu
                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-300" />
                                <div className="h-1.5 w-2 rounded-full bg-blue-400" />
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

                    {/* Skeleton grid (giữ nguyên “nghiệp vụ” hiển thị chờ) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-lg">
                                <div className="animate-pulse w-full h-64 bg-gray-200 rounded-lg mb-3" />
                                <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded mb-2" />
                                <div className="animate-pulse h-8 w-full bg-gray-200 rounded mb-2" />
                                <div className="animate-pulse h-8 w-full bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* background pattern nhẹ */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full" />
                        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-2 py-1 bg-blue-50 rounded-md inline-block">
                            Now Showing
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Phim đang chiếu
              </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-300" />
                            <div className="h-1.5 w-2 rounded-full bg-blue-400" />
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

                {/* Movie grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {movies.map((movie) => (
                        <div
                            key={movie.id}
                            className="group rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition cursor-pointer"
                            onClick={() => router.push(`/movie/${movie.id}`)}
                        >
                            <div className="relative overflow-hidden">
                                <img
                                    src={(movie as any).posterUrl || (movie as any).poster || "/placeholder.svg"}
                                    alt={movie.name || (movie as any).title || "Movie poster"}
                                    className="w-full h-64 object-cover group-hover:scale-105 transition"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (target.src !== "/placeholder.svg") target.src = "/placeholder.svg"
                                    }}
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-white text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-400">
                                    P{(movie as any).ageRating ?? ""}
                                </div>
                            </div>

                            <div className="p-3">
                                <h3 className="font-semibold line-clamp-1">{movie.name || (movie as any).title}</h3>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                        className="rounded-lg py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/booking?movieId=${movie.id}`)
                                        }}
                                    >
                                        Đặt vé
                                    </button>
                                    <button
                                        className="rounded-lg py-2 font-semibold border border-gray-300 hover:bg-gray-50 transition"
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

                {movies.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Không có phim đang chiếu</div>
                )}
            </div>
        </section>
    )
}

/* ----------------------------------------------------------------
   HomeComingSoonCarousel
----------------------------------------------------------------- */
export function HomeComingSoonCarousel() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const data = await getHomepageComingSoon()
                setMovies(data)
            } catch (e) {
                console.error("Error fetching homepage coming soon movies:", e)
                setMovies([])
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    if (loading) {
        return (
            <section className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500" />
                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-300 rounded-full" />
                            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2 px-2 py-1 bg-purple-50 rounded-md inline-block">
                                Coming Soon
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Phim sắp chiếu
                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-400" />
                                <div className="h-1.5 w-2 rounded-full bg-purple-400" />
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

                    {/* Skeleton grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-lg">
                                <div className="animate-pulse w-full h-64 bg-gray-200 rounded-lg mb-3" />
                                <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded mb-2" />
                                <div className="animate-pulse h-8 w-full bg-gray-200 rounded mb-2" />
                                <div className="animate-pulse h-8 w-full bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #a855f7 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-300 rounded-full" />
                        <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2 px-2 py-1 bg-purple-50 rounded-md inline-block">
                            Coming Soon
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Phim sắp chiếu
              </span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-400" />
                            <div className="h-1.5 w-2 rounded-full bg-purple-400" />
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

                {/* Movie grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {movies.map((movie) => (
                        <div
                            key={movie.id}
                            className="group rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition cursor-pointer"
                            onClick={() => router.push(`/movie/${movie.id}`)}
                        >
                            <div className="relative overflow-hidden">
                                <img
                                    src={(movie as any).posterUrl || (movie as any).poster || "/placeholder.svg"}
                                    alt={movie.name || (movie as any).title || "Movie poster"}
                                    className="w-full h-64 object-cover group-hover:scale-105 transition"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (target.src !== "/placeholder.svg") target.src = "/placeholder.svg"
                                    }}
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-white text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-500">
                                    P{(movie as any).ageRating ?? ""}
                                </div>
                            </div>

                            <div className="p-3">
                                <h3 className="font-semibold line-clamp-1">{movie.name || (movie as any).title}</h3>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                        className="rounded-lg py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 transition"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/booking?movieId=${movie.id}`)
                                        }}
                                    >
                                        Đặt vé
                                    </button>
                                    <button
                                        className="rounded-lg py-2 font-semibold border border-gray-300 hover:bg-gray-50 transition"
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

                {movies.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Không có phim sắp chiếu</div>
                )}
            </div>
        </section>
    )
}

export default ContactCard