"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import apiClient from "@/src/api/interceptor";

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
        const isPrev = index === (currentSlide - 1 + banners.length) % banners.length
        const isNext = index === (currentSlide + 1) % banners.length
        const baseClasses = "absolute inset-0 transition-all duration-1000 ease-in-out"

        if (isActive) {
            return `${baseClasses} opacity-100 translate-x-0 z-10`
        } else if (isPrev) {
            return `${baseClasses} opacity-0 -translate-x-full z-0`
        } else if (isNext) {
            return `${baseClasses} opacity-0 translate-x-full z-0`
        } else {
            return `${baseClasses} opacity-0 translate-x-full z-0`
        }
    }

    // Loading state
    if (loading) {
        return (
            <section className="hero-carousel relative h-[70vh] md:h-[65vh] lg:h-[60vh] xl:h-[55vh] overflow-hidden flex items-center justify-center aspect-ratio">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-lg text-slate-600">Đang tải banner...</p>
                </div>
            </section>
        )
    }

    // Error state
    if (error) {
        return (
            <section className="hero-carousel relative h-[70vh] md:h-[65vh] lg:h-[60vh] xl:h-[55vh] overflow-hidden flex items-center justify-center aspect-ratio">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg text-slate-600 mb-4">Không thể tải banner</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Thử lại
                    </Button>
                </div>
            </section>
        )
    }

    // Empty state
    if (banners.length === 0) {
        return (
            <section className="hero-carousel relative h-[70vh] md:h-[65vh] lg:h-[60vh] xl:h-[55vh] overflow-hidden flex items-center justify-center aspect-ratio">
                <div className="text-center">
                    <p className="text-lg text-slate-600">Không có banner nào</p>
                </div>
            </section>
        )
    }

    return (
        <section ref={carouselRef} className="hero-carousel relative h-[70vh] md:h-[65vh] lg:h-[60vh] xl:h-[55vh] overflow-hidden aspect-ratio">
            {/* Background Images - Ảnh chỉ nửa dưới, phần trên gradient */}
            {banners.map((banner, index) => {
                const prevIndex = (currentSlide - 1 + banners.length) % banners.length;
                const nextIndex = (currentSlide + 1) % banners.length;
                const isVisible = index === currentSlide || index === prevIndex || index === nextIndex;
                const isActive = index === currentSlide;

                if (!isVisible) {
                    return (
                        <div key={banner.id} className={getSlideClasses(index)}>
                            <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 animate-pulse" />
                        </div>
                    );
                }

                return (
                    <div key={banner.id} className={getSlideClasses(index)}>
                        <div 
                            className="hero-banner-70 relative w-full h-full overflow-hidden cursor-pointer"
                            onClick={() => router.push(`/movie/${banner.id}`)}
                        >
                            {/* Fallback cho toàn bộ slide */}
                            <div
                                id={`fallback-${banner.id}`}
                                className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 hidden"
                                style={{ display: 'none' }}
                            >
                                <div className="text-center text-white flex flex-col items-center justify-center h-full">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-semibold">Movie Banner</p>
                                    <p className="text-sm text-slate-400">Click to view details</p>
                                </div>
                            </div>

                            {/* Ảnh banner */}
                            <div className="banner-image-container">
                                <Image
                                    src={banner.bannerUrl}
                                    alt={`Movie Banner ${banner.id}`}
                                    fill
                                    className="hero-banner-image object-cover transition-all duration-1000 ease-out hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
                                    placeholder="empty"
                                    priority={isActive}
                                    quality={85}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const defaultImage = document.getElementById(`default-image-${banner.id}`);
                                        if (defaultImage) {
                                            defaultImage.classList.remove('hidden');
                                        } else {
                                            const fallback = document.getElementById(`fallback-${banner.id}`);
                                            if (fallback) {
                                                fallback.classList.remove('hidden');
                                                fallback.style.display = 'flex';
                                            }
                                        }
                                    }}
                                    onLoad={() => {}}
                                />
                                {/* Ảnh mặc định khi không load được */}
                                <Image
                                    src="/modern-cinema-theater-interior-luxury.jpg"
                                    alt="Default Movie Banner"
                                    fill
                                    className="hero-banner-image object-cover transition-all duration-1000 ease-out hover:scale-105 hidden"
                                    id={`default-image-${banner.id}`}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
                                    quality={85}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById(`fallback-${banner.id}`);
                                        if (fallback) {
                                            fallback.classList.remove('hidden');
                                            fallback.style.display = 'flex';
                                        }
                                    }}
                                />
                            </div>

                            {/* Overlay gradient nhẹ cho phần ảnh */}
                            <div className="banner-gradient-overlay" />
                        </div>
                    </div>
                );
            })}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                disabled={isTransitioning}
                className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-slate-800/30 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/50 backdrop-blur-md text-slate-100 p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-slate-500/30 ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-slate-400/30'
                }`}
            >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
                onClick={nextSlide}
                disabled={isTransitioning}
                className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-slate-800/30 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/50 backdrop-blur-md text-slate-100 p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-slate-500/30 ${
                    isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-slate-400/30'
                }`}
            >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        disabled={isTransitioning}
                        className={`relative w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-500 hover:scale-125 shadow-md ${
                            index === currentSlide
                                ? "bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg scale-125"
                                : "bg-slate-400/60 hover:bg-slate-300/80"
                        } ${isTransitioning ? 'cursor-not-allowed' : ''}`}
                    >
                        {index === currentSlide && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300/30 to-purple-300/30"></div>
                        )}
                    </button>
                ))}
            </div>
        </section>
    )
}