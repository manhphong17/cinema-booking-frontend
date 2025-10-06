"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, AlertCircle, Filter, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

type ApprovalStatus = "all" | "pending" | "approved" | "rejected" | "expired"
type RequestType = "all" | "movie" | "ticketPrice" | "food" | "voucher"

interface ApprovalRequest {
  id: number
  type: "movie" | "ticketPrice" | "food" | "voucher"
  title: string
  manager: string
  createdAt: Date
  status: "pending" | "approved" | "rejected" | "expired"
  requestPayload: Record<string, any>
  feedback?: string
}

const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInDays > 0) return `${diffInDays} ngày trước`
  if (diffInHours > 0) return `${diffInHours} giờ trước`
  if (diffInMinutes > 0) return `${diffInMinutes} phút trước`
  return "Vừa xong"
}

const isExpired = (createdAt: Date, status: string): boolean => {
  if (status !== "pending") return false
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  return diffInDays > 30
}

const getRequestImage = (type: string): string => {
  const images = {
    movie: "/images/request-movie.jpg",
    ticketPrice: "/images/request-ticket.jpg",
    food: "/images/request-food.jpg",
    voucher: "/images/request-voucher.jpg",
  }
  return images[type as keyof typeof images] || "/images/request-default.jpg"
}

export function ApprovalRequests() {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>("all")
  const [typeFilter, setTypeFilter] = useState<RequestType>("all")
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({})

  const approvalRequests: ApprovalRequest[] = [
    {
      id: 1,
      type: "movie",
      title: "Thêm phim Avatar: The Way of Water",
      manager: "Nguyễn Văn A",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "pending",
      requestPayload: {
        movieName: "Avatar: The Way of Water",
        director: "James Cameron",
        duration: 192,
        genre: "Sci-Fi, Adventure",
        releaseDate: "2024-12-16",
        rating: "PG-13",
        language: "English",
      },
    },
    {
      id: 2,
      type: "ticketPrice",
      title: "Điều chỉnh giá vé cuối tuần",
      manager: "Trần Thị B",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: "pending",
      requestPayload: {
        priceType: "Weekend",
        currentPrice: 80000,
        newPrice: 95000,
        effectiveDate: "2024-02-01",
        reason: "Tăng chi phí vận hành",
      },
    },
    {
      id: 3,
      type: "food",
      title: "Combo bắp nước gia đình mới",
      manager: "Lê Văn C",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: "approved",
      requestPayload: {
        comboName: "Family Combo",
        items: ["Bắp rang bơ lớn x2", "Nước ngọt lớn x3", "Hotdog x2"],
        price: 250000,
        discount: "10%",
      },
      feedback: "Đã phê duyệt. Combo này phù hợp với nhu cầu khách hàng.",
    },
    {
      id: 4,
      type: "voucher",
      title: "Voucher giảm giá sinh nhật",
      manager: "Phạm Thị D",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: "approved",
      requestPayload: {
        voucherCode: "BIRTHDAY2024",
        discountType: "Percentage",
        discountValue: 20,
        validFrom: "2024-01-01",
        validTo: "2024-12-31",
        maxUsage: 1000,
        minPurchase: 100000,
      },
      feedback: "Phê duyệt voucher sinh nhật cho chiến dịch marketing.",
    },
    {
      id: 5,
      type: "movie",
      title: "Thêm phim Oppenheimer",
      manager: "Hoàng Văn E",
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago (expired)
      status: "pending",
      requestPayload: {
        movieName: "Oppenheimer",
        director: "Christopher Nolan",
        duration: 180,
        genre: "Biography, Drama",
        releaseDate: "2024-07-21",
        rating: "R",
      },
    },
    {
      id: 6,
      type: "food",
      title: "Thêm món snack mới",
      manager: "Đỗ Thị F",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      status: "rejected",
      requestPayload: {
        itemName: "Nachos Cheese",
        price: 65000,
        supplier: "ABC Food Co.",
        estimatedCost: 35000,
      },
      feedback: "Từ chối do margin quá thấp và nhà cung cấp chưa được xác minh.",
    },
  ]

  const requestsWithExpiry = approvalRequests.map((req) => ({
    ...req,
    status: isExpired(req.createdAt, req.status) ? ("expired" as const) : req.status,
  }))

  const filteredRequests = requestsWithExpiry.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.type === typeFilter
    return matchesStatus && matchesType
  })

  const toggleExpand = (id: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleApprove = (id: number) => {
    const feedback = feedbackText[id] || ""
    console.log("[v0] Approving request:", id, "with feedback:", feedback)
    // Handle approval logic here
  }

  const handleReject = (id: number) => {
    const feedback = feedbackText[id] || ""
    console.log("[v0] Rejecting request:", id, "with feedback:", feedback)
    // Handle rejection logic here
  }

  const StatusDot = ({ status }: { status: string }) => {
    const colors = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      expired: "bg-gray-500",
    }
    return <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors]}`} />
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Đang chờ",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      expired: "Hết hạn",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      movie: "Phim",
      ticketPrice: "Giá vé",
      food: "Đồ ăn",
      voucher: "Voucher",
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yêu cầu phê duyệt</h1>
          <p className="text-gray-600 mt-2">Xem xét và xử lý các yêu cầu từ quản lý</p>
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={(value: ApprovalStatus) => setStatusFilter(value)}>
            <SelectTrigger className="w-[160px] bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Đang chờ</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value: RequestType) => setTypeFilter(value)}>
            <SelectTrigger className="w-[160px] bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Loại yêu cầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="movie">Phim</SelectItem>
              <SelectItem value="ticketPrice">Giá vé</SelectItem>
              <SelectItem value="food">Đồ ăn</SelectItem>
              <SelectItem value="voucher">Voucher</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRequests.map((request) => {
          const isExpanded = expandedCards.has(request.id)
          const canTakeAction = request.status === "pending" && !isExpired(request.createdAt, request.status)

          return (
            <Card key={request.id} className="bg-white overflow-hidden">
              <div className="relative w-full h-48">
                <Image
                  src={getRequestImage(request.type) || "/placeholder.svg"}
                  alt={request.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant="secondary" className="bg-white/90 text-gray-900 text-xs">
                    {getTypeLabel(request.type)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={request.status} />
                    <span className="text-sm font-medium text-gray-700">{getStatusLabel(request.status)}</span>
                    {request.status === "expired" && (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Quá 30 ngày
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{request.title}</h3>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                      Tạo bởi: <span className="font-medium text-gray-800">{request.manager}</span>
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">{getRelativeTime(request.createdAt)}</div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                    onClick={() => toggleExpand(request.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </>
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Chi tiết yêu cầu:</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {Object.entries(request.requestPayload).map(([key, value]) => (
                          <div key={key} className="flex text-sm">
                            <span className="font-medium text-gray-600 min-w-[140px]">
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}:
                            </span>
                            <span className="text-gray-900">
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.feedback && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Phản hồi từ Admin:</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {request.feedback}
                        </p>
                      </div>
                    )}

                    {canTakeAction && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Phản hồi (tùy chọn):</label>
                          <Textarea
                            placeholder="Nhập phản hồi của bạn..."
                            value={feedbackText[request.id] || ""}
                            onChange={(e) => setFeedbackText((prev) => ({ ...prev, [request.id]: e.target.value }))}
                            className="min-h-[80px] text-gray-900"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Phê duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy yêu cầu</h3>
            <p className="text-gray-600">Không có yêu cầu phê duyệt nào phù hợp với bộ lọc hiện tại.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
