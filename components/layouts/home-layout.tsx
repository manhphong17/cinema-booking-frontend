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

interface HomeLayoutProps {
  children: ReactNode
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const auth = localStorage.getItem("auth")
    if (auth) {
      const authData = JSON.parse(auth)
      setIsAuthenticated(authData.isAuthenticated)
      setUserRole(authData.user?.role)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth")
    localStorage.removeItem("accessToken")
    setIsAuthenticated(false)
    setUserRole(null)
    router.push("/")
  }

  const handleNavigate = (section: string) => {
    if (userRole === "customer") {
      router.push(`/customer?section=${section}`)
    }
    setMobileMenuOpen(false)
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
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <Film className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-foreground">Cinema</span>
              </div>
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
        <div className="pt-16">
          {children}
        </div>
        <div className="bg-sidebar text-sidebar-foreground">
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-sidebar-accent/30 rounded w-1/4"></div>
              <div className="h-4 bg-sidebar-accent/20 rounded w-1/2"></div>
              <div className="h-4 bg-sidebar-accent/20 rounded w-3/4"></div>
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
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 rounded-xl shadow-lg group-hover:shadow-primary/25 transition-all duration-300 group-hover:rotate-3">
                  <Film className="h-6 w-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors duration-300">
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Cinema
                  </span>
                </span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                  Premium Experience
                </span>
              </div>
            </div>

            {/* Desktop Menu Items */}
            <div className="home-menu-items hidden md:flex items-center gap-8">
              <button 
                onClick={() => handleMenuClick("/")} 
                className="relative text-foreground hover:text-primary transition-colors font-medium text-base py-2 px-1 group"
              >
                <span className="relative z-10">Trang chủ</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </button>
              <button 
                onClick={() => handleMenuClick("/movies/now-showing")} 
                className="relative text-foreground hover:text-primary transition-colors font-medium text-base py-2 px-1 group"
              >
                <span className="relative z-10">Phim đang chiếu</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </button>
              <button 
                onClick={() => handleMenuClick("/movies/coming-soon")} 
                className="relative text-foreground hover:text-primary transition-colors font-medium text-base py-2 px-1 group"
              >
                <span className="relative z-10">Phim sắp chiếu</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </button>
              <button 
                onClick={() => handleMenuClick("/vouchers")} 
                className="relative text-foreground hover:text-primary transition-colors font-medium text-base py-2 px-1 group"
              >
                <span className="relative z-10">Voucher</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </button>
              <button 
                onClick={() => handleMenuClick("/news")} 
                className="relative text-foreground hover:text-primary transition-colors font-medium text-base py-2 px-1 group"
              >
                <span className="relative z-10">Tin tức</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </button>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/register")}
                    className="border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105"
                  >
                    Đăng ký
                  </Button>
                  <Button 
                    onClick={() => router.push("/login")}
                    className="home-auth-button"
                  >
                    Đăng nhập
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full home-hover-lift">
                      <Avatar className="home-avatar">
                        <AvatarImage src={userRole === "admin" ? "/admin-avatar.png" : "/customer-avatar.jpg"} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {userRole === "admin" ? "AD" : "KH"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === "customer" && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigate("profile")}>
                          <User className="mr-2 h-4 w-4" />
                          Hồ sơ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate("orders")}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Đơn hàng của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate("vouchers")}>
                          <Gift className="mr-2 h-4 w-4" />
                          Voucher của tôi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {userRole === "admin" && (
                      <>
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <User className="mr-2 h-4 w-4" />
                          Trang quản trị
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/register")}
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary hover:text-white text-xs px-3"
                  >
                    Đăng ký
                  </Button>
                  <Button 
                    onClick={() => router.push("/login")}
                    size="sm"
                    className="home-auth-button text-xs px-3"
                  >
                    Đăng nhập
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userRole === "admin" ? "/admin-avatar.png" : "/customer-avatar.jpg"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                          {userRole === "admin" ? "AD" : "KH"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === "customer" && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigate("profile")}>
                          <User className="mr-2 h-4 w-4" />
                          Hồ sơ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate("orders")}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Đơn hàng của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate("vouchers")}>
                          <Gift className="mr-2 h-4 w-4" />
                          Voucher của tôi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {userRole === "admin" && (
                      <>
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <User className="mr-2 h-4 w-4" />
                          Trang quản trị
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-8 w-8 p-0"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-sm">
              <div className="px-4 py-4 space-y-1">
                <button 
                  onClick={() => handleMenuClick("/")} 
                  className="relative block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <span className="relative z-10 font-medium">Trang chủ</span>
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-r-full"></div>
                </button>
                <button 
                  onClick={() => handleMenuClick("/movies/now-showing")} 
                  className="relative block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <span className="relative z-10 font-medium">Phim đang chiếu</span>
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-r-full"></div>
                </button>
                <button 
                  onClick={() => handleMenuClick("/movies/coming-soon")} 
                  className="relative block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <span className="relative z-10 font-medium">Phim sắp chiếu</span>
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-r-full"></div>
                </button>
                <button 
                  onClick={() => handleMenuClick("/vouchers")} 
                  className="relative block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <span className="relative z-10 font-medium">Voucher</span>
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-r-full"></div>
                </button>
                <button 
                  onClick={() => handleMenuClick("/news")} 
                  className="relative block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                >
                  <span className="relative z-10 font-medium">Tin tức</span>
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 rounded-r-full"></div>
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
      <footer className="home-footer">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-sidebar-accent text-sidebar-accent-foreground p-2 rounded-lg">
                  <Film className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold">Cinema</span>
              </div>
              <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
                Hệ thống rạp chiếu phim hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh đẳng cấp quốc tế.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <div className="home-footer-section">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href="mailto:contact@cinema.vn" className="home-footer-link">
                    contact@cinema.vn
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href="tel:1900xxxx" className="home-footer-link">
                    Hotline: 1900 xxxx
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <a href="#now-showing" className="home-footer-link">
                    Phim đang chiếu
                  </a>
                </li>
                <li>
                  <a href="#coming-soon" className="home-footer-link">
                    Phim sắp chiếu
                  </a>
                </li>
                <li>
                  <a href="#vouchers" className="home-footer-link">
                    Voucher
                  </a>
                </li>
                <li>
                  <a href="#news" className="home-footer-link">
                    Tin tức
                  </a>
                </li>
              </ul>
            </div>

            {/* Social & Ministry Logo */}
            <div>
              <h3 className="font-semibold mb-4">Kết nối với chúng tôi</h3>
              <div className="flex gap-3 mb-6">
                <a href="#" className="home-social-link">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="home-social-link">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="home-social-link">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
              <div className="home-ministry-logo">
                <img
                  src="/vietnam-ministry-of-industry-and-trade-logo.jpg"
                  alt="Bộ Công Thương"
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-sidebar-border pt-6">
            <p className="text-center text-sm text-sidebar-foreground/70">
              © {new Date().getFullYear()} Cinema. All rights reserved. Designed with ❤️ in Vietnam.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
