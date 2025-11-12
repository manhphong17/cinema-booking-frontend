"use client"

import {useEffect, useState} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line} from "recharts"
import apiClient from "@/src/api/interceptor";


export default function BusinessManagerDashboard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [dashbroadData, setDashbroadData] = useState<any>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await apiClient.get("/business/dashboard")
                if (res.data?.status === 200) {
                    setDashbroadData(res.data.data)
                } else {
                    console.warn("Lỗi: API trả về status khác 200", res.data)
                }
            } catch (error: any) {
                console.error("Lỗi khi gọi API dashboard:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])
    if (loading) {
        return (
            <BusinessManagerLayout activeSection="dashboard">
                <p className="text-gray-500">Đang tải dữ liệu...</p>
            </BusinessManagerLayout>
        )
    }

    if (!dashbroadData) {
        return (
            <BusinessManagerLayout activeSection="dashboard">
                <p className="text-red-500">Không thể tải dữ liệu dashboard.</p>
            </BusinessManagerLayout>
        )
    }

    // --- Helper hiển thị mũi tên và màu ---
    const StatChange = ({ value }: { value: number }) => {
        const isUp = value >= 0
        return (
            <p className={`text-xs flex items-center mt-1 ${isUp ? "text-green-600" : "text-red-600"}`}>
                {isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {isUp ? "+" : "-"}
                {Math.abs(value).toFixed(1)}% so với tháng trước
            </p>
        )
    }

    // 📦 Component StatCard tái sử dụng
    function StatCard({
                          title,
                          icon,
                          value,
                          change,
                      }: {
        title: string
        icon: React.ReactNode
        value: string
        change: number
    }) {
        const isUp = change >= 0
        const color = isUp ? "text-green-600" : "text-red-600"
        const ArrowIcon = isUp ? ArrowUpRight : ArrowDownRight

        return (
            <Card className="bg-white border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <p className={`text-xs flex items-center mt-1 ${color}`}>
                        <ArrowIcon className="h-3 w-3 mr-1" />
                        {isUp ? "+" : "-"}
                        {Math.abs(change).toFixed(1)}% so với tháng trước
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <BusinessManagerLayout activeSection="dashboard">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Tổng quan doanh thu và hiệu suất kinh doanh</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <  StatCard
                        title="Doanh thu tháng này"
                        icon={<DollarSign className="h-4 w-4 text-blue-600" />}
                        value={`${dashbroadData.revenueThisMonth.toLocaleString("vi-VN")}đ`}
                        change={dashbroadData.revenueChange}
                    />


                    <StatCard
                        title="Tổng đơn hàng"
                        icon={<ShoppingCart className="h-4 w-4 text-blue-600" />}
                        value={dashbroadData.totalOrders.toLocaleString("vi-VN")}
                        change={dashbroadData.orderChange}
                    />

                    <StatCard
                        title="Giá trị đơn TB"
                        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                        value={`${dashbroadData.avgOrderValue.toLocaleString("vi-VN")}đ`}
                        change={dashbroadData.avgValueChange}
                    />

                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <Card className="bg-white border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Doanh thu theo tháng</CardTitle>
                            <CardDescription>Biểu đồ doanh thu theo tháng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashbroadData.revenueChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                                        />
                                        <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
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
                                    <LineChart
                                        data={Array.isArray(dashbroadData.orderChart) ? dashbroadData.orderChart : []}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#fff",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={{ fill: "#2563eb" }}
                                        />
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
                        <CardDescription>Top 4 sản phẩm bán được nhiều +nhất tháng này</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashbroadData.topProducts?.map((product: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-700 font-bold">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {product.revenue.toLocaleString()}đ
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-green-600">
                                        <span className="font-medium">{product.totalSold} đã bán</span>
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
