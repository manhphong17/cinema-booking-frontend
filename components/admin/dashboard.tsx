"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Users, UserPlus, Activity, LogIn } from "lucide-react"

const userActivityData = [
  { day: "T2", logins: 120, registrations: 8 },
  { day: "T3", logins: 145, registrations: 12 },
  { day: "T4", logins: 132, registrations: 10 },
  { day: "T5", logins: 168, registrations: 15 },
  { day: "T6", logins: 195, registrations: 18 },
  { day: "T7", logins: 220, registrations: 22 },
  { day: "CN", logins: 185, registrations: 14 },
]

const recentActivities = [
  {
    id: 1,
    time: "2025-01-15 14:32",
    user: "admin@cineshow.com",
    action: "Cập nhật thông tin rạp",
    detail: "Thay đổi giờ hoạt động",
  },
  {
    id: 2,
    time: "2025-01-15 13:15",
    user: "manager@cinema.com",
    action: "Tạo suất chiếu mới",
    detail: "Thêm 5 suất chiếu cho phim Spider-Man",
  },
  {
    id: 3,
    time: "2025-01-15 12:45",
    user: "staff@cinema.com",
    action: "Bán vé",
    detail: "Bán 8 vé cho suất chiếu 15:00",
  },
  {
    id: 4,
    time: "2025-01-15 11:20",
    user: "customer@email.com",
    action: "Đặt vé",
    detail: "Đặt 2 vé cho phim Avatar",
  },
  {
    id: 5,
    time: "2025-01-15 10:05",
    user: "manager@cinema.com",
    action: "Cập nhật giá vé",
    detail: "Thay đổi giá vé cuối tuần",
  },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600 mt-2">Tổng quan hoạt động và thống kê hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12,348</div>
            <p className="text-xs text-gray-600">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        {/* New Users Today */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Người dùng mới</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">+56</div>
            <p className="text-xs text-gray-600">Hôm nay (+3.2%)</p>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Phiên hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">120</div>
            <p className="text-xs text-gray-600">Người dùng đang hoạt động</p>
          </CardContent>
        </Card>

        {/* Logins Today */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Đăng nhập hôm nay</CardTitle>
            <LogIn className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">850</div>
            <p className="text-xs text-gray-600">Lần đăng nhập</p>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Chart */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Hoạt động người dùng (7 ngày qua)</CardTitle>
          <CardDescription>Biểu đồ đăng nhập và đăng ký mới</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#009CFF"
                strokeWidth={2}
                name="Đăng nhập"
                dot={{ fill: "#009CFF", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#10b981"
                strokeWidth={2}
                name="Đăng ký mới"
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Hoạt động gần đây</CardTitle>
          <CardDescription>Lịch sử hoạt động mới nhất của hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
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
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-gray-600 text-sm">{activity.time}</TableCell>
                  <TableCell className="text-gray-900">{activity.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{activity.action}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{activity.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
