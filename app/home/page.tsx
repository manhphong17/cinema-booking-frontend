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
            // Decode token to get role information and email
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                // Check for both 'roles' (backend) and 'authorities' (legacy)
                const roles = payload.roles || payload.authorities
                if (roles && Array.isArray(roles)) {
                    localStorage.setItem('roleName', JSON.stringify(roles))
                }
                // Extract email from 'sub' field (subject) and store it
                if (payload.sub) {
                    localStorage.setItem('email', payload.sub)
                    localStorage.setItem('userEmail', payload.sub)
                }
                // Store userId if available
                if (payload.userId) {
                    localStorage.setItem('userId', String(payload.userId))
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

                {/* Section Divider */}
                <div className="relative h-2 bg-gradient-to-r from-transparent via-blue-300/50 to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-blue-400/50 to-blue-500/30"></div>
                </div>

                {/* Now Showing Movies */}
                <HomeNowShowingCarousel />

                {/* Section Divider */}
                <div className="relative h-2 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-purple-400/50 to-purple-500/30"></div>
                </div>

                {/* Coming Soon Movies */}
                <HomeComingSoonCarousel />

                {/* Section Divider */}
                <div className="relative h-2 bg-gradient-to-r from-transparent via-pink-300/50 to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-pink-400/50 to-pink-500/30"></div>
                </div>

                {/* About Us */}
                <AboutUs />
            </div>
        </HomeLayout>
    )
}