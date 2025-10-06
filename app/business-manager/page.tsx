"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BusinessManagerPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to dashboard
        router.push("/business-manager/dashboard")
    }, [router])

    return null
}
