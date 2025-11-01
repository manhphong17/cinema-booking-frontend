"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HomeLayout } from "@/components/layouts/home-layout"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { HomeNowShowingCarousel, HomeComingSoonCarousel } from "@/components/home/home-movie-carousel"
import { AboutUs } from "@/components/home/about-us"

export default function HomePage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Handle OAuth callback - get access token from URL
    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            // Store access token in localStorage
            localStorage.setItem('accessToken', token)
            // Decode token to get role information
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.authorities && Array.isArray(payload.authorities)) {
                    localStorage.setItem('roleName', JSON.stringify(payload.authorities))
                }
            } catch (error) {
                console.error('Error decoding token:', error)
            }
            // Remove token from URL for security
            router.replace('/home', { scroll: false })
        }
    }, [searchParams, router])

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