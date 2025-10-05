"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {MovieManagement} from "@/components/operator/movie-management";

export default function DashboardPage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <AdminLayout activeSection="dashboard" onSectionChange={handleSectionChange}>
            <MovieManagement/>
        </AdminLayout>
    )
}