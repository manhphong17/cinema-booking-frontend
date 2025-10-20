"use client"

import { useState } from "react"
import { NowShowingCarousel } from "@/components/home/movie-carousel"
import { MovieFilter, FilterState } from "@/components/movie/movie-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, Users, Calendar, Film } from "lucide-react"

export function NowShowingPageContent() {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Phim Đang Chiếu
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Khám phá những bộ phim hay nhất đang được chiếu tại rạp của chúng tôi
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
            <NowShowingCarousel variant="page" filters={filters} />

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Tại Sao Chọn Chúng Tôi?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Trải nghiệm xem phim tuyệt vời với công nghệ hiện đại và dịch vụ chuyên nghiệp
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Film className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Công Nghệ 4K
                                </h3>
                                <p className="text-gray-600">
                                    Hệ thống chiếu phim 4K với âm thanh Dolby Atmos mang đến trải nghiệm sống động
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Đặt Vé Dễ Dàng
                                </h3>
                                <p className="text-gray-600">
                                    Hệ thống đặt vé online tiện lợi, thanh toán an toàn và nhận vé ngay lập tức
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Dịch Vụ Chuyên Nghiệp
                                </h3>
                                <p className="text-gray-600">
                                    Đội ngũ nhân viên chuyên nghiệp, nhiệt tình phục vụ khách hàng 24/7
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
