"use client"

import { useState } from "react"
import { ComingSoonCarousel } from "@/components/home/movie-carousel"
import { MovieFilter, FilterState } from "@/components/movie/movie-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Clock, Calendar, Bell, Film } from "lucide-react"

export function ComingSoonPageContent() {
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        genre: ""
    })

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters)
    }

    const handleClearFilters = () => {
        setFilters({
            search: "",
            genre: ""
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Phim Sắp Chiếu
                    </h1>
                    <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                        Những bộ phim hấp dẫn sắp ra mắt - Đặt vé ngay để không bỏ lỡ
                    </p>
                </div>
            </section>

            {/* Filter Section */}
            <section className="py-8 bg-white">
                <div className="container mx-auto px-4">
                    <MovieFilter 
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </section>

            {/* Movies Section */}
            <ComingSoonCarousel variant="page" filters={filters} />

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Lợi Ích Khi Đặt Vé Sớm
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Đặt vé trước để tận hưởng nhiều ưu đãi và đảm bảo chỗ ngồi tốt nhất
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Star className="h-8 w-8 text-green-600" />
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
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Film className="h-8 w-8 text-blue-600" />
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
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="h-8 w-8 text-purple-600" />
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
