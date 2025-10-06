"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {Dashboard} from "@/components/operator/dashboard"
import {MovieManagement} from "@/components/operator/movie-management"
import {ShowtimeManagement} from "@/components/operator/showtime-management"
import {RoomManagement} from "@/components/operator/room-management"
import {SeatManagement} from "@/components/operator/seat-management"
import {NewsManagement} from "@/components/operator/news-management"
import {ProfileManagement} from "@/components/operator/profile-management"

export default function AdminPage() {
    const [activeSection, setActiveSection] = useState("dashboard")
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check authentication
        const auth = localStorage.getItem("auth")
        if (auth) {
            const authData = JSON.parse(auth)
            if (authData.isAuthenticated && authData.user.role === "admin") {
                setIsAuthenticated(true)
            } else {
                router.push("/admin/login")
            }
        } else {
            router.push("/admin/login")
        }
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const renderContent = () => {
        if (selectedRoom) {
            return <SeatManagement roomId={selectedRoom} onBack={() => setSelectedRoom(null)}/>
        }

        switch (activeSection) {
            case "dashboard":
                return <Dashboard/>
            case "movies":
                return <MovieManagement/>
            case "showtimes":
                return <ShowtimeManagement/>
            case "rooms":
                return <RoomManagement onSelectRoom={setSelectedRoom}/>
            case "news":
                return <NewsManagement/>
            case "profile":
                return <ProfileManagement/>
            default:
                return <Dashboard/>
        }
    }

    return (
        <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
            {renderContent()}
        </AdminLayout>
    )
}
