"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import apiClient from "../../src/api/interceptor";

interface Banner {
    id: string
    bannerUrl: string
}

const transformMovieData = (apiData: any[]): Banner[] => {
    return apiData.map(banner => ({
        id: banner.movieId.toString(),
        bannerUrl: banner.bannerUrl
    }))
}

export function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [animationType, setAnimationType] = useState<'fade' | 'slide' | 'zoom' | 'flip'>('slide')
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const carouselRef = useRef<HTMLDivElement>(null)

    // Fetch banners từ API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await apiClient.get('movies/banners')

                if (response.data.status === 200 && response.data.data) {
                    const transformedBanners = transformMovieData(response.data.data)
                    setBanners(transformedBanners)
                } else {
                    throw new Error('Không thể load banner - API response invalid')
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchBanners()
    }, [])

    useEffect(() => {
        if (banners.length === 0) return

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length)
        }, 6000)

        return () => clearInterval(timer)
    }, [banners.length])

    useEffect(() => {
        setAnimationType('slide')
    }, [currentSlide])

    const nextSlide = () => {
        if (isTransitioning || banners.length === 0) return
        setIsTransitioning(true)
        setCurrentSlide((prev) => (prev + 1) % banners.length)
        setTimeout(() => setIsTransitioning(false), 1000)
    }

    const prevSlide = () => {
        if (isTransitioning || banners.length === 0) return
        setIsTransitioning(true)
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
        setTimeout(() => setIsTransitioning(false), 1000)
    }

    const goToSlide = (index: number) => {
        if (isTransitioning || index === currentSlide || banners.length === 0) return
        setIsTransitioning(true)
        setCurrentSlide(index)
        setTimeout(() => setIsTransitioning(false), 1000)
    }

    const getSlideClasses = (index: number) => {
        const isActive = index === currentSlide
        const baseClasses = "absolute inset-0 transition-opacity duration-500 ease-in-out"

        if (isActive) {
            return `${baseClasses} opacity-100 z-10`
        } else {
            return `${baseClasses} opacity-0 z-0`
        }
    }

    // Loading state
    if (loading) {
        return (
            <section className="py-6 md:py-8 lg:py-10 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl h-[35vh] md:h-[40vh] lg:h-[45vh] flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-lg text-slate-600">Đang tải banner...</p>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    // Error state
    if (error) {
        return (
            <section className="py-6 md:py-8 lg:py-10 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl h-[35vh] md:h-[40vh] lg:h-[45vh] flex items-center justify-center">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-lg text-slate-600 mb-4">Không thể tải banner</p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                Thử lại
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    // Empty state
    if (banners.length === 0) {
        return (
            <section className="py-6 md:py-8 lg:py-10 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl h-[35vh] md:h-[40vh] lg:h-[45vh] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-lg text-slate-600">Không có banner nào</p>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-6 md:py-8 lg:py-10 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div ref={carouselRef} className="relative overflow-hidden rounded-2xl shadow-2xl h-[35vh] md:h-[40vh] lg:h-[45vh]">
                    {/* Banner Carousel */}
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={getSlideClasses(index)}
                        >
                            <div
                                className="relative w-full h-full cursor-pointer"
                                onClick={() => router.push(`/movie/${banner.id}`)}
                            >
                                <Image
                                    src={banner.bannerUrl}
                                    alt={`Movie Banner ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === currentSlide}
                                    quality={90}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1280px"
                                    onError={(e) => {
                                        console.error(`Failed to load banner ${index + 1}`)
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Navigation Arrows - chỉ hiện khi có nhiều hơn 1 banner */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                disabled={isTransitioning}
                                className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                aria-label="Previous banner"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextSlide}
                                disabled={isTransitioning}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                                    isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                aria-label="Next banner"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Dots Indicator - chỉ hiện khi có nhiều hơn 1 banner */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    disabled={isTransitioning}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        index === currentSlide
                                            ? 'bg-white w-8 shadow-lg'
                                            : 'bg-white/50 hover:bg-white/75'
                                    } ${isTransitioning ? 'cursor-not-allowed' : ''}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}