import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, ArrowRight, Star, Film } from "lucide-react"

const news = [
  {
    id: 1,
    title: "Cinema ra mắt công nghệ IMAX mới nhất",
    excerpt: "Hệ thống rạp Cinema vừa nâng cấp lên công nghệ IMAX Laser 4K mới nhất, mang đến trải nghiệm xem phim đỉnh cao...",
    content: "Hệ thống rạp Cinema vừa nâng cấp lên công nghệ IMAX Laser 4K mới nhất, mang đến trải nghiệm xem phim đỉnh cao với chất lượng hình ảnh và âm thanh vượt trội. Công nghệ mới này sẽ được áp dụng tại tất cả các rạp IMAX của chúng tôi.",
    author: "Admin Cinema",
    date: "15/12/2024",
    category: "Công nghệ",
    image: "/modern-cinema-theater-interior-luxury.jpg",
    featured: true
  },
  {
    id: 2,
    title: "Chương trình khuyến mãi cuối năm 2024",
    excerpt: "Từ ngày 20/12 đến 31/12, khách hàng sẽ được giảm giá lên đến 50% cho tất cả các suất chiếu...",
    content: "Từ ngày 20/12 đến 31/12, khách hàng sẽ được giảm giá lên đến 50% cho tất cả các suất chiếu. Đặc biệt, combo gia đình sẽ được tặng thêm 1 bắp nước miễn phí. Đây là cơ hội tuyệt vời để thưởng thức những bộ phim hay nhất trong năm.",
    author: "Marketing Team",
    date: "10/12/2024",
    category: "Khuyến mãi",
    image: "/placeholder.jpg",
    featured: false
  },
  {
    id: 3,
    title: "Phim Việt Nam chiếm lĩnh màn ảnh",
    excerpt: "Năm 2024 đánh dấu sự bùng nổ của điện ảnh Việt Nam với nhiều tác phẩm chất lượng cao...",
    content: "Năm 2024 đánh dấu sự bùng nổ của điện ảnh Việt Nam với nhiều tác phẩm chất lượng cao. Từ những bộ phim hành động đầy kịch tính đến những câu chuyện tình cảm sâu lắng, điện ảnh Việt đang khẳng định vị thế trên thị trường quốc tế.",
    author: "Film Critic",
    date: "05/12/2024",
    category: "Điện ảnh",
    image: "/placeholder.jpg",
    featured: false
  },
  {
    id: 4,
    title: "Cinema mở rạp mới tại Quận 7",
    excerpt: "Rạp Cinema thứ 5 sẽ chính thức khai trương vào tháng 1/2025 tại Quận 7, TP.HCM...",
    content: "Rạp Cinema thứ 5 sẽ chính thức khai trương vào tháng 1/2025 tại Quận 7, TP.HCM. Rạp mới sẽ có 8 phòng chiếu với tổng sức chứa 1,200 ghế, trang bị đầy đủ công nghệ hiện đại nhất.",
    author: "Management",
    date: "01/12/2024",
    category: "Tin tức",
    image: "/placeholder.jpg",
    featured: false
  }
]

export default function NewsPage() {
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Tin tức & Sự kiện
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            <p className="text-lg text-muted-foreground mt-4">
              Cập nhật những tin tức mới nhất về điện ảnh và rạp chiếu phim
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured News */}
            <div className="lg:col-span-2">
              {news.filter(item => item.featured).map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-white border-0 shadow-lg mb-6">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Nổi bật
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{article.date}</span>
                      </div>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {article.content}
                    </p>
                    <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg">
                      Đọc thêm
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Other News */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Tin tức khác</h3>
              {news.filter(item => !item.featured).map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group bg-white border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{article.date}</span>
                      <Badge variant="outline" className="text-xs">{article.category}</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                      Đọc thêm
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
