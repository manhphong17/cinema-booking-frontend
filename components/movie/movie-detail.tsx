"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Movie } from "@/type/movie"

interface MovieDetailProps {
    movie: Movie
    onBack: () => void
}

export function MovieDetail({ movie, onBack }: MovieDetailProps) {
  const router = useRouter()

  // Convert trailer URL to embed format
  function toEmbedUrl(url: string): string {
    if (!url) return ""

    // YouTube
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/")
    }

    // youtu.be short link
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "www.youtube.com/embed/")
    }

    // Vimeo
    if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
      return url.replace("vimeo.com/", "player.vimeo.com/video/")
    }

    return url // Nếu đã đúng dạng hoặc là loại khác
  }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Hero Section */}
            <div className="relative h-[70vh] md:h-[65vh] lg:h-[60vh] xl:h-[55vh] overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-800/90 to-slate-900/90">
                <div
                    className="w-[80%] h-[80%] bg-cover bg-center bg-no-repeat rounded-lg shadow-2xl"
                    style={{ 
                        backgroundImage: `url(${movie.bannerUrl || movie.posterUrl || '/placeholder-banner.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Nội Dung Phim</h1>
                    <div className="w-16 h-1 bg-black mx-auto"></div>
                </div>



                <div className="max-w-6xl mx-auto">
                    {/* Poster and Movie Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Poster Section - Left */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <img
                                    src={movie.posterUrl || '/placeholder-movie.jpg'}
                                    alt={movie.name}
                                    className="w-full rounded-lg shadow-lg mb-4"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-movie.jpg'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Movie Info Section - Right */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground mb-6">{movie.name}</h2>
                                
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-semibold text-foreground">Đạo diễn: </span>
                                        <span className="text-muted-foreground">{movie.director}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground">Diễn viên: </span>
                                        <span className="text-muted-foreground">{movie.actor}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground">Thể loại: </span>
                                        <span className="text-muted-foreground">{movie.genre.map(g => g.name).join(', ')}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground">Khởi chiếu: </span>
                                        <span className="text-muted-foreground">{new Date(movie.releaseDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground">Thời lượng: </span>
                                        <span className="text-muted-foreground">{movie.duration} phút</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground">Ngôn ngữ: </span>
                                        <span className="text-muted-foreground">{movie.language.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-foreground">Rated: </span>
                                        <span className="font-bold text-muted-foreground">P{movie.ageRating} - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ {movie.ageRating} TUỔI TRỞ LÊN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Movie Description */}
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-foreground mb-3">Mô tả phim</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {movie.description}
                                </p>
                            </div>

                            {/* Rating Badges and Action Button */}
                            <div className="flex gap-4 items-center flex-wrap">
                                <div className="bg-orange-500 text-white px-4 py-2 rounded font-bold">
                                    PHT CINEMA
                                </div>
                                {movie.status === 'PLAYING' ? (
                                    <Button
                                        onClick={() => router.push(`/booking?movieId=${movie.id}`)}
                                        className="relative group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 font-bold shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 border-2 border-red-500/50 rounded-xl overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative flex items-center">
                                            <Play className="mr-2 h-5 w-5" />
                                            Đặt vé ngay
                                        </div>
                                    </Button>
                                ) : movie.status === 'UPCOMING' ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 font-bold rounded-xl border-2 border-blue-400/50 flex items-center shadow-xl">
                                            <Calendar className="mr-2 h-5 w-5 animate-pulse" />
                                            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-extrabold">
                                                Sắp chiếu
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 font-bold shadow-xl rounded-xl border-2 border-gray-500/50 flex items-center">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        Đã kết thúc
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Trailer Section - Center */}
                    {movie.trailerUrl && toEmbedUrl(movie.trailerUrl) && (
                        <div className="mt-8 flex justify-center">
                            <Card className="w-full max-w-4xl">
                                <CardContent className="p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-center">Trailer</h4>
                                    <div className="aspect-video rounded-lg overflow-hidden">
                                        <iframe
                                            src={toEmbedUrl(movie.trailerUrl)}
                                            title={`${movie.name} - Trailer`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            onError={(e) => {
                                                console.error('Trailer iframe error:', e)
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}