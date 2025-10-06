"use client"

import { Card } from "@/components/ui/card"
import { Film, Calendar, TrendingUp, DollarSign, Clock, Ticket } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export function Dashboard() {
  const stats = {
    totalMovies: 48,
    upcomingMovies: 12,
    nowShowing: 8,
    totalShowtimes: 156,
    todayShowtimes: 24,
    totalRooms: 12,
    occupancyRate: 78,
    todayRevenue: 45600000,
  }

  // Revenue data for the last 7 days
  const revenueData = [
    { day: "T2", revenue: 32.5, showtimes: 18 },
    { day: "T3", revenue: 28.3, showtimes: 16 },
    { day: "T4", revenue: 35.7, showtimes: 20 },
    { day: "T5", revenue: 42.1, showtimes: 22 },
    { day: "T6", revenue: 51.8, showtimes: 28 },
    { day: "T7", revenue: 68.4, showtimes: 32 },
    { day: "CN", revenue: 72.9, showtimes: 35 },
  ]

  // Movie status distribution
  const movieStatusData = [
    { name: "Sắp chiếu", value: 12, color: "#10b981" },
    { name: "Đang chiếu", value: 8, color: "#009CFF" },
    { name: "Đã kết thúc", value: 28, color: "#94a3b8" },
  ]

  // Room occupancy by time slot
  const occupancyByTimeData = [
    { time: "9h-12h", occupancy: 45 },
    { time: "12h-15h", occupancy: 62 },
    { time: "15h-18h", occupancy: 78 },
    { time: "18h-21h", occupancy: 92 },
    { time: "21h-24h", occupancy: 85 },
  ]

  // Top performing movies
  const topMoviesData = [
    { title: "Spider-Man", revenue: 125, showtimes: 45 },
    { title: "Top Gun", revenue: 102, showtimes: 38 },
    { title: "Avatar", revenue: 98, showtimes: 35 },
    { title: "Parasite", revenue: 89, showtimes: 32 },
    { title: "Inception", revenue: 76, showtimes: 28 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động rạp chiếu phim</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Movies */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              +{stats.upcomingMovies} sắp chiếu
            </span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{stats.totalMovies}</h3>
          <p className="text-sm text-muted-foreground">Tổng số phim</p>
          <p className="text-xs text-muted-foreground mt-2">{stats.nowShowing} đang chiếu</p>
        </Card>

        {/* Showtimes */}
        <Card className="p-6 bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-chart-3" />
            </div>
            <span className="text-xs font-medium text-chart-3 bg-chart-3/10 px-2 py-1 rounded-full">
              {stats.todayShowtimes} hôm nay
            </span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{stats.totalShowtimes}</h3>
          <p className="text-sm text-muted-foreground">Suất chiếu tuần này</p>
          <p className="text-xs text-muted-foreground mt-2">Trung bình {Math.round(stats.totalShowtimes / 7)}/ngày</p>
        </Card>

        {/* Occupancy Rate */}
        <Card className="p-6 bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-chart-4/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-chart-4" />
            </div>
            <span className="text-xs font-medium text-chart-4 bg-chart-4/10 px-2 py-1 rounded-full">+5.2%</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{stats.occupancyRate}%</h3>
          <p className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</p>
          <p className="text-xs text-muted-foreground mt-2">{stats.totalRooms} phòng chiếu</p>
        </Card>

        {/* Revenue */}
        <Card className="p-6 bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-chart-2" />
            </div>
            <span className="text-xs font-medium text-chart-2 bg-chart-2/10 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{(stats.todayRevenue / 1000000).toFixed(1)}M</h3>
          <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
          <p className="text-xs text-muted-foreground mt-2">VND</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Doanh thu 7 ngày qua</h2>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
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
              <Line type="monotone" dataKey="revenue" stroke="#009CFF" strokeWidth={3} name="Doanh thu (triệu VND)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Movie Status Distribution */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Phân bổ trạng thái phim</h2>
            <Film className="w-5 h-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={movieStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {movieStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy by Time Slot */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Tỷ lệ lấp đầy theo khung giờ</h2>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyByTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="occupancy" fill="#10b981" name="Tỷ lệ lấp đầy (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Performing Movies */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Top 5 phim doanh thu cao</h2>
            <Ticket className="w-5 h-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMoviesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="title" type="category" stroke="#64748b" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#009CFF" name="Doanh thu (triệu VND)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
