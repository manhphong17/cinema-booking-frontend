"use client"

import {useState, useEffect} from "react"
import {useRouter} from "next/navigation"

export default function AdminPage() {
    const [activeSection, setActiveSection] = useState("dashboard")
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check authentication using new token system
        const token = localStorage.getItem("accessToken")
        const roleName = localStorage.getItem("roleName")
        
        console.log("Admin page - Token:", !!token)
        console.log("Admin page - Role:", roleName)
        
        if (!token) {
            console.log("Admin page - No token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000
            if (payload.exp < currentTime) {
                console.log("Admin page - Token expired, redirecting to login")
                router.push("/login/admin")
                return
            }
        } catch (error) {
            console.log("Admin page - Invalid token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if user has ADMIN role
        if (roleName) {
            const roles = JSON.parse(roleName)
            if (!roles.includes("ADMIN")) {
                console.log("Admin page - User doesn't have ADMIN role, redirecting to login")
                router.push("/login/admin")
                return
            }
        } else {
            console.log("Admin page - No role found, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        console.log("Admin page - Authentication successful")
        setIsAuthenticated(true)
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold p-4">Admin Dashboard</h1>
            <p className="p-4">Welcome to admin panel!</p>
        </div>
    )
}
