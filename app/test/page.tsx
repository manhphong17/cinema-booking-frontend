"use client"

import {useEffect} from "react"
import {apiClient} from "@/src/api/interceptor"

export default function TestPage() {
    useEffect(() => {
        // gọi thử endpoint bảo vệ (cần accessToken)
        apiClient.get("/user/lisst")
            .then(res => console.log("Profile:", res.data))
            .catch(err => console.error(" Error:", err))
    }, [])

    return <div>Test refresh token page</div>
}
