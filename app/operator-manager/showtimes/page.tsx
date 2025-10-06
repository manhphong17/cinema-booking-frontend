"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {ProfileManagement} from "@/components/operator/profile-management";
import {ShowtimeManagement} from "@/components/operator/showtime-management";

export default function ShowTimesPage() {
    return (
        <AdminLayout activeSection="showtimes" onSectionChange={() => {}}>
            <ShowtimeManagement/>
        </AdminLayout>
    )
}