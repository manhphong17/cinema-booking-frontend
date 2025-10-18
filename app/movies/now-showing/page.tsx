import { HomeLayout } from "@/components/layouts/home-layout"
import { NowShowingCarousel } from "@/components/home/movie-carousel"

export default function NowShowingPage() {
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          
          <NowShowingCarousel variant="page" />
        </div>
      </div>
    </HomeLayout>
  )
}
