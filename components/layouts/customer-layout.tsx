"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, ShoppingBag, Gift, LogOut, Menu, X } from "lucide-react"

interface CustomerLayoutProps {
  children: React.ReactNode
  activeSection: string
  onSectionChange: (section: string) => void
}

export function CustomerLayout({ children, activeSection, onSectionChange }: CustomerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const storedName = useMemo(() => {
    if (typeof window === "undefined") {
      return ""
    }
    return localStorage.getItem("userName") || localStorage.getItem("customerName") || ""
  }, [])

  const displayName = storedName || "Khách hàng"
  const initials = useMemo(() => {
    if (!displayName.trim()) {
      return "KH"
    }
    const parts = displayName.trim().split(" ")
    const first = parts[0]?.[0]?.toUpperCase() ?? "K"
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() : "H"
    return `${first}${last}`
  }, [displayName])

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "vouchers", label: "My Vouchers", icon: Gift },
  ]

  const handleLogout = () => {
    localStorage.removeItem("customerSession")
    alert("Logged out successfully!")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Cinema Portal</h1>
            <p className="text-sm text-gray-600">Customer Dashboard</p>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/customer-avatar.jpg" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{displayName}</p>
                <Badge variant="secondary" className="text-xs">
                  Gold Member
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <Button
                      id={`menu-${item.id}`}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        onSectionChange(item.id)
                        setSidebarOpen(false)
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              id="menu-logout"
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
