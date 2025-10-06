"use client"

import {OperatorLayout} from "@/components/layouts/operator-layout"
import {ProfileManagement} from "@/components/operator/profile-management";

export default function ProfilePage() {
    return (
        <OperatorLayout>
            <ProfileManagement/>
        </OperatorLayout>
    )
}