"use client"

import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {ProfileManagement} from "@/components/operator/profile-management";

export default function ProfilePage() {
    const router = useRouter()

    const handleSectionChange = (section: string) => {
        router.push(`/operator-manager/${section}`)
    }

    return (
        <AdminLayout activeSection="profile" onSectionChange={handleSectionChange}>
            <ProfileManagement/>
        </AdminLayout>
    )
}