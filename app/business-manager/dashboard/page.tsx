"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const revenueData = [
    { month: "T1", revenue: 450000000, orders: 1200 },
    { month: "T2", revenue: 520000000, orders: 1350 },
    { month: "T3", revenue: 480000000, orders: 1280 },
    { month: "T4", revenue: 610000000, orders: 1520 },
    { month: "T5", revenue: 580000000, orders: 1450 },
    { month: "T6", revenue: 720000000, orders: 1820 },
]

const topProducts = [
    { name: "Combo Couple", revenue: 85000000, growth: 12.5 },
    { name: "Bắp Rang Bơ Lớn", revenue: 62000000, growth: 8.3 },
    { name: "Combo Family", revenue: 54000000, growth: -3.2 },
    { name: "Coca Cola", revenue: 38000000, growth: 15.7 },
]

export default function BusinessManagerDashboard() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Handle OAuth callback - get access token from URL
    useEffect(() => {
        const token = searchParams.get('token')
        if (token) {
            // Store access token in localStorage
            localStorage.setItem('accessToken', token)
            // Decode token to get role information and email
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                // Check for both 'roles' (backend) and 'authorities' (legacy)
                const roles = payload.roles || payload.authorities
                if (roles && Array.isArray(roles)) {
                    localStorage.setItem('roleName', JSON.stringify(roles))
                }
                // Extract email from 'sub' field (subject) and store it
                if (payload.sub) {
                    localStorage.setItem('email', payload.sub)
                    localStorage.setItem('userEmail', payload.sub)
                }
                // Store userId if available
                if (payload.userId) {
                    localStorage.setItem('userId', String(payload.userId))
                }
            } catch (error) {
                console.error('Error decoding token:', error)
            }
            // Remove token from URL for security
            router.replace('/business-manager/dashboard', { scroll: false })
        }
    }, [searchParams, router])

    return (
        <BusinessManagerLayout activeSection="dashboard">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Tổng quan doanh thu và hiệu suất kinh doanh</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Doanh thu tháng này</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">720,000,000đ</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +18.2% so với tháng trước
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Tổng đơn hàng</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">1,820</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +12.5% so với tháng trước
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Giá trị đơn TB</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">395,600đ</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +5.1% so với tháng trước
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Khách hàng mới</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">342</div>
                            <p className="text-xs text-red-600 flex items-center mt-1">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                -2.3% so với tháng trước
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <Card className="bg-white border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Doanh thu 6 tháng gần nhất</CardTitle>
                            <CardDescription>Biểu đồ doanh thu theo tháng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                                        />
                                        <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Chart */}
                    <Card className="bg-white border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Số lượng đơn hàng</CardTitle>
                            <CardDescription>Xu hướng đơn hàng theo tháng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                                        />
                                        <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products */}
                <Card className="bg-white border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Sản phẩm bán chạy nhất</CardTitle>
                        <CardDescription>Top 4 sản phẩm có doanh thu cao nhất tháng này</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-700 font-bold">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">{product.revenue.toLocaleString()}đ</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 ${product.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {product.growth >= 0 ? (
                                            <ArrowUpRight className="h-4 w-4" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4" />
                                        )}
                                        <span className="font-medium">{Math.abs(product.growth)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </BusinessManagerLayout>
    )
}
