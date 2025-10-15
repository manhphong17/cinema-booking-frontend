"use client"

import {useState, useEffect} from "react"
import {HomeLayout} from "@/components/layouts/home-layout"
import {CustomerProfile} from "@/components/customer/customer-profile"
import {CustomerOrders} from "@/components/customer/customer-orders"
import {CustomerVouchers} from "@/components/customer/customer-vouchers"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {User, ShoppingBag, Gift} from "lucide-react"

export default function CustomerPage() {
    const [activeSection, setActiveSection] = useState("profile")

    // Get section from URL params
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section')
        if (section && ['profile', 'orders', 'vouchers'].includes(section)) {
            setActiveSection(section)
        }
    }, [])

    const renderContent = () => {
        switch (activeSection) {
            case "profile":
                return <CustomerProfile/>
            case "orders":
                return <CustomerOrders/>
            case "vouchers":
                return <CustomerVouchers/>
            default:
                return <CustomerProfile/>
        }
    }

    const menuItems = [
        { id: "profile", label: "Hồ sơ", icon: User, description: "Quản lý thông tin cá nhân", color: "blue" },
        { id: "orders", label: "Đơn hàng", icon: ShoppingBag, description: "Xem lịch sử đặt vé", color: "green" },
        { id: "vouchers", label: "Voucher", icon: Gift, description: "Quản lý voucher của bạn", color: "purple" },
    ]


    return (
        <HomeLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tài khoản của tôi</h1>
                        <p className="text-gray-600">Quản lý thông tin và đơn hàng của bạn</p>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="lg:hidden mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-2">
                            <div className="grid grid-cols-3 gap-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = activeSection === item.id
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className={`h-auto p-4 rounded-lg transition-all duration-200 ${
                                                isActive 
                                                    ? (item.color === 'blue' ? 'bg-blue-600 text-white shadow-lg' : 
                                                       item.color === 'green' ? 'bg-green-600 text-white shadow-lg' : 
                                                       'bg-purple-600 text-white shadow-lg')
                                                    : "hover:bg-gray-100"
                                            }`}
                                            onClick={() => setActiveSection(item.id)}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs font-medium">{item.label}</span>
                                            </div>
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Desktop Sidebar Navigation */}
                        <div className="hidden lg:block lg:col-span-1">
                            <Card className="sticky top-6 border-0 shadow-xl">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                                    <CardTitle className="flex items-center gap-2 text-gray-800">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Menu
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <nav className="space-y-1">
                                        {menuItems.map((item) => {
                                            const Icon = item.icon
                                            const isActive = activeSection === item.id
                                            return (
                                                <Button
                                                    key={item.id}
                                                    variant="ghost"
                                                    className={`w-full justify-start h-auto p-4 rounded-none transition-all duration-200 ${
                                                        isActive 
                                                            ? (item.color === 'blue' ? 'bg-blue-600 text-white shadow-lg' : 
                                                               item.color === 'green' ? 'bg-green-600 text-white shadow-lg' : 
                                                               'bg-purple-600 text-white shadow-lg')
                                                            : "hover:bg-gray-50 hover:text-gray-900"
                                                    }`}
                                                    onClick={() => setActiveSection(item.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-5 w-5" />
                                                        <div className="text-left">
                                                            <div className="font-medium">{item.label}</div>
                                                            <div className={`text-xs ${
                                                                isActive 
                                                                    ? "text-white/80" 
                                                                    : "text-gray-500"
                                                            }`}>
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Button>
                                            )
                                        })}
                                    </nav>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HomeLayout>
    )
}
