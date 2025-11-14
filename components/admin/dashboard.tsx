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
  type AccountListResponse,
  type DashboardResponse,
} from "@/app/api/admin/dashboard"

type MetricKey = "totalUsers" | "newUsers" | "totalLogins" | "activeSessions"

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
    setAccountsPage(0)
    fetchAccountsData({
      start: appliedFilters.startDate,
      end: appliedFilters.endDate,
      page: 0,
    })
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

  const statCards = useMemo(
    () => [
      {
        key: "totalUsers" as MetricKey,
        title: "Tổng người dùng",
        icon: Users,
        color: "text-blue-600",
        value: dashboard.metrics.totalUsers,
        description: "Tổng số tài khoản trong hệ thống",
      },
      {
        key: "newUsers" as MetricKey,
        title: "Người dùng mới",
        icon: UserPlus,
        color: "text-green-600",
        value: dashboard.metrics.newUsers,
        description: "Số tài khoản mới trong khoảng thời gian",
      },
      {
        key: "activeSessions" as MetricKey,
        title: "Phiên hoạt động",
        icon: Activity,
        color: "text-purple-600",
        value: dashboard.metrics.activeSessions,
        description: "Người dùng đang hoạt động",
      },
      {
        key: "totalLogins" as MetricKey,
        title: "Lượt đăng nhập",
        icon: LogIn,
        color: "text-orange-600",
        value: dashboard.metrics.totalLogins,
        description: "Tổng lượt đăng nhập",
      },
    ],
    [dashboard.metrics]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="text-gray-600 mt-2">
            Theo dõi tổng quan hoạt động hệ thống theo thời gian thực
          </p>
        </div>

        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:flex sm:items-end gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="startDate" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                className="w-full min-w-[200px]"
                max={filters.endDate || undefined}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="endDate" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                className="w-full min-w-[200px]"
                min={filters.startDate || undefined}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Áp dụng
            </Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className="bg-white border-blue-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleOpenModal(card.key)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString("vi-VN")}
                  </div>
                  <p className="text-xs text-gray-600">{card.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Activity Chart */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Hoạt động người dùng</CardTitle>
          <CardDescription>
            Thống kê đăng ký mới, lượt đăng nhập và phiên hoạt động trong 7 ngày gần nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang tải dữ liệu biểu đồ...
            </div>
          ) : dashboard.activity.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-12">
              Không có dữ liệu biểu đồ trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dashboard.activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="logins"
                  name="Đăng nhập"
                  fill="#1d4ed8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="activeSessions"
                  name="Phiên hoạt động"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="newUsers"
                  name="Đăng ký mới"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Hoạt động gần đây</CardTitle>
          <CardDescription>
            Các thao tác gần nhất được thực hiện bởi quản trị viên và người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải hoạt động gần đây...
            </div>
          ) : dashboard.recentActivities.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">
              Không có hoạt động nào trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentActivities.map((activity) => (
                  <TableRow key={activity.id ?? activity.timestamp}>
                    <TableCell className="text-gray-600 text-sm">
                      {activity.timestamp || "--"}
                    </TableCell>
                    <TableCell className="text-gray-900">{activity.user || "Không xác định"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.action || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{activity.detail || "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết tài khoản - {statCards.find((card) => card.key === selectedMetric)?.title}
            </DialogTitle>
            <DialogDescription>
              Danh sách tài khoản liên quan trong khoảng thời gian được chọn
            </DialogDescription>
          </DialogHeader>

          {accountsError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{accountsError}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Lần đăng nhập cuối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách tài khoản...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : accountsData && accountsData.accounts.length > 0 ? (
                  accountsData.accounts.map((account) => (
                    <TableRow key={account.id ?? account.email}>
                      <TableCell className="font-medium text-gray-900">
                        {account.fullName || "Không xác định"}
                      </TableCell>
                      <TableCell className="text-gray-600">{account.email}</TableCell>
                      <TableCell className="text-gray-600">{account.role || "--"}</TableCell>
                      <TableCell>
                        {account.status ? (
                          account.status.toLowerCase() === "active" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              {account.status}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{account.status}</Badge>
                          )
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {account.createdAt || "--"}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {account.lastLogin || "--"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-gray-500">
                      Không có tài khoản nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
            <div>
              Tổng số: {accountsData?.totalElements ?? 0} tài khoản · Trang {accountsPage + 1} / {accountsData?.totalPages ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={accountsPage === 0 || accountsLoading}
                onClick={() => handleChangeAccountsPage(accountsPage - 1)}
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
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
