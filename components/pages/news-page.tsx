"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, ArrowRight, Star, Film, Search, Filter } from "lucide-react"
import { useState } from "react"

export function NewsPageContent() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const news = [
        {
            id: 1,
            title: "Rạp chiếu phim mở cửa trở lại với nhiều phim bom tấn",
            excerpt: "Sau thời gian tạm dừng, rạp chiếu phim chính thức mở cửa trở lại với hàng loạt phim bom tấn hấp dẫn...",
            content: "Rạp chiếu phim của chúng tôi đã chính thức mở cửa trở lại sau thời gian tạm dừng để nâng cấp hệ thống. Với công nghệ chiếu phim 4K mới nhất và hệ thống âm thanh Dolby Atmos, chúng tôi cam kết mang đến trải nghiệm xem phim tuyệt vời nhất cho khán giả.",
            author: "Admin",
            date: "15/12/2024",
            category: "Tin tức",
            image: "/placeholder.svg",
            featured: true,
            tags: ["mở cửa", "phim bom tấn", "công nghệ"]
        },
        {
            id: 2,
            title: "Khuyến mãi đặc biệt cho dịp lễ Giáng Sinh",
            excerpt: "Nhân dịp lễ Giáng Sinh, rạp chiếu phim có nhiều chương trình khuyến mãi hấp dẫn...",
            content: "Từ ngày 20/12 đến 31/12, khách hàng sẽ được giảm giá 30% cho tất cả vé xem phim và 50% cho combo bắp nước. Đặc biệt, khách hàng mua vé online sẽ được tặng kèm 1 ly nước ngọt miễn phí.",
            author: "Marketing Team",
            date: "10/12/2024",
            category: "Khuyến mãi",
            image: "/placeholder.svg",
            featured: false,
            tags: ["giáng sinh", "khuyến mãi", "giảm giá"]
        },
        {
            id: 3,
            title: "Phim mới: Avatar 3 - The Seed Bearer",
            excerpt: "Avatar 3 chính thức ra mắt tại rạp với công nghệ chiếu phim 3D tiên tiến...",
            content: "Avatar 3: The Seed Bearer là phần tiếp theo của loạt phim Avatar đình đám. Với công nghệ 3D tiên tiến và cốt truyện hấp dẫn, bộ phim hứa hẹn sẽ mang đến trải nghiệm thị giác tuyệt vời cho khán giả.",
            author: "Film Critic",
            date: "05/12/2024",
            category: "Phim ảnh",
            image: "/placeholder.svg",
            featured: true,
            tags: ["avatar 3", "3D", "bom tấn"]
        },
        {
            id: 4,
            title: "Hệ thống đặt vé online được nâng cấp",
            excerpt: "Website đặt vé online được nâng cấp với giao diện mới và tính năng tiện ích...",
            content: "Chúng tôi đã nâng cấp hệ thống đặt vé online với giao diện thân thiện hơn, tốc độ tải nhanh hơn và nhiều tính năng tiện ích như lưu thông tin thanh toán, nhắc nhở lịch chiếu...",
            author: "IT Team",
            date: "01/12/2024",
            category: "Công nghệ",
            image: "/placeholder.svg",
            featured: false,
            tags: ["website", "nâng cấp", "đặt vé"]
        },
        {
            id: 5,
            title: "Chương trình thành viên VIP mới",
            excerpt: "Rạp chiếu phim ra mắt chương trình thành viên VIP với nhiều ưu đãi đặc biệt...",
            content: "Chương trình thành viên VIP mới mang đến nhiều ưu đãi hấp dẫn như giảm giá 20% cho tất cả vé xem phim, ưu tiên chọn chỗ ngồi, và nhiều quà tặng đặc biệt khác.",
            author: "Customer Service",
            date: "28/11/2024",
            category: "Tin tức",
            image: "/placeholder.svg",
            featured: false,
            tags: ["VIP", "thành viên", "ưu đãi"]
        },
        {
            id: 6,
            title: "Phim Việt Nam: \"Lật Mặt 7: Một Điều Ước\"",
            excerpt: "Bộ phim Việt Nam đình đám \"Lật Mặt 7\" chính thức ra mắt tại rạp...",
            content: "Lật Mặt 7: Một Điều Ước là phần tiếp theo của loạt phim Lật Mặt đình đám. Với dàn diễn viên quen thuộc và cốt truyện hấp dẫn, bộ phim hứa hẹn sẽ mang đến nhiều cảm xúc cho khán giả.",
            author: "Film Critic",
            date: "25/11/2024",
            category: "Phim ảnh",
            image: "/placeholder.svg",
            featured: false,
            tags: ["lật mặt 7", "phim việt", "đình đám"]
        }
    ]

    const categories = ["all", "Tin tức", "Khuyến mãi", "Phim ảnh", "Công nghệ"]

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Tin tức': return 'bg-blue-100 text-blue-800'
            case 'Khuyến mãi': return 'bg-orange-100 text-orange-800'
            case 'Phim ảnh': return 'bg-purple-100 text-purple-800'
            case 'Công nghệ': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredNews = news.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const featuredNews = filteredNews.filter(article => article.featured)
    const regularNews = filteredNews.filter(article => !article.featured)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Tin Tức & Sự Kiện
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Cập nhật những tin tức mới nhất về phim ảnh, khuyến mãi và sự kiện
                    </p>
                </div>
            </section>

            {/* Search and Filter Section */}
            <section className="py-8 bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tin tức..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === "all" ? "Tất cả" : category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured News */}
            {featuredNews.length > 0 && (
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Tin Tức Nổi Bật
                            </h2>
                            <p className="text-lg text-gray-600">
                                Những tin tức và sự kiện quan trọng nhất
                            </p>
                        </div>

                        <div className="mb-16">
                            {featuredNews.map((article) => (
                                <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 mb-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                        <div className="relative h-64 lg:h-auto">
                                            <img 
                                                src={article.image} 
                                                alt={article.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <Badge className={`${getCategoryColor(article.category)} flex items-center gap-1`}>
                                                    <Film className="h-4 w-4" />
                                                    {article.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-8">
                                            <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                                                {article.title}
                                            </CardTitle>
                                            <p className="text-gray-600 mb-6 leading-relaxed">
                                                {article.content}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {article.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        {article.author}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {article.date}
                                                    </span>
                                                </div>
                                                <Button className="flex items-center gap-2">
                                                    Đọc thêm
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Other News */}
            {regularNews.length > 0 && (
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Tin Tức Khác
                            </h2>
                            <p className="text-lg text-gray-600">
                                Các tin tức và sự kiện khác
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {regularNews.map((article) => (
                                <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                    <div className="relative h-48">
                                        <img 
                                            src={article.image} 
                                            alt={article.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className={`${getCategoryColor(article.category)} flex items-center gap-1`}>
                                                <Film className="h-4 w-4" />
                                                {article.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <CardTitle className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                                            {article.title}
                                        </CardTitle>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                            {article.excerpt}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {article.tags.slice(0, 3).map((tag, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    #{tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {article.author}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {article.date}
                                                </span>
                                            </div>
                                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                                                Đọc
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* No Results */}
            {filteredNews.length === 0 && (
                <section className="py-20">
                    <div className="container mx-auto px-4 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Không tìm thấy tin tức
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
                        </p>
                        <Button onClick={() => {
                            setSearchTerm("")
                            setSelectedCategory("all")
                        }}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                </section>
            )}
        </div>
    )
}
