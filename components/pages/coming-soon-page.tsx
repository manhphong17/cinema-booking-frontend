"use client"

import { ComingSoonCarousel } from "@/components/home/movie-carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, Calendar, Bell, Film } from "lucide-react"

export function ComingSoonPageContent() {
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

            {/* Countdown Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Sắp Ra Mắt
                        </h2>
                        <p className="text-lg text-gray-600">
                            Đếm ngược đến những bộ phim bom tấn sắp tới
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">25</h3>
                                <p className="text-gray-600">Ngày</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-pink-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">12</h3>
                                <p className="text-gray-600">Giờ</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">30</h3>
                                <p className="text-gray-600">Phút</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Movies Section */}
            <ComingSoonCarousel variant="page" />

            {/* Notification Section */}
            <section className="py-20 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="h-10 w-10 text-purple-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-6">
                            Nhận Thông Báo Sớm Nhất
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Đăng ký nhận thông báo để biết ngay khi có phim mới và ưu đãi đặc biệt
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input 
                                type="email" 
                                placeholder="Nhập email của bạn"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <Button className="px-8 py-3 bg-purple-600 hover:bg-purple-700">
                                Đăng ký
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

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
