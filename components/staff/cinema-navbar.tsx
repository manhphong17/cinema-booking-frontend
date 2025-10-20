"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, ShoppingCart, Ticket, TrendingUp } from "lucide-react"

interface CinemaNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function CinemaNavbar({ activeTab, onTabChange }: CinemaNavbarProps) {
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
          <div className="text-sm text-muted-foreground font-medium">Management System</div>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="tabs-list grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Chọn vé
            </TabsTrigger>
            <TabsTrigger value="concessions" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Chọn bắp nước
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
