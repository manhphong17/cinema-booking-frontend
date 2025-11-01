"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { AccountManagement } from "@/components/admin/account-management"
import { CinemaInformation } from "@/components/admin/cinema-information"
import { Dashboard } from "@/components/admin/dashboard"
import { ProfileManagement } from "@/components/admin/profile"


export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Handle OAuth callback - get access token from URL
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Store access token in localStorage
      localStorage.setItem('accessToken', token)
      // Decode token to get role information
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.authorities && Array.isArray(payload.authorities)) {
          localStorage.setItem('roleName', JSON.stringify(payload.authorities))
        }
      } catch (error) {
        console.error('Error decoding token:', error)
      }
      // Remove token from URL for security
      router.replace('/admin', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    setMounted(true)

    const token = localStorage.getItem("accessToken")
    const roleName = localStorage.getItem("roleName")

    if (!token || !roleName) {
      router.push("/login/admin")
      return
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000
      if (payload.exp < currentTime) {
        router.push("/login/admin")
        return
      }
    } catch {
      router.push("/login/admin")
      return
    }

    const roles = JSON.parse(roleName)
    if (!roles.includes("ADMIN")) {
      router.push("/login/admin")
      return
    }

    setIsAuthenticated(true)
  }, [router])

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "accounts":
        return <AccountManagement />
      case "cinema-info":
        return <CinemaInformation />
      case "profile":
        return <ProfileManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  )
}