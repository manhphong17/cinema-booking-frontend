"use client"

import {useEffect} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {Dashboard} from "@/components/operator/dashboard";

export default function DashboardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Handle OAuth callback - get access token from URL
    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            // Store access token in localStorage
            localStorage.setItem('accessToken', token)
            // Decode token to get role information and email
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                // Check for both 'roles' (backend) and 'authorities' (legacy)
                const roles = payload.roles || payload.authorities
                if (roles && Array.isArray(roles)) {
                    localStorage.setItem('roleName', JSON.stringify(roles))
                }
                // Extract email from 'sub' field (subject) and store it
                if (payload.sub) {
                    localStorage.setItem('email', payload.sub)
                    localStorage.setItem('userEmail', payload.sub)
                }
                // Store userId if available
                if (payload.userId) {
                    localStorage.setItem('userId', String(payload.userId))
                }
            } catch (error) {
                console.error('Error decoding token:', error)
            }
            // Remove token from URL for security
            router.replace('/operator-manager/dashboard', { scroll: false })
        }
    }, [searchParams, router])

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }
    return (
        <OperatorLayout>
            <Dashboard />
        </OperatorLayout>
    )
}