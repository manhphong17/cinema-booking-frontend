"use client"

import type {ReactNode} from "react"
import {useState, useMemo, memo, useEffect} from "react"
import {useRouter, usePathname} from "next/navigation"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Calendar, DoorOpen, Film, LayoutDashboard, LogOut, Newspaper, ChevronLeft, ChevronRight} from "lucide-react"

interface OperatorLayoutProps {
    children: ReactNode
}

const sidebarItems = [
    {id: "dashboard", label: "Dashboard", icon: LayoutDashboard},
    {id: "movies", label: "Movie Management", icon: Film},
    {id: "showtimes", label: "Showtime Management", icon: Calendar},
    {id: "rooms", label: "Room Management", icon: DoorOpen},
    {id: "news", label: "News Management", icon: Newspaper},
]

// Memoized sidebar item component for better performance
const SidebarItem = memo(({ 
    item, 
    isActive, 
    isCollapsed, 
    index
}: {
    item: typeof sidebarItems[0]
    isActive: boolean
    isCollapsed: boolean
    index: number
}) => {
    const Icon = item.icon
    const href = item.id === "dashboard" ? "/operator-manager" : `/operator-manager/${item.id}`
    
    return (
        <Link href={href}>
            <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`operator-nav-item operator-tooltip w-full justify-start gap-3 h-12 transition-all duration-300 operator-hover-lift ${
                    isActive
                        ? "operator-gradient-primary text-primary-foreground shadow-lg scale-105"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                data-tooltip={isCollapsed ? item.label : ""}
            >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}/>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                    <div className="operator-nav-indicator ml-auto w-2 h-2 rounded-full bg-primary-foreground/20"></div>
                )}
            </Button>
        </Link>
    )
})

SidebarItem.displayName = "SidebarItem"

export function OperatorLayout({children}: OperatorLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Load sidebar state from localStorage after mounting
        const savedState = localStorage.getItem('operator-sidebar-collapsed')
        if (savedState === 'true') {
            setIsCollapsed(true)
        }
    }, [])

    // Memoize active section calculation to avoid re-computation
    const currentActiveSection = useMemo(() => {
        if (pathname === "/operator-manager") return "dashboard"
        
        // Handle nested routes like /operator-manager/movies/[id]
        const pathParts = pathname.split("/").filter(Boolean)
        
        // If we're in a nested route, get the parent section
        if (pathParts.length >= 3 && pathParts[0] === "operator-manager") {
            return pathParts[1] // Return the section (movies, showtimes, etc.)
        }
        
        // For direct routes like /operator-manager/movies
        return pathParts[pathParts.length - 1] || "dashboard"
    }, [pathname])

    const toggleSidebar = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        if (typeof window !== 'undefined') {
            localStorage.setItem('operator-sidebar-collapsed', newState.toString())
        }
    }

    // Prevent hydration mismatch by not rendering sidebar state until mounted
    if (!mounted) {
        return (
            <div className="flex h-screen bg-background">
                <div className="operator-sidebar operator-gradient-sidebar border-r border-sidebar-border flex flex-col shadow-lg relative operator-sidebar-expanded">
                    <div className="operator-sidebar-header border-b border-sidebar-border/50">
                        <div className="flex items-center gap-3 operator-slide-in cursor-pointer hover:bg-sidebar-accent/30 rounded-lg p-2 -m-2 transition-all duration-200">
                            <div className="w-10 h-10 operator-gradient-primary rounded-xl flex items-center justify-center shadow-lg operator-pulse">
                                <Film className="w-6 h-6 text-primary-foreground"/>
                            </div>
                            <div className="operator-sidebar-content">
                                <h1 className="text-lg font-semibold bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text text-transparent">
                                    Cinema Operations
                                </h1>
                                <p className="text-sm text-muted-foreground">Manager Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-4">
                        <div className="animate-pulse space-y-2">
                            <div className="h-12 bg-sidebar-accent/30 rounded-lg"></div>
                            <div className="h-12 bg-sidebar-accent/20 rounded-lg"></div>
                            <div className="h-12 bg-sidebar-accent/20 rounded-lg"></div>
                            <div className="h-12 bg-sidebar-accent/20 rounded-lg"></div>
                            <div className="h-12 bg-sidebar-accent/20 rounded-lg"></div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-auto p-8 bg-background operator-fade-in">{children}</main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className={`operator-sidebar operator-gradient-sidebar border-r border-sidebar-border flex flex-col shadow-lg relative ${
                isCollapsed ? 'operator-sidebar-collapsed' : 'operator-sidebar-expanded'
            }`}>
                {/* Header */}
                <div className="operator-sidebar-header border-b border-sidebar-border/50">
                    <div 
                        className="flex items-center gap-3 operator-slide-in cursor-pointer hover:bg-sidebar-accent/30 rounded-lg p-2 -m-2 transition-all duration-200"
                        onClick={() => {
                            if (isCollapsed) {
                                toggleSidebar()
                            }
                        }}
                    >
                        <div className="w-10 h-10 operator-gradient-primary rounded-xl flex items-center justify-center shadow-lg operator-pulse">
                            <Film className="w-6 h-6 text-primary-foreground"/>
                        </div>
                        <div className="operator-sidebar-content">
                            <h1 className="text-lg font-semibold bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text text-transparent">
                                Cinema Operations
                            </h1>
                            <p className="text-sm text-muted-foreground">Manager Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 pt-8 px-4 pb-4 space-y-2 ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto operator-scrollbar'}`}>
                    {sidebarItems.map((item, index) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                            isActive={currentActiveSection === item.id}
                            isCollapsed={isCollapsed}
                            index={index}
                        />
                    ))}
                </nav>

                {/* User Profile */}
                <div className="operator-sidebar-profile border-t border-sidebar-border/50">
                    {!isCollapsed ? (
                        <>
                            <div 
                                className="flex items-center gap-3 mb-3 operator-scale-in cursor-pointer hover:bg-sidebar-accent/30 rounded-lg p-2 transition-all duration-200"
                                onClick={() => router.push("/operator-manager/profile")}
                            >
                                <Avatar className="operator-avatar w-10 h-10 ring-2 ring-primary/30 operator-hover-lift">
                                    <AvatarImage src="/admin-avatar.png"/>
                                    <AvatarFallback className="operator-gradient-primary text-primary-foreground font-bold">OM</AvatarFallback>
                                </Avatar>
                                <div className="operator-sidebar-content flex-1 min-w-0">
                                    <p className="text-sm font-medium text-sidebar-foreground truncate">Operations Manager</p>
                                    <p className="text-xs text-muted-foreground truncate">manager@cinema.com</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50 operator-hover-lift transition-all duration-200"
                                onClick={() => {
                                    localStorage.removeItem("auth")
                                    router.push("/login")
                                }}
                            >
                                <LogOut className="w-4 h-4"/>
                                <span className="font-medium">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 p-2">
                            <Avatar 
                                className="operator-avatar w-10 h-10 ring-2 ring-primary/30 operator-hover-lift cursor-pointer hover:scale-110 transition-all duration-200"
                                onClick={() => router.push("/operator-manager/profile")}
                            >
                                <AvatarImage src="/admin-avatar.png"/>
                                <AvatarFallback className="operator-gradient-primary text-primary-foreground font-bold">OM</AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="operator-tooltip w-10 h-10 p-0 rounded-full hover:bg-sidebar-accent/50 operator-hover-lift transition-all duration-200"
                                onClick={() => {
                                    localStorage.removeItem("auth")
                                    router.push("/login")
                                }}
                                data-tooltip="Logout"
                            >
                                <LogOut className="w-4 h-4"/>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Toggle Button - Only show when expanded */}
                {!isCollapsed && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="operator-sidebar-toggle w-10 h-10 p-0 rounded-full bg-card border-2 border-sidebar-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                        onClick={toggleSidebar}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-auto p-8 bg-background operator-fade-in">{children}</main>
            </div>
        </div>
    )
}
