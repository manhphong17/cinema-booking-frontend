"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"
import { searchOrdersByDate, getOrderDetail, type CustomerOrder, type OrderDetail } from "@/src/api/orders"
import { Input } from "@/components/ui/input"
import { OrderDetailModal } from "./order-detail-modal"

export function CustomerOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage

  useEffect(() => {
    let cancelled = false
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const zeroBasedPage = Math.max(0, currentPage - 1)
        const res = await searchOrdersByDate({ date: selectedDate, page: zeroBasedPage, size: itemsPerPage })
        if (!cancelled) {
          setOrders(res.items)
          setTotal(res.total)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không thể tải đơn hàng")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrders()
    return () => {
      cancelled = true
    }
  }, [currentPage, itemsPerPage, selectedDate])

  const handleViewDetail = async (orderId: string) => {
    try {
      setDetailLoading(true)
      setModalOpen(true)
      const detail = await getOrderDetail(Number(orderId))
      setSelectedOrder(detail)
    } catch (e: any) {
      console.error("Failed to load order detail:", e)
      setSelectedOrder(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleQRGenerated = (updatedOrder: OrderDetail) => {
    setSelectedOrder(updatedOrder)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 shadow-lg font-bold">
            Hoàn thành
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 border-2 border-yellow-400 shadow-lg font-bold">
            Đang chờ
          </Badge>
        )
      case "upcoming":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400 shadow-lg font-bold">
            Sắp tới
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400 shadow-lg font-bold">
            Đã hủy
          </Badge>
        )
      default:
        return <Badge className="border-2 font-bold">{status}</Badge>
    }
  }

  return (
    <div id="view-orders" className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Decorative Border Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Lịch sử đơn hàng
          </h1>
        </div>

      <div className="mb-6">
        <Card className="shadow-xl border-2 border-blue-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-gray-900">Chọn ngày</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setCurrentPage(1)
                  setSelectedDate(e.target.value)
                }}
                className="w-[220px] h-12 text-base font-medium border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Lịch sử đơn hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="text-sm text-red-600 mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200 font-semibold">{error}</div>
          )}
          {loading ? (
            <div className="py-16 text-center bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="text-lg text-gray-700 font-medium">Đang tải đơn hàng...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="text-lg text-gray-700 font-medium">Không có đơn hàng</div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-50 to-blue-50 hover:bg-blue-50 border-b-2 border-blue-200">
                  <TableHead className="px-6 py-4 text-sm font-bold text-gray-900 w-[15%]">Mã đơn</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-bold text-gray-900 w-[15%] text-right">Giá tiền</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-bold text-gray-900 w-[20%]">Trạng thái</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-bold text-gray-900 w-[30%]">Ngày tạo</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-bold text-gray-900 w-[20%] text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-blue-50/50 border-b border-gray-200 transition-colors">
                    <TableCell className="px-6 py-4 text-sm font-semibold text-gray-900">{order.code || "-"}</TableCell>
                    <TableCell className="px-6 py-4 text-sm font-bold text-blue-600 text-right">{order.total?.toLocaleString('vi-VN')} đ</TableCell>
                    <TableCell className="px-6 py-4">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-700">
                      {order.date ? new Date(order.date).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 text-sm font-semibold border-2 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300"
                        onClick={() => handleViewDetail(order.id)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-blue-200">
            <p className="text-sm font-semibold text-gray-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              Hiển thị {total === 0 ? 0 : startIndex + 1} đến {Math.min(startIndex + itemsPerPage, total)} trong tổng số {total} đơn hàng
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-2 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="text-sm font-bold text-gray-900 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-200">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-2 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orderDetail={selectedOrder}
        loading={detailLoading}
        onQRGenerated={handleQRGenerated}
      />
      </div>
    </div>
  )
}
