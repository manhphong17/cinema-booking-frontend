import { HomeLayout } from "@/components/layouts/home-layout"
import { ComingSoonCarousel } from "@/components/home/movie-carousel"

export default function ComingSoonPage() {
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Phim sắp chiếu
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            <p className="text-lg text-muted-foreground mt-4">
              Những bộ phim hấp dẫn sắp ra mắt tại rạp của chúng tôi
            </p>
          </div>
          
          <ComingSoonCarousel variant="page" />
        </div>
      </div>
    </HomeLayout>
  )
}
