import { HomeLayout } from "@/components/layouts/home-layout"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { HomeNowShowingCarousel, HomeComingSoonCarousel } from "@/components/home/home-movie-carousel"
import { AboutUs } from "@/components/home/about-us"

export default function HomePage() {
    return (
        <HomeLayout>
            <div className="min-h-screen">
                {/* Hero Carousel */}
                <HeroCarousel />

                {/* Now Showing Movies */}
                <HomeNowShowingCarousel />

                {/* Coming Soon Movies */}
                <HomeComingSoonCarousel />

                {/* About Us */}
                <AboutUs />
            </div>
        </HomeLayout>
    )
}