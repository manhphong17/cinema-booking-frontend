"use client"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { logout } from "@/src/api/interceptor"
import {
  Film,
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
} from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
    const router = useRouter()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Quản lý tài khoản", icon: Users },
    { id: "cinema-info", label: "Cấu hình thông tin rạp", icon: Settings },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">System</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  )
}
