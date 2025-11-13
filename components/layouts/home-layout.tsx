"use client"
import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Film, User, ShoppingBag, Gift, LogOut, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Menu, X, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { jwtDecode } from "jwt-decode";
import {apiClient, logout} from "@/src/api/interceptor"
import {fetchTheaterDetails, TheaterDetails} from "@/app/api/theater/theater";
import ContactCard from '@/components/home/contactCard';


interface HomeLayoutProps {
    children: ReactNode
}
type ResponseData<T> = {
    status: number;
    message: string;
    data: T;
};

const getGoogleMapEmbedUrl = (url: string) => {
    if (!url) return ""
    if (url.includes("embed")) return url
    const match = url.match(/[?&]q=([^&]+)/)
    if (match) {
        return `https://maps.google.com/maps?q=${match[1]}&output=embed`
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
}
export function HomeLayout({ children }: HomeLayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [userAvatar, setUserAvatar] = useState<string>("/customer-avatar.jpg")
    const [userName, setUserName] = useState<string>("KH")
    const router = useRouter()
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [theaterDetails, setTheaterDetails] = useState<TheaterDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Luồng gọi API
    useEffect(() => {
        const loadDetails = async () => {
            try {
                const data = await fetchTheaterDetails(); // Gọi hàm API
                setTheaterDetails(data);
            } catch (err) {
                console.error("Lỗi khi tải chi tiết rạp:", err);
                setError("Không thể tải thông tin rạp phim.");
            } finally {
                setIsLoading(false);
            }
        };

        loadDetails();
    }, []); // Chỉ chạy một lần khi component mount


    useEffect(() => {
        setMounted(true)

        const checkAuth = () => {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                setIsAuthenticated(false);
                console.log("Không có token, chưa đăng nhập");
                return;
            }

            try {
                const decoded = jwtDecode(accessToken);
                const currentTime = Math.floor(Date.now() / 1000);

                if (typeof decoded.exp === "number" && decoded.exp < currentTime) {
                    setIsAuthenticated(false);
                    console.log("Token đã hết hạn");
                    // Clear expired token
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("auth");
                } else {
                    setIsAuthenticated(true);
                    console.log("Đã đăng nhập:", decoded);
                }
            } catch (error) {
                console.error("Token không hợp lệ:", error);
                setIsAuthenticated(false);
                // Clear invalid token
                localStorage.removeItem("accessToken");
                localStorage.removeItem("auth");
            }
        }

        checkAuth()

        // Load user avatar and name from localStorage
        const loadUserData = () => {
            const storedAvatar = localStorage.getItem("userAvatar")
            const storedName = localStorage.getItem("userName") || localStorage.getItem("customerName")

            if (storedAvatar) {
                setUserAvatar(storedAvatar)
            }

            if (storedName) {
                setUserName(storedName)
            }
        }

        loadUserData()

        type TheaterDetails = {
            id: number;
            name: string;
            address: string;
            hotline: string;
            contactEmail: string;
            googleMapUrl: string;
            openTime: string;
            closeTime: string;
            overnight: boolean;
            bannerUrl: string;
            information: string;
            representativeName: string;
            representativeTitle: string;
            representativePhone: string;
            representativeEmail: string;
            createdBy: string;
            updatedBy: string;
        };


        // Listen for storage changes (for logout from other tabs and avatar updates)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'accessToken' && !e.newValue) {
                setIsAuthenticated(false)
                setDropdownOpen(false)
            }
            if (e.key === 'userAvatar' && e.newValue) {
                setUserAvatar(e.newValue)
            }
            if ((e.key === 'userName' || e.key === 'customerName') && e.newValue) {
                setUserName(e.newValue)
            }
        }

        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownOpen) {
                const target = event.target as Element
                if (!target.closest('[data-dropdown]')) {
                    setDropdownOpen(false)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownOpen])

    const handleLogout = () => {
        setIsAuthenticated(false)
        setDropdownOpen(false)
        logout()
    }

    const handleDropdownOpenChange = (open: boolean) => {
        console.log("Dropdown menu open state:", open)
        setDropdownOpen(open)
    }

    // Debug log for authentication state
    useEffect(() => {
        console.log("Authentication state changed:", isAuthenticated)
    }, [isAuthenticated])

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("Dropdown trigger clicked")
        setDropdownOpen(!dropdownOpen)
    }

    const handleDropdownItemClick = (action: () => void) => {
        action()
        setDropdownOpen(false)
    }

    const handleNavigate = (section: string) => {
        router.push(`/customer?section=${section}`)
        setMobileMenuOpen(false)
        setDropdownOpen(false)
    }

    const handleMenuClick = (href: string) => {
        if (href.startsWith('#')) {
            const element = document.querySelector(href)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        } else {
            router.push(href)
        }
        setMobileMenuOpen(false)
    }

    type ApiResponse<T> = { status: number; message: string; data: T };

    function useTheaterDetails() {
        const [theater, setTheater] = useState<TheaterDetails | null>(null);
        const [loading, setLoading] = useState(true);
        const [err, setErr] = useState<string | null>(null);

        useEffect(() => {
            let cancel = false;
            (async () => {
                try {
                    setLoading(true);
                    const res = await apiClient.get<ApiResponse<TheaterDetails>>("/api/theater_details");
                    if (!cancel) {
                        if (res.data?.status === 200 && res.data?.data) {
                            setTheater(res.data.data);
                        } else {
                            setErr(res.data?.message || "Không lấy được dữ liệu rạp.");
                        }
                    }
                } catch (e: any) {
                    if (!cancel) {
                        setErr(e?.response?.data?.message || "Lỗi khi gọi /api/theater_details");
                    }
                } finally {
                    if (!cancel) setLoading(false);
                }
            })();
            return () => { cancel = true; };
        }, []);

        return { theater, loading, err };
    }


    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                    <Film className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold text-foreground">Cinema</span>
                            </div>

                            {/* Navigation Menu Skeleton */}
                            <div className="hidden md:flex items-center gap-2">
                                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded-lg"></div>
                                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded-lg"></div>
                                <div className="animate-pulse bg-gray-200 h-9 w-18 rounded-lg"></div>
                                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded-lg"></div>
                                <div className="animate-pulse bg-gray-200 h-9 w-14 rounded-lg"></div>
                            </div>

                            {/* Auth Section Skeleton */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded-lg"></div>
                                <div className="animate-pulse bg-gray-200 h-9 w-24 rounded-lg"></div>
                            </div>

                            {/* Mobile Menu Button Skeleton */}
                            <div className="md:hidden">
                                <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-16">
                    {children}
                </div>
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                    <div className="container mx-auto px-4 py-16">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="home-layout">
            {/* Navbar */}
            <nav className="home-navbar">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-all duration-300"
                            onClick={() => router.push("/")}
                        >
                            <div className="relative">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:rotate-3">
                                    <Film className="h-6 w-6" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-foreground group-hover:text-blue-600 transition-colors duration-300">
                                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        Cinema
                                    </span>
                                </span>
                                <span className="text-xs text-muted-foreground font-medium -mt-1">
                                    Premium Experience
                                </span>
                            </div>
                        </div>

                        {/* Desktop Menu Items */}
                        <div className="home-menu-items hidden md:flex items-center gap-2">
                            <button
                                onClick={() => handleMenuClick("/home")}
                                className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    Trang chủ
                                </span>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
                            </button>
                            <button
                                onClick={() => handleMenuClick("/movies/now-showing")}
                                className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    Phim đang chiếu
                                </span>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
                            </button>
                            <button
                                onClick={() => handleMenuClick("/movies/coming-soon")}
                                className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    Phim sắp chiếu
                                </span>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
                            </button>
                            <button
                                onClick={() => handleMenuClick("/vouchers")}
                                className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    Voucher
                                </span>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
                            </button>
                            <button
                                onClick={() => handleMenuClick("/news")}
                                className="relative text-foreground hover:text-blue-600 transition-all duration-300 font-medium text-base py-3 px-4 rounded-lg group hover:bg-blue-50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    Tin tức
                                </span>
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
                            </button>
                        </div>

                        {/* Desktop Auth Section */}
                        <div className="hidden md:flex items-center gap-3">
                            {!mounted ? (
                                // Loading state để tránh hydration mismatch
                                <>
                                    <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
                                </>
                            ) : !isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            router.push("/register")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="border-blue-500/30 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all duration-300 hover:scale-105"
                                    >
                                        Đăng ký
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            router.push("/login")
                                            setMobileMenuOpen(false)
                                        }}
                                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105"
                                    >
                                        Đăng nhập
                                    </Button>
                                </>
                            ) : (
                                <div className="relative" data-dropdown>
                                    <Button
                                        variant="ghost"
                                        className="relative h-10 w-10 rounded-full home-hover-lift"
                                        aria-label="User menu"
                                        onClick={handleDropdownClick}
                                    >
                                        <Avatar className="home-avatar">
                                            <AvatarImage src={userAvatar} alt="User avatar" />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                                {userName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-[60]">
                                            <div className="py-1">
                                                <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                                                    Tài khoản của tôi
                                                </div>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("profile"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    Hồ sơ
                                                </button>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("orders"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                                    Đơn hàng của tôi
                                                </button>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("vouchers"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Gift className="mr-2 h-4 w-4" />
                                                    Voucher của tôi
                                                </button>
                                                <div className="border-t border-gray-100"></div>
                                                <button
                                                    onClick={() => handleDropdownItemClick(handleLogout)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            {!isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            router.push("/register")
                                            setMobileMenuOpen(false)
                                        }}
                                        size="sm"
                                        className="border-primary/30 text-primary hover:bg-primary hover:text-white text-xs px-3"
                                    >
                                        Đăng ký
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            router.push("/login")
                                            setMobileMenuOpen(false)
                                        }}
                                        size="sm"
                                        className="home-auth-button text-xs px-3"
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
                                        aria-label="User menu"
                                        onClick={handleDropdownClick}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={userAvatar} alt="User avatar" />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                                {userName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[60]">
                                            <div className="py-1">
                                                <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                                                    Tài khoản của tôi
                                                </div>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("profile"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    Hồ sơ
                                                </button>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("orders"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                                    Đơn hàng của tôi
                                                </button>
                                                <button
                                                    onClick={() => handleDropdownItemClick(() => handleNavigate("vouchers"))}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Gift className="mr-2 h-4 w-4" />
                                                    Voucher của tôi
                                                </button>
                                                <div className="border-t border-gray-100"></div>
                                                <button
                                                    onClick={() => handleDropdownItemClick(handleLogout)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
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
                                <div className="relative">
                                    {mobileMenuOpen ? (
                                        <X className="h-5 w-5 text-primary" />
                                    ) : (
                                        <Menu className="h-5 w-5 text-gray-600" />
                                    )}
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="px-4 py-6 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleMenuClick("/home")}
                                        className="relative flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300 group border border-transparent hover:border-primary/20"
                                    >
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        </div>
                                        <span className="font-medium text-sm">Trang chủ</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuClick("/movies/now-showing")}
                                        className="relative flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300 group border border-transparent hover:border-primary/20"
                                    >
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        </div>
                                        <span className="font-medium text-sm">Đang chiếu</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuClick("/movies/coming-soon")}
                                        className="relative flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300 group border border-transparent hover:border-primary/20"
                                    >
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        </div>
                                        <span className="font-medium text-sm">Sắp chiếu</span>
                                    </button>
                                    <button
                                        onClick={() => handleMenuClick("/vouchers")}
                                        className="relative flex flex-col items-center py-4 px-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300 group border border-transparent hover:border-primary/20"
                                    >
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        </div>
                                        <span className="font-medium text-sm">Voucher</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleMenuClick("/news")}
                                    className="relative w-full flex items-center justify-center py-3 px-4 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300 group border border-transparent hover:border-primary/20"
                                >
                                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors duration-300">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    </div>
                                    <span className="font-medium">Tin tức</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-16">
                {children}
            </div>

            {/* Footer */}
            <footer className="relative home-footer bg-gradient-to-br from-[#070b12] via-[#0b1220] to-[#070b12] text-white">
                {/* glow */}
                <div className="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full
              bg-gradient-to-br from-pink-500/25 via-purple-500/20 to-blue-500/15 blur-3xl" />

                <div className="container mx-auto px-4 py-16">
                    {/* Top row (Logo & Social) - GIỮ NGUYÊN */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600
                    text-white p-5 rounded-xl shadow-xl ring-1 ring-white/15">
                                <Film className="h-12 w-12" />
                            </div>
                            <div>
                                {/* In Tên Rạp (name) */}
                                <span className="text-4xl font-bold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
                                {isLoading ? 'Loading...' : (theaterDetails?.name || 'Cinema')}
                            </span>

                            </div>
                        </div>

                        {/* Social */}
                        <div className="flex gap-3">
                            {/* Giữ nguyên Social Icons */}
                            {/* ... */}
                        </div>
                    </div>

                    {/* KHỐI MỚI: Dữ liệu Chi tiết Rạp Phim (Theater Details) - 4 Card + 1 Map */}
                    <div className="mb-12 border-t border-white/10 pt-8 text-slate-300">
                        <h3 className="text-3xl font-extrabold mb-6
        bg-clip-text text-transparent
        bg-gradient-to-r from-pink-500 to-blue-400">
                            Liên hệ và Thông tin Chi tiết
                        </h3>

                        {isLoading && <p className="animate-pulse text-center text-lg">Đang tải thông tin chi tiết rạp...</p>}
                        {error && <p className="text-red-400 text-center text-lg">❌ {error}</p>}

                        {theaterDetails && (
                            <div className="flex flex-col gap-6">
                                {/* Hàng 1: 4 Cards (dùng Grid 2 cột) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Card 1: Địa chỉ */}
                                    <ContactCard
                                        Icon={MapPin}
                                        title="Địa chỉ"
                                        content={theaterDetails.address}
                                    />

                                    {/* Card 2: Hotline */}
                                    <ContactCard
                                        Icon={Phone}
                                        title="Hotline"
                                        content={theaterDetails.hotline}
                                    />

                                    {/* Card 3: Giờ hoạt động */}
                                    <ContactCard
                                        Icon={Clock}
                                        title="Giờ hoạt động"
                                        content={`${theaterDetails.openTime.substring(0, 5)} - ${theaterDetails.closeTime.substring(0, 5)}`}
                                        subContent={theaterDetails.overnight ? 'Mở cửa thâu đêm' : 'Đóng cửa đúng giờ'}
                                    />

                                    {/* Card 4: Email */}
                                    <ContactCard
                                        Icon={Mail}
                                        title="Email"
                                        content={theaterDetails.contactEmail}
                                    />
                                </div>

                                {/* Hàng 2 (Card lớn): Google Map (Chiếm toàn bộ chiều rộng) */}
                                {/* Sử dụng theaterDetails thay vì theaterData */}
                                {/* Google Map if available */}
                                {theaterDetails?.googleMapUrl && (
                                    <div className="relative h-48 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                        <iframe
                                            src={getGoogleMapEmbedUrl(theaterDetails.googleMapUrl)}
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

                    {/* Bottom row (Copyright) - GIỮ NGUYÊN */}
                    <div className="border-t border-white/10 pt-8">
                        {/* ... Giữ nguyên phần Copyright và Links ... */}
                    </div>
                </div>
            </footer>
        </div>

    )
}