"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {ProfileManagement} from "@/components/operator/profile-management";
import {ShowtimeManagement} from "@/components/operator/showtime-management";

export default function ShowTimesPage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <AdminLayout activeSection="showtimes" onSectionChange={handleSectionChange}>
            <ShowtimeManagement/>
        </AdminLayout>
    )
}