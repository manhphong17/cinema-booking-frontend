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
        
        // Check authentication
        const auth = localStorage.getItem("auth")
        if (auth) {
            const authData = JSON.parse(auth)
            if (authData.isAuthenticated && authData.user.role === "admin") {
                // User is authenticated, stay on page
                return
            }
        }
        
        // Redirect to login if not authenticated
        router.push("/login/admin")
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
