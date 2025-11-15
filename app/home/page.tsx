"use client"

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HomeLayout } from "@/components/layouts/home-layout"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { HomeNowShowingCarousel, HomeComingSoonCarousel } from "@/components/home/home-movie-carousel"
import { AboutUs } from "@/components/home/about-us"

// ===============================
// 2️⃣ COMPONENT CHÍNH
// ===============================
export default function HomePage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // =======================================
    // 🟢 useEffect — XỬ LÝ OAUTH CALLBACK
    // =======================================
    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            // Lưu access token vào localStorage
            localStorage.setItem('accessToken', token)
            
            // Giải mã token để lấy thông tin role và email
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                
                // Kiểm tra cả 'roles' (backend) và 'authorities' (legacy)
                const roles = payload.roles || payload.authorities
                if (roles && Array.isArray(roles)) {
                    localStorage.setItem('roleName', JSON.stringify(roles))
                }
                
                // Trích xuất email từ trường 'sub' (subject) và lưu
                if (payload.sub) {
                    localStorage.setItem('email', payload.sub)
                    localStorage.setItem('userEmail', payload.sub)
                }
                
                // Lưu userId nếu có
                if (payload.userId) {
                    localStorage.setItem('userId', String(payload.userId))
                }
            } catch (error) {
                console.error('Lỗi khi giải mã token:', error)
            }
            
            // Xóa token khỏi URL vì lý do bảo mật
            router.replace('/home', { scroll: false })
            
            // Dispatch custom event sau khi router replace để đảm bảo HomeLayout đã sẵn sàng
            // Sử dụng setTimeout để đảm bảo event được xử lý sau khi route thay đổi
            setTimeout(() => {
                window.dispatchEvent(new Event('tokenSet'))
            }, 100)
        }
    }, [searchParams, router])

    // =======================================
    // 🟢 RETURN UI
    // =======================================
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