import { HomeLayout } from "@/components/layouts/home-layout"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { NowShowing } from "@/components/home/now-showing"
import { AboutUs } from "@/components/home/about-us"

export default function HomePage() {
    return (
        <HomeLayout>
            <HeroCarousel />
            <NowShowing />
            <AboutUs />
        </HomeLayout>
    )
}
