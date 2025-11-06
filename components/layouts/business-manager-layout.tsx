"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Film, LayoutDashboard, Package, Gift, DollarSign, LogOut, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { logout } from "@/src/api/interceptor"

interface BusinessManagerLayoutProps {
    children: React.ReactNode
    activeSection: string
}

export function BusinessManagerLayout({ children, activeSection }: BusinessManagerLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/business-manager/dashboard" },
        { id: "concession", label: "Quản lý Bắp Nước", icon: Package, path: "/business-manager/concession" },
        { id: "voucher", label: "Quản lý Voucher", icon: Gift, path: "/business-manager/voucher" },
        { id: "ticket-price", label: "Quản lý Giá Vé", icon: DollarSign, path: "/business-manager/ticket-price" },
    ]

    const handleLogout = () => {
        logout()
    }

    const handleNavigation = (path: string) => {
        router.push(path)
        setSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white shadow-md"
                >
                    {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Film className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Cinema Operations</h1>
                                <p className="text-xs text-blue-100">Business Manager Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* Manager Profile */}
                    <div className="p-6 border-b">
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarImage src="/business-manager-avatar.jpg" />
                                <AvatarFallback className="bg-blue-100 text-blue-700">BM</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-gray-900">Business Manager</p>
                                <p className="text-xs text-gray-500">manager@cinema.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = activeSection === item.id
                                return (
                                    <li key={item.id}>
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={`w-full justify-start ${
                                                isActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-50 text-gray-700"
                                            }`}
                                            onClick={() => handleNavigation(item.path)}
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-red-200"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:ml-64">
                <div className="p-6 lg:p-8">{children}</div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    )
}
