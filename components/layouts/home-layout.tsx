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
import { Film, User, ShoppingBag, Gift, LogOut, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {jwtDecode} from "jwt-decode";
import { logout } from "@/src/api/interceptor"

interface HomeLayoutProps {
  children: ReactNode
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

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

    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue) {
        setIsAuthenticated(false)
        setDropdownOpen(false)
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
                                            <AvatarImage src="/customer-avatar.jpg" />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                                KH
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
                                            <AvatarImage src="/customer-avatar.jpg" />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                                KH
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
            <footer className="home-footer bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Logo & Description */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                    <Film className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-white">Cinema</span>
                                    <p className="text-xs text-slate-400 -mt-1">Premium Experience</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                Hệ thống rạp chiếu phim hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh đẳng cấp quốc tế với công nghệ hiện đại và dịch vụ chuyên nghiệp.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                                <span>Đang hoạt động 24/7</span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                                Liên hệ
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 group">
                                    <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
                                        <MapPin className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 text-sm font-medium">Địa chỉ</p>
                                        <p className="text-gray-400 text-sm">123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
                                        <Mail className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 text-sm font-medium">Email</p>
                                        <a href="mailto:contact@cinema.vn" className="text-red-400 hover:text-red-300 text-sm transition-colors duration-300">
                                            contact@cinema.vn
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
                                        <Phone className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 text-sm font-medium">Hotline</p>
                                        <a href="tel:1900xxxx" className="text-red-400 hover:text-red-300 text-sm transition-colors duration-300">
                                            1900 xxxx
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                                Liên kết nhanh
                            </h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/movies/now-showing" className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="w-1 h-1 bg-gray-500 group-hover:bg-red-500 rounded-full transition-colors duration-300"></div>
                                        <span className="text-sm">Phim đang chiếu</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/movies/coming-soon" className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="w-1 h-1 bg-gray-500 group-hover:bg-red-500 rounded-full transition-colors duration-300"></div>
                                        <span className="text-sm">Phim sắp chiếu</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/vouchers" className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="w-1 h-1 bg-gray-500 group-hover:bg-red-500 rounded-full transition-colors duration-300"></div>
                                        <span className="text-sm">Voucher</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/news" className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="w-1 h-1 bg-gray-500 group-hover:bg-red-500 rounded-full transition-colors duration-300"></div>
                                        <span className="text-sm">Tin tức</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/home#about" className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="w-1 h-1 bg-gray-500 group-hover:bg-red-500 rounded-full transition-colors duration-300"></div>
                                        <span className="text-sm">Về chúng tôi</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Social & Ministry Logo */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                                Kết nối với chúng tôi
                            </h3>
                            <div className="flex gap-4 mb-8">
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group bg-gray-800 p-3 rounded-xl hover:bg-red-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25">
                                    <Facebook className="h-5 w-5 text-gray-300 group-hover:text-white" />
                                </a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="group bg-gray-800 p-3 rounded-xl hover:bg-red-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25">
                                    <Instagram className="h-5 w-5 text-gray-300 group-hover:text-white" />
                                </a>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="group bg-gray-800 p-3 rounded-xl hover:bg-red-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25">
                                    <Youtube className="h-5 w-5 text-gray-300 group-hover:text-white" />
                                </a>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                <img
                                    src="/vietnam-ministry-of-industry-and-trade-logo.jpg"
                                    alt="Bộ Công Thương"
                                    className="h-12 w-auto mx-auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="border-t border-gray-700 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-gray-300 text-sm">
                                    © {new Date().getFullYear()} Cinema. All rights reserved.
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Designed with ❤️ in Vietnam
                                </p>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-gray-400">
                                <Link href="/terms" className="hover:text-white transition-colors duration-300">Điều khoản sử dụng</Link>
                                <Link href="/privacy" className="hover:text-white transition-colors duration-300">Chính sách bảo mật</Link>
                                <Link href="/support" className="hover:text-white transition-colors duration-300">Hỗ trợ</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}