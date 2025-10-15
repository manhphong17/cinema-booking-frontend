"use client"

import {OperatorLayout} from "@/components/layouts/operator-layout"
import {RoomManagement} from "@/components/operator/room-management"

export default function RoomsPage() {
    return (
        <OperatorLayout>
            <RoomManagement onSelectRoom={() => {}} />
        </OperatorLayout>
    )
}
