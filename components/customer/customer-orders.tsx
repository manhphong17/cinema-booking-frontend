"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
            Pending
          </Badge>
        )
      case "upcoming":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Upcoming
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div id="view-orders" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-blue-700">Chọn ngày</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setCurrentPage(1)
                setSelectedDate(e.target.value)
              }}
              className="w-[220px] h-10 text-base font-medium border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          {loading ? (
            <div className="py-10 text-center text-gray-600">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-gray-600">Không có đơn hàng</div>
          ) : (
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 w-[15%]">Mã đơn</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 w-[15%] text-right">Giá tiền</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 w-[20%]">Trạng thái</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 w-[30%]">Ngày tạo</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 w-[20%] text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">{order.code || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 text-right">{order.total?.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell className="px-4 py-3">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600">
                    {order.date ? new Date(order.date).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-sm font-medium"
                      onClick={() => handleViewDetail(order.id)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {total === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, total)} of {total} orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
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
  )
}
