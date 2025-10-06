"use client"

import {AdminLayout} from "@/components/layouts/admin-layout"
import {RoomManagement} from "@/components/operator/room-management"

export default function RoomsPage() {
    return (
        <AdminLayout activeSection="rooms" onSectionChange={() => {}}>
            <RoomManagement onSelectRoom={() => {}} />
        </AdminLayout>
    )
}
