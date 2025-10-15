"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {Dashboard} from "@/components/operator/dashboard"

export default function OperatorManagerPage() {
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
        
        // Check authentication using new token system
        const token = localStorage.getItem("accessToken")
        const roleName = localStorage.getItem("roleName")
        
        console.log("Operator page - Token:", !!token)
        console.log("Operator page - Role:", roleName)
        
        if (!token) {
            console.log("Operator page - No token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000
            if (payload.exp < currentTime) {
                console.log("Operator page - Token expired, redirecting to login")
                router.push("/login/admin")
                return
            }
        } catch (error) {
            console.log("Operator page - Invalid token, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        // Check if user has OPERATION role
        if (roleName) {
            const roles = JSON.parse(roleName)
            if (!roles.includes("OPERATION")) {
                console.log("Operator page - User doesn't have OPERATION role, redirecting to login")
                router.push("/login/admin")
                return
            }
        } else {
            console.log("Operator page - No role found, redirecting to login")
            router.push("/login/admin")
            return
        }
        
        console.log("Operator page - Authentication successful")
    }, [router])

    // Prevent hydration mismatch by not rendering until mounted
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

    return (
        <OperatorLayout>
            <Dashboard/>
        </OperatorLayout>
    )
}
