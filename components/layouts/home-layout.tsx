"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Film,
    User,
    ShoppingBag,
    Gift,
    LogOut,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Youtube,
    Menu,
    X,
    Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
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

    // ✅ checkAuth dùng lại được trong listener
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

    // ✅ Quản lý Auth & User Info + storage listener + tokenSet
    useEffect(() => {
        setMounted(true)
        checkAuth()

        const loadUserData = () => {
            const storedAvatar = localStorage.getItem("userAvatar")
            const storedName =
                localStorage.getItem("userName") || localStorage.getItem("customerName")
            if (storedAvatar) setUserAvatar(storedAvatar)
            if (storedName) setUserName(storedName)
        }

        loadUserData()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "accessToken") {
                if (!e.newValue) {
                    setIsAuthenticated(false)
                    setDropdownOpen(false)
                } else {
                    checkAuth()
                }
            }

            // 🔹 Nếu có giá trị mới -> set avatar đó
            // 🔹 Nếu bị xóa (newValue === null) -> về avatar mặc định
            if (e.key === "userAvatar") {
                setUserAvatar(e.newValue || "/customer-avatar.jpg")
            }

            if ((e.key === "userName" || e.key === "customerName")) {
                if (e.newValue) {
                    setUserName(e.newValue)
                } else {
                    // Khi xoá tên user thì reset về mặc định
                    setUserName("KH")
                }
            }
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

        // 🔹 Reset avatar + name trên UI
        setUserAvatar("/customer-avatar.jpg")
        setUserName("KH")

        // 🔹 Xoá trong localStorage để tránh “dính” user trước
        if (typeof window !== "undefined") {
            localStorage.removeItem("userAvatar")
            localStorage.removeItem("userName")
            localStorage.removeItem("customerName")
        }

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

    // Skeleton tránh hydration mismatch (giữ idea của bản đầu)
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo skeleton */}
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                    <Film className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold text-foreground">
                                    Cinema
                                </span>
                            </div>
                            {/* Menu skeleton */}
                            <div className="hidden md:flex items-center gap-2">
                                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded-lg" />
                                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded-lg" />
                                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded-lg" />
                                <div className="animate-pulse bg-gray-200 h-9 w-18 rounded-lg" />
                            </div>
                            {/* Auth skeleton */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded-lg" />
                                <div className="animate-pulse bg-gray-200 h-9 w-24 rounded-lg" />
                            </div>
                            {/* Mobile skeleton */}
                            <div className="md:hidden">
                                <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-16">{children}</div>
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                    <div className="container mx-auto px-4 py-16">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-700 rounded w-1/4" />
                            <div className="h-4 bg-slate-700 rounded w-1/2" />
                            <div className="h-4 bg-slate-700 rounded w-3/4" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="home-layout">
            {/* NAVBAR (merge logic + UI) */}
            <nav className="home-navbar fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-all duration-300"
                            onClick={() => router.push("/")}
                        >
                            <div className="relative">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                    <Film className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    PHT Cinema
                                </span>
                                <span className="text-xs text-muted-foreground font-medium -mt-1">
                                    Premium Experience
                                </span>
                            </div>
                        </div>

                        {/* Desktop Menu – union các menu của bản 1 + bản 2 */}
                        <div className="hidden md:flex items-center gap-2">
                            {[
                                { path: "/home", label: "Trang chủ" },
                                { path: "/movies/now-showing", label: "Phim đang chiếu" },
                                { path: "/movies/coming-soon", label: "Phim sắp chiếu" },
                                { path: "/vouchers", label: "Voucher" },
                                { path: "/news", label: "Tin tức" },
                                ...(isAuthenticated
                                    ? [
                                        {
                                            path: "/customer?section=orders",
                                            label: "Đơn hàng",
                                            isOrder: true,
                                        } as const,
                                    ]
                                    : []),
                            ].map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() =>
                                        item.isOrder
                                            ? handleNavigate("orders")
                                            : handleMenuClick(item.path)
                                    }
                                    className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        {item.label}
                                    </span>
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full" />
                                </button>
                            ))}
                        </div>

                        {/* Desktop Auth – union logic 2 bên (thêm Voucher trong dropdown) */}
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
                                    <Button
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full"
                                        onClick={handleDropdownClick}
                                    >
                                        <Avatar>
                                            <AvatarImage src={userAvatar} alt="User avatar" />
                                            <AvatarFallback>
                                                {userName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-12 w-56 bg-white border rounded-md shadow-lg z-[60]">
                                            <div className="px-4 py-2 text-sm font-medium border-b">
                                                Tài khoản của tôi
                                            </div>
                                            <button
                                                onClick={() => handleNavigate("profile")}
                                                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full"
                                            >
                                                <User className="mr-2 h-4 w-4" /> Hồ sơ
                                            </button>
                                            <button
                                                onClick={() => handleNavigate("orders")}
                                                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full"
                                            >
                                                <ShoppingBag className="mr-2 h-4 w-4" /> Đơn hàng
                                                của tôi
                                            </button>
                                            <button
                                                onClick={() => handleNavigate("vouchers")}
                                                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full"
                                            >
                                                <Gift className="mr-2 h-4 w-4" /> Voucher của tôi
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Auth + Menu toggle (giữ phiên bản giàu tính năng của bản 1) */}
                        <div className="md:hidden flex items-center gap-2">
                            {!isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            router.push("/register")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="border-primary/30 text-primary hover:bg-primary hover:text-white text-xs px-3"
                                    >
                                        Đăng ký
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            router.push("/login")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="text-xs px-3 bg-[#38AAEC] text-white hover:bg-[#3BAEF0]"
                                    >
                                        Đăng nhập
                                    </Button>
                                </>
                            ) : (
                                <div className="relative" data-dropdown>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={handleDropdownClick}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={userAvatar} alt="User avatar" />
                                            <AvatarFallback className="text-xs font-bold">
                                                {userName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-10 w-48 bg-white border rounded-md shadow-lg z-[60]">
                                            <div className="px-4 py-2 text-sm font-medium border-b">
                                                Tài khoản của tôi
                                            </div>
                                            <button
                                                onClick={() => handleNavigate("profile")}
                                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                <User className="mr-2 h-4 w-4" /> Hồ sơ
                                            </button>
                                            <button
                                                onClick={() => handleNavigate("orders")}
                                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                <ShoppingBag className="mr-2 h-4 w-4" /> Đơn hàng
                                                của tôi
                                            </button>
                                            <button
                                                onClick={() => handleNavigate("vouchers")}
                                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                <Gift className="mr-2 h-4 w-4" /> Voucher của tôi
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 transition-all duration-300"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-5 w-5 text-primary" />
                                ) : (
                                    <Menu className="h-5 w-5 text-gray-600" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu – union menu items (có Voucher + News + Orders) */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-border bg-white animate-in slide-in-from-top-2 duration-300">
                            <div className="px-4 py-6 grid grid-cols-2 gap-3">
                                {[
                                    { path: "/home", label: "Trang chủ" },
                                    { path: "/movies/now-showing", label: "Phim đang chiếu" },
                                    { path: "/movies/coming-soon", label: "Phim sắp chiếu" },
                                    { path: "/vouchers", label: "Voucher" },
                                    { path: "/news", label: "Tin tức" },
                                    ...(isAuthenticated
                                        ? [
                                            {
                                                path: "/customer?section=orders",
                                                label: "Đơn hàng",
                                                isOrder: true,
                                            } as const,
                                        ]
                                        : []),
                                ].map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() =>
                                            item.isOrder
                                                ? handleNavigate("orders")
                                                : handleMenuClick(item.path)
                                        }
                                        className="flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        <span className="font-medium text-sm">
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div className="pt-16">{children}</div>

            {/* FOOTER: layout “Liên hệ và Thông tin Chi tiết” + map động */}
            <footer className="relative home-footer bg-gradient-to-br from-[#070b12] via-[#0b1220] to-[#070b12] text-white mt-12">
                {/* glow */}
                <div
                    className="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full
              bg-gradient-to-br from-pink-500/25 via-purple-500/20 to-blue-500/15 blur-3xl"
                />

                <div className="container mx-auto px-4 py-16">
                    {/* Top row: Logo & Social */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        {/* Logo + Name */}
                        <div className="flex items-center gap-4">
                            <div
                                className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600
                    text-white p-5 rounded-xl shadow-xl ring-1 ring-white/15"
                            >
                                <Film className="h-12 w-12" />
                            </div>

                            <span className="text-3xl font-bold">
                                {isLoading
                                    ? "Loading..."
                                    : theaterDetails?.name || "PHT Cinema"}
                            </span>
                        </div>

                        {/* Social icons */}
                        <div className="flex gap-3">
                            {[Facebook, Instagram, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="bg-gray-800 p-3 rounded-xl hover:bg-red-600 transition-all duration-300 hover:scale-110"
                                >
                                    <Icon className="h-5 w-5 text-gray-300" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* KHỐI: Liên hệ & Thông tin chi tiết */}
                    <div className="mb-12 border-t border-white/10 pt-8 text-slate-300">
                        <h3
                            className="text-3xl font-extrabold mb-6
        bg-clip-text text-transparent
        bg-gradient-to-r from-pink-500 to-blue-400"
                        >
                            Liên hệ và Thông tin Chi tiết
                        </h3>

                        {isLoading && (
                            <p className="animate-pulse text-center text-lg">
                                Đang tải thông tin chi tiết rạp...
                            </p>
                        )}
                        {error && (
                            <p className="text-red-400 text-center text-lg">
                                ❌ {error}
                            </p>
                        )}

                        {theaterDetails && !isLoading && !error && (
                            <div className="flex flex-col gap-6">
                                {/* Hàng 1: 4 cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ContactCard
                                        Icon={MapPin}
                                        title="Địa chỉ"
                                        content={theaterDetails.address}
                                    />
                                    <ContactCard
                                        Icon={Phone}
                                        title="Hotline"
                                        content={theaterDetails.hotline}
                                    />
                                    <ContactCard
                                        Icon={Clock}
                                        title="Giờ hoạt động"
                                        content={`${theaterDetails.openTime.substring(
                                            0,
                                            5
                                        )} - ${theaterDetails.closeTime.substring(0, 5)}`}
                                        subContent={
                                            theaterDetails.overnight
                                                ? "Mở cửa thâu đêm"
                                                : "Đóng cửa đúng giờ"
                                        }
                                    />
                                    <ContactCard
                                        Icon={Mail}
                                        title="Email"
                                        content={theaterDetails.contactEmail}
                                    />
                                </div>

                                {/* Hàng 2: Google Map */}
                                {theaterDetails.googleMapUrl && (
                                    <div className="relative h-48 md:h-64 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                                        <iframe
                                            src={getGoogleMapEmbedUrl(
                                                theaterDetails.googleMapUrl
                                            )}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title="Theater Location"
                                            className="rounded-xl"
                                        />
                                        <div className="absolute bottom-2 right-2">
                                            <a
                                                href={theaterDetails.googleMapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs bg-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                Xem bản đồ
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom row */}
                    <div className="border-t border-white/10 pt-8 text-sm text-slate-400 flex flex-col md:flex-row justify-between gap-4">
                        <span>
                            © {new Date().getFullYear()} Cinema. All rights reserved.
                        </span>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white">
                                Điều khoản sử dụng
                            </a>
                            <a href="#" className="hover:text-white">
                                Chính sách bảo mật
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
