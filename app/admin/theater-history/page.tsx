"use client"

import { TheaterHistory } from "@/components/admin/theater-history"

export default function TheaterHistoryPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <TheaterHistory />
            </div>
        </div>
    )
}
