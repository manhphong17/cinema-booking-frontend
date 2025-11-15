"use client"
import { useEffect, useState } from "react"
import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {DollarSign, Ticket, ShoppingCart, Coffee, Filter, ChevronRight, Calendar, ChevronLeft} from "lucide-react"
import apiClient from "@/src/api/interceptor"

interface OrderDTO {
    id: number
    code: string
    customerName: string
    createdAt: string
    totalPrice: number
    status: string
    paymentMethod: string
}

export default function OrderManagementPage() {
    const [orders, setOrders] = useState<OrderDTO[]>([])
    const [status, setStatus] = useState<string>("ALL")
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]) // yyyy-MM-dd
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const changeDate = (days: number) => {
        const d = new Date(date)
        d.setDate(d.getDate() + days)
        setDate(d.toISOString().split("T")[0])
    }
    const [summary, setSummary] = useState({
        totalRevenueToday: 0,
        totalTicketsSold: 0,
        totalCompletedOrders: 0,
        totalConcessionsSold: 0,
    })

    // Fetch orders + summary
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true)
                const res = await apiClient.get(
                    `/orders/sales?status=${status === "ALL" ? "" : status}&date=${date}&page=${page}`
                )

                if (res.data?.status === 200) {
                    const pageData = res.data.data.orders
                    setOrders(pageData?.content || [])
                    setSummary(res.data.data.summary || summary)
                    setTotalPages(pageData?.totalPages || 0)
                    setTotalElements(pageData?.totalElements || 0)
                } else {
                    setOrders([])
                    setSummary({
                        totalRevenueToday: 0,
                        totalTicketsSold: 0,
                        totalCompletedOrders: 0,
                        totalConcessionsSold: 0,
                    })
                    setTotalPages(0)
                    setTotalElements(0)
                }
            } catch (err) {
                console.error("Error fetching orders:", err)
                setOrders([])
                setSummary({
                    totalRevenueToday: 0,
                    totalTicketsSold: 0,
                    totalCompletedOrders: 0,
                    totalConcessionsSold: 0,
                })
                setTotalPages(0)
                setTotalElements(0)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [status, date, page])



    const formatCurrency = (amount: number) =>
        amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "COMPLETED":
                return <Badge className="bg-green-100 text-green-700 border-green-200">Hoàn tất</Badge>
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Đang xử lý</Badge>
            case "CANCELED":
                return <Badge className="bg-red-100 text-red-700 border-red-200">Đã hủy</Badge>
            default:
                return <Badge variant="outline">Khác</Badge>
        }
    }

    return (
        <BusinessManagerLayout activeSection="orders">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý bán hàng</h1>
                    <p className="text-gray-600 mt-2">
                        Theo dõi và quản lý các đơn hàng bán vé và đồ ăn kèm trong ngày.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Doanh thu hôm nay
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(summary.totalRevenueToday)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Số vé đã bán
                            </CardTitle>
                            <Ticket className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {summary.totalTicketsSold}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Số đơn hàng hoàn tất
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {summary.totalCompletedOrders}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Số concession đã bán
                            </CardTitle>
                            <Coffee className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {summary.totalConcessionsSold}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Bộ chọn ngày */}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Ngày:</span>
                        <div className="flex items-center border rounded-md px-2 py-1 bg-white">
                            <button onClick={() => changeDate(-1)}>
                                <ChevronLeft className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                            </button>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mx-2 text-sm border-none focus:ring-0"
                            />
                            <button onClick={() => changeDate(1)}>
                                <ChevronRight className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                            </button>
                        </div>
                    </div>

                    {/* Bộ lọc trạng thái */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Trạng thái đơn hàng:</span>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả</SelectItem>
                                <SelectItem value="PENDING">Đang xử lý</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
                                <SelectItem value="CANCELED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>


                {/* Orders Table */}
                <Card className="bg-white border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Danh sách đơn hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                        ) : orders.length === 0 ? (
                            <p className="text-gray-500 text-sm">Không có đơn hàng nào.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-700">
                                    <thead className="border-b text-gray-600 font-medium bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2">Mã đơn</th>
                                        <th className="px-4 py-2">Khách hàng</th>
                                        <th className="px-4 py-2">Thời gian</th>
                                        <th className="px-4 py-2">Tổng tiền</th>
                                        <th className="px-4 py-2">Trạng thái</th>
                                        <th className="px-4 py-2">Thanh toán</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id} className="border-b hover:bg-slate-50 transition">
                                            <td className="px-4 py-2 font-medium text-gray-900">{o.code}</td>
                                            <td className="px-4 py-2">{o.customerName}</td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {new Date(o.createdAt).toLocaleString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-4 py-2">{formatCurrency(o.totalPrice)}</td>
                                            <td className="px-4 py-2">{getStatusBadge(o.status)}</td>
                                            <td className="px-4 py-2">{o.paymentMethod}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                        {/* Pagination */}
                        {orders.length > 0 && (
                            <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                                <p>
                                    Trang {page + 1} / {totalPages} — Tổng: {totalElements} đơn hàng
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(page - 1)}
                                        className={`px-3 py-1 rounded-md border text-sm font-medium transition ${
                                            page === 0
                                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                                : "text-blue-600 border-blue-200 hover:bg-blue-50"
                                        }`}
                                    >
                                        ← Trước
                                    </button>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(page + 1)}
                                        className={`px-3 py-1 rounded-md border text-sm font-medium transition ${
                                            page >= totalPages - 1
                                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                                : "text-blue-600 border-blue-200 hover:bg-blue-50"
                                        }`}
                                    >
                                        Sau →
                                    </button>
                                </div>
                            </div>
                        )}
                    </CardContent>


                </Card>
            </div>
        </BusinessManagerLayout>
    )
}
