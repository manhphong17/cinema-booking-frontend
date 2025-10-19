"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function BusinessManagerPage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        
        // Check authentication using new token system
        const token = localStorage.getItem("accessToken")
        const roleName = localStorage.getItem("roleName")
        
        console.log("Business Manager page - Token:", !!token)
        console.log("Business Manager page - Role:", roleName)
        
        if (!token) {
            console.log("Business Manager page - No token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000
            if (payload.exp < currentTime) {
                console.log("Business Manager page - Token expired, redirecting to login")
                router.push("/login/admin")
                return
            }
        } catch (error) {
            console.log("Business Manager page - Invalid token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if user has BUSINESS role
        if (roleName) {
            const roles = JSON.parse(roleName)
            if (!roles.includes("BUSINESS")) {
                console.log("Business Manager page - User doesn't have BUSINESS role, redirecting to login")
                router.push("/login/admin")
                return
            }
        } else {
            console.log("Business Manager page - No role found, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        console.log("Business Manager page - Authentication successful, redirecting to dashboard")
        // Redirect to dashboard
        router.push("/business-manager/dashboard")
    }, [router])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return null
}
