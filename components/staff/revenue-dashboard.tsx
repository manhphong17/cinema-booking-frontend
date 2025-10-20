"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, DollarSign, ShoppingCart, Ticket, Calendar, Download, Filter, Eye } from "lucide-react"

interface Transaction {
  id: string
  time: string
  type: "ticket" | "concession"
  items: string[]
  customerName: string
  paymentMethod: "cash" | "card" | "digital"
  amount: number
  staff: string
}

// Mock transaction data for today
const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    time: "09:15",
    type: "ticket",
    items: ["Spider-Man: No Way Home - 2 vé", "Ghế A5, A6"],
    customerName: "Nguyễn Văn A",
    paymentMethod: "card",
    amount: 200000,
    staff: "Nhân viên 1",
  },
  {
    id: "TXN002",
    time: "09:32",
    type: "concession",
    items: ["Bắp rang bơ lớn x2", "Coca Cola lớn x2"],
    customerName: "Trần Thị B",
    paymentMethod: "cash",
    amount: 280000,
    staff: "Nhân viên 2",
  },
  {
    id: "TXN003",
    time: "10:45",
    type: "ticket",
    items: ["The Batman - 3 vé", "Ghế B3, B4, B5"],
    customerName: "Lê Văn C",
    paymentMethod: "digital",
    amount: 300000,
    staff: "Nhân viên 1",
  },
  {
    id: "TXN004",
    time: "11:20",
    type: "concession",
    items: ["Combo Family x1"],
    customerName: "Phạm Thị D",
    paymentMethod: "card",
    amount: 320000,
    staff: "Nhân viên 3",
  },
  {
    id: "TXN005",
    time: "14:15",
    type: "ticket",
    items: ["Top Gun: Maverick - 2 vé", "Ghế C1, C2"],
    customerName: "Hoàng Văn E",
    paymentMethod: "cash",
    amount: 180000,
    staff: "Nhân viên 2",
  },
  {
    id: "TXN006",
    time: "15:30",
    type: "concession",
    items: ["Bắp rang bơ vừa x1", "Pepsi lớn x1", "Kẹo gấu Haribo x2"],
    customerName: "Vũ Thị F",
    paymentMethod: "digital",
    amount: 175000,
    staff: "Nhân viên 1",
  },
  {
    id: "TXN007",
    time: "16:45",
    type: "ticket",
    items: ["Avengers: Endgame - 4 vé", "Ghế D1, D2, D3, D4"],
    customerName: "Đỗ Văn G",
    paymentMethod: "card",
    amount: 400000,
    staff: "Nhân viên 3",
  },
  {
    id: "TXN008",
    time: "18:20",
    type: "concession",
    items: ["Combo Couple x2"],
    customerName: "Ngô Thị H",
    paymentMethod: "cash",
    amount: 360000,
    staff: "Nhân viên 2",
  },
]

export function RevenueDashboard() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "ticket" | "concession">("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const filteredTransactions = mockTransactions.filter(
    (transaction) => selectedFilter === "all" || transaction.type === selectedFilter,
  )

  // Calculate statistics
  const totalRevenue = mockTransactions.reduce((sum, t) => sum + t.amount, 0)
  const ticketRevenue = mockTransactions.filter((t) => t.type === "ticket").reduce((sum, t) => sum + t.amount, 0)
  const concessionRevenue = mockTransactions
    .filter((t) => t.type === "concession")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalTransactions = mockTransactions.length
  const ticketTransactions = mockTransactions.filter((t) => t.type === "ticket").length
  const concessionTransactions = mockTransactions.filter((t) => t.type === "concession").length

  const getPaymentMethodColor = (method: Transaction["paymentMethod"]) => {
    switch (method) {
      case "cash":
        return "bg-green-500"
      case "card":
        return "bg-blue-500"
      case "digital":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPaymentMethodText = (method: Transaction["paymentMethod"]) => {
    switch (method) {
      case "cash":
        return "Tiền mặt"
      case "card":
        return "Thẻ"
      case "digital":
        return "Ví điện tử"
      default:
        return "Khác"
    }
  }

  const getTypeColor = (type: Transaction["type"]) => {
    return type === "ticket" ? "bg-orange-500" : "bg-cyan-500"
  }

  const getTypeText = (type: Transaction["type"]) => {
    return type === "ticket" ? "Vé phim" : "Bắp nước"
  }

  return (
    <div className="space-y-6">
      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-primary">{totalRevenue.toLocaleString("vi-VN")}đ</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doanh thu vé</p>
                <p className="text-2xl font-bold text-orange-500">{ticketRevenue.toLocaleString("vi-VN")}đ</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Ticket className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doanh thu bắp nước</p>
                <p className="text-2xl font-bold text-cyan-500">{concessionRevenue.toLocaleString("vi-VN")}đ</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng giao dịch</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phân tích theo loại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Ticket className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Vé phim</p>
                  <p className="text-sm text-muted-foreground">{ticketTransactions} giao dịch</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-500">{ticketRevenue.toLocaleString("vi-VN")}đ</p>
                <p className="text-sm text-muted-foreground">{((ticketRevenue / totalRevenue) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="font-medium">Bắp nước</p>
                  <p className="text-sm text-muted-foreground">{concessionTransactions} giao dịch</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-cyan-500">{concessionRevenue.toLocaleString("vi-VN")}đ</p>
                <p className="text-sm text-muted-foreground">
                  {((concessionRevenue / totalRevenue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["cash", "card", "digital"].map((method) => {
              const methodTransactions = mockTransactions.filter((t) => t.paymentMethod === method)
              const methodRevenue = methodTransactions.reduce((sum, t) => sum + t.amount, 0)
              const percentage = ((methodRevenue / totalRevenue) * 100).toFixed(1)

              return (
                <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getPaymentMethodColor(method as Transaction["paymentMethod"])}`}
                    />
                    <div>
                      <p className="font-medium">{getPaymentMethodText(method as Transaction["paymentMethod"])}</p>
                      <p className="text-sm text-muted-foreground">{methodTransactions.length} giao dịch</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{methodRevenue.toLocaleString("vi-VN")}đ</p>
                    <p className="text-sm text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Giao dịch hôm nay
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <Button
                  variant={selectedFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("all")}
                >
                  Tất cả
                </Button>
                <Button
                  variant={selectedFilter === "ticket" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("ticket")}
                >
                  Vé phim
                </Button>
                <Button
                  variant={selectedFilter === "concession" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("concession")}
                >
                  Bắp nước
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-mono text-sm font-medium">{transaction.time}</p>
                    <p className="text-xs text-muted-foreground">{transaction.id}</p>
                  </div>

                  <Separator orientation="vertical" className="h-12" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(transaction.type)}>{getTypeText(transaction.type)}</Badge>
                      <Badge className={getPaymentMethodColor(transaction.paymentMethod)}>
                        {getPaymentMethodText(transaction.paymentMethod)}
                      </Badge>
                    </div>
                    <p className="font-medium">{transaction.customerName}</p>
                    <p className="text-sm text-muted-foreground">{transaction.items.join(" • ")}</p>
                    <p className="text-xs text-muted-foreground">Nhân viên: {transaction.staff}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{transaction.amount.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không có giao dịch nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chi tiết giao dịch {selectedTransaction.id}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(null)}>
                Đóng
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Thời gian:</label>
                <p>{selectedTransaction.time}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Loại giao dịch:</label>
                <p>
                  <Badge className={getTypeColor(selectedTransaction.type)}>
                    {getTypeText(selectedTransaction.type)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Khách hàng:</label>
                <p>{selectedTransaction.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phương thức thanh toán:</label>
                <p>
                  <Badge className={getPaymentMethodColor(selectedTransaction.paymentMethod)}>
                    {getPaymentMethodText(selectedTransaction.paymentMethod)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nhân viên:</label>
                <p>{selectedTransaction.staff}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tổng tiền:</label>
                <p className="text-xl font-bold text-primary">{selectedTransaction.amount.toLocaleString("vi-VN")}đ</p>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">Sản phẩm/Dịch vụ:</label>
              <ul className="mt-2 space-y-1">
                {selectedTransaction.items.map((item, index) => (
                  <li key={index} className="text-sm">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
