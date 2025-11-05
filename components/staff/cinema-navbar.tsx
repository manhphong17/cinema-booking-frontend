"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Film, ShoppingCart, Ticket, TrendingUp, LogOut, User, CreditCard } from "lucide-react"
import { jwtDecode } from "jwt-decode"
import { apiClient } from "@/src/api/interceptor"
import { logout } from "@/src/api/interceptor"

interface CinemaNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function CinemaNavbar({ activeTab, onTabChange }: CinemaNavbarProps) {
  const router = useRouter()
  const [staffName, setStaffName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (token) {
          const decoded: any = jwtDecode(token)
          // JWT only has email, userId, roles - not name
          // So we fetch from /users/me API
          try {
            const response = await apiClient.get('/users/me')
            if (response.data?.status === 200 && response.data?.data?.name) {
              setStaffName(response.data.data.name)
            } else {
              setStaffName(decoded.sub || "Staff") // Use email as fallback
            }
          } catch (apiError) {
            // If API fails, use email from token
            setStaffName(decoded.sub || "Staff")
          }
        }
      } catch (error) {
        console.error("Error fetching staff info:", error)
        setStaffName("Staff")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStaffInfo()
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="cinema-navbar border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="logo-container flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="logo-icon bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                <Film className="h-6 w-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground group-hover:text-blue-600 transition-colors duration-300">
                <span className="logo-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Cinema
                </span>
              </span>
              <span className="text-xs text-muted-foreground font-medium -mt-1">
                Staff Portal
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{staffName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="tabs-list grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Chọn vé
            </TabsTrigger>
            <TabsTrigger value="concessions" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Chọn bắp nước
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="eticket" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              E-ticket
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Doanh thu
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
