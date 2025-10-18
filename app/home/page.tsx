import { HomeLayout } from "@/components/layouts/home-layout"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { NowShowingCarousel, ComingSoonCarousel } from "@/components/home/movie-carousel"
import { AboutUs } from "@/components/home/about-us"

export default function HomePage() {
    return (
        <HomeLayout>
            <div className="min-h-screen">
                {/* Hero Carousel */}
                <HeroCarousel />

                {/* Now Showing Movies */}
                <NowShowingCarousel variant="home" />

                {/* Coming Soon Movies */}
                <ComingSoonCarousel variant="home" />

                {/* About Us */}
                <AboutUs />
            </div>
        </HomeLayout>
    )
}