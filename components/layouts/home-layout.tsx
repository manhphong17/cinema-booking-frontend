"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Film, User, ShoppingBag, LogOut, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Menu, X, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { jwtDecode } from "jwt-decode"
import { logout } from "@/src/api/interceptor"
import { fetchTheaterDetails, TheaterDetails } from "@/app/api/theater/theater"
import ContactCard from "@/components/home/contactCard"

interface HomeLayoutProps {
    children: ReactNode
}

const getGoogleMapEmbedUrl = (url: string) => {
    if (!url) return ""
    if (url.includes("embed")) return url
    const match = url.match(/[?&]q=([^&]+)/)
    if (match) return `https://maps.google.com/maps?q=${match[1]}&output=embed`
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
}

export function HomeLayout({ children }: HomeLayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [userAvatar, setUserAvatar] = useState("/customer-avatar.jpg")
    const [userName, setUserName] = useState("KH")
    const [theaterDetails, setTheaterDetails] = useState<TheaterDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // ✅ useCallback cho checkAuth để có thể gọi lại trong listener
    const checkAuth = useCallback(() => {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
            setIsAuthenticated(false)
            console.log("Không có token, chưa đăng nhập")
            return
        }

        try {
            const decoded = jwtDecode(accessToken) as { exp?: number }
            const currentTime = Math.floor(Date.now() / 1000)

            if (decoded.exp && decoded.exp < currentTime) {
                console.log("Token đã hết hạn")
                setIsAuthenticated(false)
                localStorage.removeItem("accessToken")
                localStorage.removeItem("auth")
            } else {
                setIsAuthenticated(true)
            }
        } catch (err) {
            console.error("Token không hợp lệ:", err)
            setIsAuthenticated(false)
            localStorage.removeItem("accessToken")
            localStorage.removeItem("auth")
        }
    }, [])

    // ✅ Lấy thông tin rạp phim
    useEffect(() => {
        const loadDetails = async () => {
            try {
                const data = await fetchTheaterDetails()
                setTheaterDetails(data)
            } catch (err) {
                console.error("Lỗi khi tải chi tiết rạp:", err)
                setError("Không thể tải thông tin rạp phim.")
            } finally {
                setIsLoading(false)
            }
        }
        loadDetails()
    }, [])

    // ✅ Quản lý Auth & User Info + storage listener
    useEffect(() => {
        setMounted(true)
        checkAuth()

        const loadUserData = () => {
            const storedAvatar = localStorage.getItem("userAvatar")
            const storedName = localStorage.getItem("userName") || localStorage.getItem("customerName")
            if (storedAvatar) setUserAvatar(storedAvatar)
            if (storedName) setUserName(storedName)
        }

        loadUserData()

        // Listener cho storage và custom event tokenSet (OAuth)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "accessToken") {
                if (!e.newValue) {
                    setIsAuthenticated(false)
                    setDropdownOpen(false)
                } else {
                    checkAuth()
                }
            }
            if (e.key === "userAvatar" && e.newValue) setUserAvatar(e.newValue)
            if ((e.key === "userName" || e.key === "customerName") && e.newValue) setUserName(e.newValue)
        }

        const handleTokenSet = () => {
            setTimeout(() => {
                checkAuth()
                loadUserData()
            }, 50)
        }

        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("tokenSet", handleTokenSet)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("tokenSet", handleTokenSet)
        }
    }, [checkAuth])

    // ✅ Click ngoài dropdown thì đóng
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownOpen && !(event.target as Element).closest("[data-dropdown]")) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [dropdownOpen])

    const handleLogout = () => {
        setIsAuthenticated(false)
        setDropdownOpen(false)
        logout()
    }

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDropdownOpen(!dropdownOpen)
    }

    const handleNavigate = (section: string) => {
        router.push(`/customer?section=${section}`)
        setMobileMenuOpen(false)
        setDropdownOpen(false)
    }

    const handleMenuClick = (href: string) => {
        if (href.startsWith("#")) {
            const element = document.querySelector(href)
            if (element) element.scrollIntoView({ behavior: "smooth" })
        } else {
            router.push(href)
        }
        setMobileMenuOpen(false)
    }

    if (!mounted) return <div className="min-h-screen bg-background"></div>

    return (
        <div className="home-layout">
            {/* ✅ Navbar */}
            <nav className="home-navbar fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-all"
                            onClick={() => router.push("/")}
                        >
                            <div className="relative">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                    <Film className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Cinema
                </span>
                                <span className="text-xs text-muted-foreground font-medium -mt-1">Premium Experience</span>
                            </div>
                        </div>

                        {/* Menu */}
                        <div className="hidden md:flex items-center gap-2">
                            {[
                                { path: "/home", label: "Trang chủ" },
                                { path: "/movies/now-showing", label: "Phim đang chiếu" },
                                { path: "/movies/coming-soon", label: "Phim sắp chiếu" },
                                ...(isAuthenticated ? [{ path: "/customer?section=orders", label: "Đơn hàng", isOrder: true }] : []),
                            ].map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => item.isOrder ? handleNavigate("orders") : handleMenuClick(item.path)}
                                    className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                                >
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Auth */}
                        <div className="hidden md:flex items-center gap-2">
                            {!isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => router.push("/register")}
                                        className="font-medium text-base py-3 px-6 rounded-lg bg-transparent text-[#38AAEC] border border-[#38AAEC] hover:bg-[#38AAEC] hover:text-white transition-all duration-200"
                                    >
                                        Đăng ký
                                    </button>
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="font-medium text-base py-3 px-6 rounded-lg bg-[#38AAEC] text-white hover:bg-[#3BAEF0] hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        Đăng nhập
                                    </button>
                                </>
                            ) : (
                                <div className="relative" data-dropdown>
                                    <Button variant="ghost" className="h-10 w-10 rounded-full" onClick={handleDropdownClick}>
                                        <Avatar>
                                            <AvatarImage src={userAvatar} alt="User avatar" />
                                            <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-12 w-56 bg-white border rounded-md shadow-lg z-[60]">
                                            <div className="px-4 py-2 text-sm font-medium border-b">Tài khoản của tôi</div>
                                            <button onClick={() => handleNavigate("profile")} className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full">
                                                <User className="mr-2 h-4 w-4" /> Hồ sơ
                                            </button>
                                            <button onClick={() => handleNavigate("orders")} className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full">
                                                <ShoppingBag className="mr-2 h-4 w-4" /> Đơn hàng của tôi
                                            </button>
                                            <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                                                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-gray-600" />}
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-border bg-white animate-in slide-in-from-top-2 duration-300">
                            <div className="px-4 py-6 grid grid-cols-2 gap-3">
                                {[
                                    { path: "/home", label: "Trang chủ" },
                                    { path: "/movies/now-showing", label: "Phim đang chiếu" },
                                    { path: "/movies/coming-soon", label: "Phim sắp chiếu" },
                                    ...(isAuthenticated ? [{ path: "/customer?section=orders", label: "Đơn hàng", isOrder: true }] : []),
                                ].map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => item.isOrder ? handleNavigate("orders") : handleMenuClick(item.path)}
                                        className="flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            {!isAuthenticated && (
                                <div className="px-4 pb-4 border-t pt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            router.push("/register")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="flex-1 py-3 px-4 rounded-lg text-sm font-medium bg-transparent text-[#38AAEC] border border-[#38AAEC] hover:bg-[#38AAEC] hover:text-white transition-all duration-200"
                                    >
                                        Đăng ký
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push("/login")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="flex-1 py-3 px-4 rounded-lg text-sm font-medium bg-[#38AAEC] text-white hover:bg-[#3BAEF0] hover:opacity-90 transition-all duration-200"
                                    >
                                        Đăng nhập
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main */}
            <div className="pt-16">{children}</div>

            {/* ✅ Footer động */}
            <footer className="relative bg-gradient-to-br from-[#070b12] via-[#0b1220] to-[#070b12] text-white mt-12">
                <div className="container mx-auto px-4 py-16">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-5 rounded-xl shadow-xl">
                                <Film className="h-12 w-12" />
                            </div>
                            <span className="text-3xl font-bold">{isLoading ? "Loading..." : theaterDetails?.name || "PHT Cinema"}</span>
                        </div>
                        <div className="flex gap-3">
                            {[Facebook, Instagram, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="bg-gray-800 p-3 rounded-xl hover:bg-red-600 transition-all duration-300 hover:scale-110">
                                    <Icon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Contact + Map */}
                    <div className="border-t border-white/10 pt-8">
                        {isLoading ? (
                            <p className="animate-pulse text-center text-lg">Đang tải thông tin chi tiết rạp...</p>
                        ) : error ? (
                            <p className="text-red-400 text-center text-lg">{error}</p>
                        ) : (
                            theaterDetails && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <ContactCard Icon={MapPin} title="Địa chỉ" content={theaterDetails.address} />
                                        <ContactCard Icon={Phone} title="Hotline" content={theaterDetails.hotline} />
                                        <ContactCard
                                            Icon={Clock}
                                            title="Giờ hoạt động"
                                            content={`${theaterDetails.openTime.substring(0, 5)} - ${theaterDetails.closeTime.substring(0, 5)}`}
                                            subContent={theaterDetails.overnight ? "Mở cửa thâu đêm" : "Đóng cửa đúng giờ"}
                                        />
                                        <ContactCard Icon={Mail} title="Email" content={theaterDetails.contactEmail} />
                                    </div>
                                    {theaterDetails.googleMapUrl && (
                                        <div className="relative h-64 rounded-xl overflow-hidden shadow-lg border">
                                            <iframe
                                                src={getGoogleMapEmbedUrl(theaterDetails.googleMapUrl)}
                                                width="100%"
                                                height="100%"
                                                allowFullScreen
                                                loading="lazy"
                                                title="Theater Map"
                                            />
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}
