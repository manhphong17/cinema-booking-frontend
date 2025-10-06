"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {Dashboard} from "@/components/operator/dashboard";

export default function DashboardPage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <AdminLayout activeSection="dashboard" onSectionChange={handleSectionChange}>
            <Dashboard />
        </AdminLayout>
    )
}