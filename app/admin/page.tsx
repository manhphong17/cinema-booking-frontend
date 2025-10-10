"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"


export default function AdminPage() {
    const [activeSection, setActiveSection] = useState("dashboard")
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    /*useEffect(() => {
      // Check authentication
      const auth = localStorage.getItem("auth")
      if (auth) {
        const authData = JSON.parse(auth)
        if (authData.isAuthenticated && authData.user.role === "admin") {
          setIsAuthenticated(true)
        } else {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
      setIsLoading(false)
    }, [router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }*/


}
