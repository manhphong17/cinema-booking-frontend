"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {MovieManagement} from "@/components/operator/movie-management";
import {NewsManagement} from "@/components/operator/news-management";

export default function NewsPage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <AdminLayout activeSection="news" onSectionChange={handleSectionChange}>
            <NewsManagement/>
        </AdminLayout>
    )
}