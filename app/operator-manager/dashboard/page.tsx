"use client"

import {useRouter} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {Dashboard} from "@/components/operator/dashboard";

export default function DashboardPage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <OperatorLayout>
            <Dashboard />
        </OperatorLayout>
    )
}