"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  UserPlus,
  Activity,
  LogIn,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  fetchAdminAccounts,
  fetchAdminDashboard,
  fetchStatistics,
  type AccountListResponse,
  type DashboardResponse,
  type StatisticsResponse,
} from "@/app/api/admin/dashboard"

type MetricKey = "totalUsers" | "totalOrders"

const DEFAULT_DASHBOARD: DashboardResponse = {
  metrics: {
    totalUsers: 0,
    newUsers: 0,
    totalLogins: 0,
    activeSessions: 0,
  },
  activity: [],
  recentActivities: [],
}

const PAGE_SIZE = 10

const PIE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
]

// Role color mapping
const getRoleColor = (role: string): { bg: string; text: string; border: string } => {
  const roleUpper = role.toUpperCase()
  if (roleUpper.includes("ADMIN") || roleUpper.includes("QUẢN TRỊ")) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
    }
  }
  if (roleUpper.includes("OPERATOR") || roleUpper.includes("VẬN HÀNH")) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
    }
  }
  if (roleUpper.includes("BUSINESS") || roleUpper.includes("KINH DOANH")) {
    return {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
    }
  }
  if (roleUpper.includes("CUSTOMER") || roleUpper.includes("KHÁCH HÀNG")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-300",
    }
  }
  // Default color
  return {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  }
}

export function Dashboard() {
  const [filters, setFilters] = useState({ startDate: "", endDate: "" })
  const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "" })
  const [dashboard, setDashboard] = useState<DashboardResponse>(DEFAULT_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("totalUsers")
  const [accountsData, setAccountsData] = useState<AccountListResponse | null>(null)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [accountsPage, setAccountsPage] = useState(0)
  
  const [ordersData, setOrdersData] = useState<StatisticsResponse | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersPage, setOrdersPage] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalAccounts, setTotalAccounts] = useState(0)

  const fetchDashboardData = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAdminDashboard({
        startDate: start || undefined,
        endDate: end || undefined,
      })
      setDashboard(data)
    } catch (err: any) {
      console.error("Failed to fetch admin dashboard:", err)
      const message = err?.response?.data?.message ?? err?.message ?? "Không thể tải dữ liệu dashboard"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccountsData = useCallback(
    async ({ start, end, page }: { start?: string; end?: string; page?: number }) => {
      try {
        setAccountsLoading(true)
        setAccountsError(null)
        const data = await fetchAdminAccounts({
          startDate: start || undefined,
          endDate: end || undefined,
          page,
          size: PAGE_SIZE,
        })
        setAccountsData(data)
      } catch (err: any) {
        console.error("Failed to fetch accounts list:", err)
        const message = err?.response?.data?.message ?? err?.message ?? "Không thể tải danh sách tài khoản"
        setAccountsError(message)
      } finally {
        setAccountsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchDashboardData(appliedFilters.startDate, appliedFilters.endDate)
  }, [appliedFilters.startDate, appliedFilters.endDate, fetchDashboardData])

  // Load accounts data initially for pie chart
  useEffect(() => {
    fetchAccountsData({
      start: appliedFilters.startDate,
      end: appliedFilters.endDate,
      page: 0,
    })
  }, [appliedFilters.startDate, appliedFilters.endDate, fetchAccountsData])

  // Load orders statistics initially
  const fetchOrdersData = useCallback(
    async ({ start, end, page }: { start?: string; end?: string; page?: number }) => {
      try {
        setOrdersLoading(true)
        setOrdersError(null)
        console.log("📥 [Dashboard] Fetching orders with params:", { start, end, page })
        
        const data = await fetchStatistics({
          startDate: start || undefined,
          endDate: end || undefined,
          page: page ?? 0,
          size: PAGE_SIZE,
        })
        
        console.log("📥 [Dashboard] Received orders data:", data)
        console.log("📥 [Dashboard] Orders array:", data.orders)
        console.log("📥 [Dashboard] Orders count:", data.orders?.length)
        
        if (data.orders && data.orders.length > 0) {
          console.log("📥 [Dashboard] First order sample:", data.orders[0])
        }
        
        setOrdersData(data)
        setTotalOrders(data.totalOrders)
        setTotalAccounts(data.totalAccounts)
      } catch (err: any) {
        console.error("❌ [Dashboard] Failed to fetch orders list:", err)
        console.error("❌ [Dashboard] Error response:", err?.response)
        console.error("❌ [Dashboard] Error data:", err?.response?.data)
        const message = err?.response?.data?.message ?? err?.message ?? "Không thể tải danh sách đơn hàng"
        setOrdersError(message)
      } finally {
        setOrdersLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchOrdersData({
      start: appliedFilters.startDate,
      end: appliedFilters.endDate,
      page: 0,
    })
  }, [appliedFilters.startDate, appliedFilters.endDate, fetchOrdersData])

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    setFilters({ startDate: "", endDate: "" })
    setAppliedFilters({ startDate: "", endDate: "" })
  }

  const handleOpenModal = (metric: MetricKey) => {
    setSelectedMetric(metric)
    setModalOpen(true)
    if (metric === "totalOrders") {
      setOrdersPage(0)
      fetchOrdersData({
        start: appliedFilters.startDate,
        end: appliedFilters.endDate,
        page: 0,
      })
    } else {
      setAccountsPage(0)
      fetchAccountsData({
        start: appliedFilters.startDate,
        end: appliedFilters.endDate,
        page: 0,
      })
    }
  }

  const handleChangeAccountsPage = (nextPage: number) => {
    if (nextPage < 0 || (accountsData && nextPage >= accountsData.totalPages)) return
    setAccountsPage(nextPage)
    fetchAccountsData({
      start: appliedFilters.startDate,
      end: appliedFilters.endDate,
      page: nextPage,
    })
  }

  const handleChangeOrdersPage = (nextPage: number) => {
    if (nextPage < 0 || (ordersData && nextPage >= ordersData.totalPages)) return
    setOrdersPage(nextPage)
    fetchOrdersData({
      start: appliedFilters.startDate,
      end: appliedFilters.endDate,
      page: nextPage,
    })
  }

  const statCards = useMemo(
    () => [
      {
        key: "totalUsers" as MetricKey,
        title: "Tổng người dùng",
        icon: Users,
        gradient: "from-blue-500 to-blue-600",
        bgGradient: "from-blue-50 to-blue-100/50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        value: totalAccounts || dashboard.metrics.totalUsers,
        description: "Tổng số tài khoản trong hệ thống",
      },

    ],
    [dashboard.metrics, totalOrders, totalAccounts]
  )

  // Prepare pie chart data for account creation date distribution
  const creationDateDistribution = useMemo(() => {
    if (!accountsData?.accounts || accountsData.accounts.length === 0) {
      return []
    }

    const dateCounts: Record<string, number> = {}
    
    accountsData.accounts.forEach((account) => {
      if (!account.createdAt) {
        const unknown = "Không xác định"
        dateCounts[unknown] = (dateCounts[unknown] || 0) + 1
        return
      }

      try {
        // Parse date string (could be ISO format, DD/MM/YYYY, etc.)
        const dateStr = account.createdAt
        let date: Date

        // Try to parse different date formats
        if (dateStr.includes('T')) {
          // ISO format
          date = new Date(dateStr)
        } else if (dateStr.includes('/')) {
          // DD/MM/YYYY or MM/DD/YYYY format
          const parts = dateStr.split('/')
          if (parts.length === 3) {
            // Assume DD/MM/YYYY
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          } else {
            date = new Date(dateStr)
          }
        } else {
          date = new Date(dateStr)
        }

        if (isNaN(date.getTime())) {
          const unknown = "Không xác định"
          dateCounts[unknown] = (dateCounts[unknown] || 0) + 1
          return
        }

        // Group by month/year (e.g., "Tháng 1/2024")
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const monthYear = `Tháng ${month}/${year}`
        
        dateCounts[monthYear] = (dateCounts[monthYear] || 0) + 1
      } catch (error) {
        const unknown = "Không xác định"
        dateCounts[unknown] = (dateCounts[unknown] || 0) + 1
      }
    })

    // Sort by date (newest first) and take top 6
    const entries = Object.entries(dateCounts)
    entries.sort((a, b) => {
      // Sort "Không xác định" to the end
      if (a[0] === "Không xác định") return 1
      if (b[0] === "Không xác định") return -1
      
      // Extract month and year for sorting
      const aMatch = a[0].match(/Tháng (\d+)\/(\d+)/)
      const bMatch = b[0].match(/Tháng (\d+)\/(\d+)/)
      
      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[2])
        const aMonth = parseInt(aMatch[1])
        const bYear = parseInt(bMatch[2])
        const bMonth = parseInt(bMatch[1])
        
        if (aYear !== bYear) return bYear - aYear
        return bMonth - aMonth
      }
      return 0
    })

    // Take top 6 months, group the rest as "Khác"
    const topEntries = entries.slice(0, 6)
    const otherCount = entries.slice(6).reduce((sum, [, count]) => sum + count, 0)
    
    const result = topEntries.map(([name, value], index) => ({
      name: name || "Không xác định",
      value,
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }))

    if (otherCount > 0) {
      result.push({
        name: "Khác",
        value: otherCount,
        fill: PIE_COLORS[result.length % PIE_COLORS.length],
      })
    }

    return result
  }, [accountsData])

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Bảng điều khiển</h1>
              <p className="text-gray-500 mt-1">
                Theo dõi tổng quan hoạt động hệ thống theo thời gian thực
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">Tổng người dùng:</span>
                <span className="text-lg font-bold text-blue-600">
                  {(totalAccounts || dashboard.metrics.totalUsers).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <label htmlFor="startDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Từ ngày
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="w-full min-w-[180px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                max={filters.endDate || undefined}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="endDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Đến ngày
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="w-full min-w-[180px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                min={filters.startDate || undefined}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="submit" 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
            >
              <Filter className="h-4 w-4" />
              Áp dụng
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleResetFilters}
              className="border-gray-300 hover:bg-gray-50"
            >
              Đặt lại
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-4 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className={`group relative overflow-hidden border-0 bg-gradient-to-br ${card.bgGradient} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
            onClick={() => handleOpenModal(card.key)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-700">{card.title}</CardTitle>
              <div className={`${card.iconBg} rounded-lg p-2 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                      {card.value.toLocaleString("vi-VN")}
                    </div>
                    <ArrowUpRight className={`h-4 w-4 ${card.iconColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{card.description}</p>
                </>
              )}
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </Card>
        ))}
      </div>


      {/* Recent Activities */}
      <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Hoạt động gần đây</CardTitle>
              <CardDescription className="mt-1">
                Các thao tác gần nhất được thực hiện bởi quản trị viên và người dùng
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Login Statistics Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LogIn className="h-5 w-5 text-amber-600" />
              Thống kê tài khoản đăng ký mới
            </h3>
            {accountsLoading || !accountsData ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...
              </div>
            ) : !accountsData.accounts || accountsData.accounts.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                <LogIn className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Không có dữ liệu đăng nhập.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700">Thời gian</TableHead>
                      <TableHead className="font-semibold text-gray-700">Người dùng</TableHead>
                      <TableHead className="font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="font-semibold text-gray-700">Vai trò</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsData.accounts
                      .filter((account) => account.lastLogin)
                      .sort((a, b) => {
                        const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
                        const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
                        return dateB - dateA
                      })
                      .slice(0, 10)
                      .map((account, index) => {
                        const formatTime = (dateStr: string | undefined) => {
                          if (!dateStr) return "--"
                          try {
                            const date = new Date(dateStr)
                            if (isNaN(date.getTime())) return dateStr
                            return date.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false
                            })
                          } catch {
                            return dateStr
                          }
                        }
                        
                        return (
                          <TableRow 
                            key={account.id ?? account.email ?? index}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <TableCell className="text-gray-600 text-sm font-medium">
                              {formatTime(account.lastLogin)}
                            </TableCell>
                            <TableCell className="text-gray-900 font-semibold">
                              {account.fullName || "Không xác định"}
                            </TableCell>
                            <TableCell className="text-gray-600">{account.email}</TableCell>
                            <TableCell>
                              {(() => {
                                const roles = account.role
                                if (!roles) return <span className="text-gray-400">--</span>
                                if (Array.isArray(roles)) {
                                  return roles.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {roles.map((r, idx) => {
                                        const colors = getRoleColor(r)
                                        return (
                                          <Badge 
                                            key={idx}
                                            variant="outline" 
                                            className={`${colors.bg} ${colors.text} ${colors.border}`}
                                          >
                                            {r}
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">--</span>
                                  )
                                }
                                const colors = getRoleColor(roles)
                                return (
                                  <Badge 
                                    variant="outline" 
                                    className={`${colors.bg} ${colors.text} ${colors.border}`}
                                  >
                                    {roles}
                                  </Badge>
                                )
                              })()}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${
                selectedMetric === "totalOrders" 
                  ? "from-emerald-500 to-emerald-600" 
                  : "from-blue-500 to-blue-600"
              }`}>
                {selectedMetric === "totalOrders" ? (
                  <ShoppingCart className="h-5 w-5 text-white" />
                ) : (
                  <Users className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl text-gray-900">
                  Chi tiết - {statCards.find((card) => card.key === selectedMetric)?.title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-base">
                  {selectedMetric === "totalOrders" 
                    ? "Danh sách đơn hàng trong khoảng thời gian được chọn"
                    : "Danh sách tài khoản liên quan trong khoảng thời gian được chọn"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedMetric === "totalOrders" ? (
            <>
              {ordersError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{ordersError}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700">ID</TableHead>
                      <TableHead className="font-semibold text-gray-700">Khách hàng</TableHead>
                      <TableHead className="font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tổng tiền</TableHead>
                      <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                            <span className="text-sm text-gray-500 font-medium">Đang tải danh sách đơn hàng...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : ordersData && ordersData.orders.length > 0 ? (
                      (() => {
                        console.log("🎨 [Dashboard] Rendering orders table with data:", ordersData.orders)
                        return ordersData.orders.map((order, idx) => {
                          console.log(`🎨 [Dashboard] Rendering order ${idx}:`, order)
                          console.log(`🎨 [Dashboard] Order ${idx} - customerName:`, order.customerName)
                          console.log(`🎨 [Dashboard] Order ${idx} - customerEmail:`, order.customerEmail)
                          console.log(`🎨 [Dashboard] Order ${idx} - totalAmount:`, order.totalAmount)
                          
                          return (
                            <TableRow 
                              key={order.id ?? order.orderId ?? idx}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <TableCell className="font-semibold text-gray-900">
                                #{order.id ?? order.orderId ?? "--"}
                              </TableCell>
                              <TableCell className="text-gray-900 font-medium">
                                {order.customerName || "Không xác định"}
                              </TableCell>
                              <TableCell className="text-gray-600">{order.customerEmail || "--"}</TableCell>
                              <TableCell className="text-gray-900 font-semibold">
                                {order.totalAmount 
                                  ? new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(order.totalAmount)
                                  : "--"}
                              </TableCell>
                              <TableCell>
                                {order.status ? (
                                  <Badge 
                                    className={
                                      order.status.toLowerCase() === "completed" || order.status.toLowerCase() === "success"
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                        : order.status.toLowerCase() === "pending"
                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                                        : "bg-gray-100 text-gray-700"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">--</span>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 text-sm font-medium">
                                {order.createdAt || "--"}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })()
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <ShoppingCart className="h-12 w-12 text-gray-300" />
                            <span className="text-sm text-gray-500 font-medium">Không có đơn hàng nào phù hợp.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{ordersData?.totalElements ?? 0}</span> đơn hàng · 
                  Trang <span className="font-semibold text-gray-900">{ordersPage + 1}</span> / 
                  <span className="font-semibold text-gray-900"> {ordersData?.totalPages ?? 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={ordersPage === 0 || ordersLoading}
                    onClick={() => handleChangeOrdersPage(ordersPage - 1)}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      ordersLoading ||
                      !ordersData ||
                      ordersPage >= (ordersData.totalPages ?? 1) - 1
                    }
                    onClick={() => handleChangeOrdersPage(ordersPage + 1)}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {accountsError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{accountsError}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700">Họ tên</TableHead>
                      <TableHead className="font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="font-semibold text-gray-700">Vai trò</TableHead>
                      <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Lần đăng nhập cuối</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-500 font-medium">Đang tải danh sách tài khoản...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : accountsData && accountsData.accounts.length > 0 ? (
                      accountsData.accounts.map((account) => (
                        <TableRow 
                          key={account.id ?? account.email}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="font-semibold text-gray-900">
                            {account.fullName || "Không xác định"}
                          </TableCell>
                          <TableCell className="text-gray-600">{account.email}</TableCell>
                          <TableCell>
                            {(() => {
                              const roles = account.role
                              if (!roles) return <span className="text-gray-400">--</span>
                              if (Array.isArray(roles)) {
                                return roles.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {roles.map((r, idx) => {
                                      const colors = getRoleColor(r)
                                      return (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className={`${colors.bg} ${colors.text} ${colors.border}`}
                                        >
                                          {r}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">--</span>
                                )
                              }
                              const colors = getRoleColor(roles)
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`${colors.bg} ${colors.text} ${colors.border}`}
                                >
                                  {roles}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            {account.status ? (
                              account.status.toLowerCase() === "active" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                  {account.status}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {account.status}
                                </Badge>
                              )
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm font-medium">
                            {account.createdAt || "--"}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm font-medium">
                            {account.lastLogin || "--"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Users className="h-12 w-12 text-gray-300" />
                            <span className="text-sm text-gray-500 font-medium">Không có tài khoản nào phù hợp.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{accountsData?.totalElements ?? 0}</span> tài khoản · 
                  Trang <span className="font-semibold text-gray-900">{accountsPage + 1}</span> / 
                  <span className="font-semibold text-gray-900"> {accountsData?.totalPages ?? 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={accountsPage === 0 || accountsLoading}
                    onClick={() => handleChangeAccountsPage(accountsPage - 1)}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      accountsLoading ||
                      !accountsData ||
                      accountsPage >= (accountsData.totalPages ?? 1) - 1
                    }
                    onClick={() => handleChangeAccountsPage(accountsPage + 1)}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
