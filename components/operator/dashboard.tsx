"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { 
  Film, 
  Calendar, 
  DoorOpen, 
  Newspaper, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  AlertTriangle,
  Users,
  Info,
  Flame
} from "lucide-react"
import { apiClient } from "@/src/api/interceptor"

interface MovieStats {
  total: number
  playing: number
  upcoming: number
  ended: number
}

interface ShowtimeStats {
  today: number
  thisWeek: number
  upcoming: number
  total: number
}

interface RoomStats {
  total: number
  active: number
  inactive: number
}

interface NewsStats {
  total: number
  published: number
  draft: number
}

interface TodayShowtime {
  id: number
  movieName: string
  roomName: string
  startTime: string
  endTime: string
  status: "upcoming" | "playing" | "ended"
  occupancyRate?: number
  soldTickets?: number
  totalCapacity?: number
}

interface PlayingMovie {
  id: number
  name: string
  posterUrl: string
  showtimeCount: number
  status: "PLAYING" | "UPCOMING" | "ENDED"
}

interface HotMovie {
  id: number
  name: string
  posterUrl?: string
  bookingCount: number
  showtimeCount: number
}

interface Alert {
  type: "warning" | "error" | "info"
  message: string
  action?: () => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [movieStats, setMovieStats] = useState<MovieStats>({ total: 0, playing: 0, upcoming: 0, ended: 0 })
  const [showtimeStats, setShowtimeStats] = useState<ShowtimeStats>({ today: 0, thisWeek: 0, upcoming: 0, total: 0 })
  const [roomStats, setRoomStats] = useState<RoomStats>({ total: 0, active: 0, inactive: 0 })
  const [newsStats, setNewsStats] = useState<NewsStats>({ total: 0, published: 0, draft: 0 })
  const [todayShowtimes, setTodayShowtimes] = useState<TodayShowtime[]>([])
  const [playingMovies, setPlayingMovies] = useState<PlayingMovie[]>([])
  const [hotMovies, setHotMovies] = useState<HotMovie[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [roomsWithoutShowtime, setRoomsWithoutShowtime] = useState<number>(0)
  const [upcomingMoviesEnding, setUpcomingMoviesEnding] = useState<number>(0)

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 5 minutes for real-time updates
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Call the new operation dashboard API
      const response = await apiClient.get("/dashboard/operation")
      
      console.log("Full API response:", response)
      console.log("Response data:", response.data)
      
      // Backend returns: { status: 200, message: "...", data: OperationDashboardStatsResponse }
      const data = response.data?.data || {}
      
      console.log("Dashboard data:", data)
      console.log("Movie stats from API:", data.movieStats)
      console.log("Movie stats total:", data.movieStats?.total)

      // Map movie stats
      if (data.movieStats) {
        const stats = {
          total: Number(data.movieStats.total) ?? 0,
          playing: Number(data.movieStats.playing) ?? 0,
          upcoming: Number(data.movieStats.upcoming) ?? 0,
          ended: Number(data.movieStats.ended) ?? 0,
        }
        console.log("Mapped movie stats:", stats)
        setMovieStats(stats)
      } else {
        console.warn("No movieStats in response, setting defaults")
        setMovieStats({ total: 0, playing: 0, upcoming: 0, ended: 0 })
      }

      // Map showtime stats
      if (data.showtimeStats) {
        setShowtimeStats({
          today: Number(data.showtimeStats.today) || 0,
          thisWeek: Number(data.showtimeStats.thisWeek) || 0,
          upcoming: Number(data.showtimeStats.upcoming) || 0,
          total: Number(data.showtimeStats.total) || 0,
        })
      }

      // Map room stats
      if (data.roomStats) {
        setRoomStats({
          total: Number(data.roomStats.total) || 0,
          active: Number(data.roomStats.active) || 0,
          inactive: Number(data.roomStats.inactive) || 0,
        })
      }

      // Map today's showtimes
      if (data.todayShowtimes) {
        const todayShowtimesData: TodayShowtime[] = data.todayShowtimes.map((s: any) => ({
          id: s.id || 0,
              movieName: s.movieName || "N/A",
              roomName: s.roomName || "N/A",
          startTime: s.startTime || "",
          endTime: s.endTime || "",
          status: s.status?.toLowerCase() || "upcoming",
          occupancyRate: s.occupancyRate || undefined,
          soldTickets: s.soldTickets || undefined,
          totalCapacity: s.totalCapacity || undefined,
        }))
        setTodayShowtimes(todayShowtimesData)
      }

      // Map playing movies
      if (data.playingMovies) {
        const playingMoviesData: PlayingMovie[] = data.playingMovies.map((m: any) => ({
          id: m.id || 0,
          name: m.name || "",
          posterUrl: m.posterUrl || "",
          showtimeCount: Number(m.showtimeCount) || 0,
          status: m.status || "PLAYING",
        }))
        setPlayingMovies(playingMoviesData)
      }

      // Map hot movies
      if (data.hotMovies) {
        const hotMoviesData: HotMovie[] = data.hotMovies.map((m: any) => ({
          id: m.id || 0,
          name: m.name || "",
          posterUrl: m.posterUrl || undefined,
          bookingCount: Number(m.bookingCount) || 0,
          showtimeCount: Number(m.showtimeCount) || 0,
        }))
        setHotMovies(hotMoviesData)
      }

      // Map insights
      if (data.insights) {
        setUpcomingMoviesEnding(Number(data.insights.upcomingMoviesEnding) || 0)
        setRoomsWithoutShowtime(Number(data.insights.roomsWithoutShowtime) || 0)
      }

      // Map alerts with action handlers
      if (data.alerts) {
        const alertsData: Alert[] = data.alerts.map((alert: any) => {
          const alertObj: Alert = {
            type: alert.type || "info",
            message: alert.message || "",
          }

          // Add action handlers based on alert type
          if (alert.message?.includes("phim sắp kết thúc")) {
            alertObj.action = () => router.push("/operator-manager/movies/add")
          } else if (alert.message?.includes("phòng") || alert.message?.includes("lịch chiếu")) {
            alertObj.action = () => router.push("/operator-manager/showtimes")
          } else if (alert.message?.includes("phim sắp chiếu")) {
            alertObj.action = () => router.push("/operator-manager/showtimes")
          }

          return alertObj
        })
        setAlerts(alertsData)
      }

      // News stats (mock data for now - can be added to backend later)
      setNewsStats({ total: 12, published: 8, draft: 4 })

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Fallback to empty states on error
      setMovieStats({ total: 0, playing: 0, upcoming: 0, ended: 0 })
      setShowtimeStats({ today: 0, thisWeek: 0, upcoming: 0, total: 0 })
      setRoomStats({ total: 0, active: 0, inactive: 0 })
      setTodayShowtimes([])
      setPlayingMovies([])
      setHotMovies([])
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  // These functions are no longer needed as data comes from backend API
  // Keeping for backward compatibility if needed

  const movieChartData = [
    { name: "Đang chiếu", value: movieStats?.playing || 0 },
    { name: "Sắp chiếu", value: movieStats?.upcoming || 0 },
    { name: "Đã kết thúc", value: movieStats?.ended || 0 },
  ]

  const showtimeChartData = [
    { name: "Hôm nay", value: showtimeStats.today },
    { name: "Tuần này", value: showtimeStats.thisWeek },
    { name: "Sắp tới", value: showtimeStats.upcoming },
  ]

  const roomChartData = [
    { name: "Hoạt động", value: roomStats.active },
    { name: "Không hoạt động", value: roomStats.inactive },
  ]

  const summaryCards = [
    {
      title: "Tổng số phim",
      value: movieStats?.total?.toString() || "0",
      change: `${movieStats?.playing || 0} đang chiếu`,
      icon: Film,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      href: "/operator-manager/movies",
    },
    {
      title: "Tổng số lịch chiếu",
      value: showtimeStats.total.toString(),
      change: `${showtimeStats.today} suất hôm nay`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      href: "/operator-manager/showtimes",
    },
    {
      title: "Tổng số phòng",
      value: roomStats.total.toString(),
      change: `${roomStats.active} đang hoạt động`,
      icon: DoorOpen,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      href: "/operator-manager/rooms",
    },
    {
      title: "Tổng số tin tức",
      value: newsStats.total.toString(),
      change: `${newsStats.published} đã xuất bản`,
      icon: Newspaper,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      href: "/operator-manager/news",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
      case "UPCOMING":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sắp tới</Badge>
      case "playing":
      case "PLAYING":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đang chiếu</Badge>
      case "ended":
      case "ENDED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Đã kết thúc</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Quản lý Vận hành</h1>
          <p className="text-muted-foreground mt-2">Tổng quan về hoạt động rạp chiếu phim</p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Card 
              key={index} 
              className={`bg-card border-l-4 ${
                alert.type === "error" ? "border-red-500" :
                alert.type === "warning" ? "border-yellow-500" :
                "border-blue-500"
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {alert.type === "error" ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  ) : alert.type === "warning" ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  </div>
                  {alert.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={alert.action}
                    >
                      Xử lý
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card 
              key={index} 
              className="bg-card hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-card-foreground mb-1">{card.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {card.change}
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movie Status Chart */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Film className="h-5 w-5 text-blue-600" />
              Phân bổ Phim (Năm {new Date().getFullYear()})
            </CardTitle>
            <CardDescription>Thống kê phim theo trạng thái trong năm nay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {movieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đang chiếu:</span>
                <span className="font-medium">{movieStats?.playing || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sắp chiếu:</span>
                <span className="font-medium">{movieStats?.upcoming || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đã kết thúc:</span>
                <span className="font-medium">{movieStats?.ended || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Showtime Chart */}
      <Card className="bg-card">
        <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Lịch chiếu
            </CardTitle>
            <CardDescription>Thống kê lịch chiếu</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={showtimeChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                    dataKey="name" 
                  className="text-muted-foreground"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  className="text-muted-foreground"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hôm nay:</span>
                <span className="font-medium">{showtimeStats.today} suất</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tuần này:</span>
                <span className="font-medium">{showtimeStats.thisWeek} suất</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sắp tới:</span>
                <span className="font-medium">{showtimeStats.upcoming} suất</span>
              </div>
          </div>
        </CardContent>
      </Card>

        {/* Room Status Chart */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-green-600" />
              Trạng thái Phòng
            </CardTitle>
            <CardDescription>Phân bổ phòng chiếu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index + 1 % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hoạt động:</span>
                <span className="font-medium text-green-600">{roomStats.active}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Không hoạt động:</span>
                <span className="font-medium text-gray-600">{roomStats.inactive}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hot Movies This Week */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Phim Hot trong Tuần
              </CardTitle>
              <CardDescription>Top phim có nhiều người đặt nhất trong tuần này</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/operator-manager/movies")}
            >
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent>
            {hotMovies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Phim</TableHead>
                  <TableHead className="text-center">Số suất chiếu</TableHead>
                  <TableHead className="text-right">Số lượt đặt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotMovies.map((movie, index) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Flame className="h-4 w-4 text-orange-600" />}
                        <span>{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{movie.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {movie.showtimeCount} suất
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-green-600">{movie.bookingCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/operator-manager/movies/${movie.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có dữ liệu phim hot trong tuần này</p>
                <p className="text-xs mt-2">Dữ liệu sẽ được cập nhật khi có bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Today's Showtimes and Playing Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Showtimes */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Lịch chiếu hôm nay
              </CardTitle>
              <CardDescription>Danh sách các suất chiếu trong ngày</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/operator-manager/showtimes")}
            >
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent>
            {todayShowtimes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Phim</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    {todayShowtimes.some(s => s.occupancyRate !== undefined) && (
                      <TableHead className="text-right">Tỷ lệ lấp đầy</TableHead>
                    )}
                </TableRow>
              </TableHeader>
              <TableBody>
                  {todayShowtimes.map((showtime) => (
                    <TableRow key={showtime.id}>
                      <TableCell className="font-medium">{showtime.movieName}</TableCell>
                      <TableCell>{showtime.roomName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {showtime.startTime} - {showtime.endTime}
                      </TableCell>
                      <TableCell>{getStatusBadge(showtime.status)}</TableCell>
                      {showtime.occupancyRate !== undefined && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {showtime.occupancyRate?.toFixed(0)}%
                            </span>
                            {showtime.occupancyRate !== undefined && showtime.totalCapacity && (
                              <span className="text-xs text-muted-foreground">
                                ({showtime.soldTickets}/{showtime.totalCapacity})
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không có suất chiếu nào hôm nay</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/operator-manager/showtimes")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo lịch chiếu mới
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Playing Movies */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Phim đang chiếu
              </CardTitle>
              <CardDescription>Danh sách phim hiện đang được chiếu</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/operator-manager/movies")}
            >
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent>
            {playingMovies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Phim</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {playingMovies.map((movie) => (
                    <TableRow key={movie.id}>
                      <TableCell className="font-medium">{movie.name}</TableCell>
                      <TableCell>{getStatusBadge(movie.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/operator-manager/movies/${movie.id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không có phim nào đang chiếu</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/operator-manager/movies/add")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm phim mới
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Insights */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Thông tin Vận hành
          </CardTitle>
          <CardDescription>Thống kê quan trọng để quản lý hiệu quả</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Cảnh báo</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                {upcomingMoviesEnding > 0 
                  ? `${upcomingMoviesEnding} phim sắp kết thúc` 
                  : "Tất cả phim đang chiếu ổn định"}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Sử dụng phòng</span>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                {roomsWithoutShowtime > 0
                  ? `${roomsWithoutShowtime} phòng chưa có lịch hôm nay`
                  : "Tất cả phòng đã có lịch chiếu"}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Lịch chiếu hôm nay</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                {showtimeStats.today} suất chiếu đã được lên lịch
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Lưu ý:</strong> Dashboard này giúp bạn:
              <br />• Theo dõi tình trạng phim để chuẩn bị phim thay thế kịp thời
              <br />• Đảm bảo tất cả phòng hoạt động đều có lịch chiếu để tối ưu doanh thu
              <br />• Quản lý lịch chiếu hôm nay để xử lý các vấn đề phát sinh
              <br />• Phát hiện phim sắp chiếu chưa có lịch để tránh thiếu sót
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Thao tác nhanh</CardTitle>
          <CardDescription>Các chức năng quản lý thường dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/operator-manager/movies/add")}
            >
              <Plus className="h-6 w-6 text-blue-600" />
              <span>Thêm phim mới</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/operator-manager/showtimes")}
            >
              <Calendar className="h-6 w-6 text-purple-600" />
              <span>Tạo lịch chiếu</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/operator-manager/rooms")}
            >
              <DoorOpen className="h-6 w-6 text-green-600" />
              <span>Quản lý phòng</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/operator-manager/news")}
            >
              <Newspaper className="h-6 w-6 text-orange-600" />
              <span>Đăng tin tức</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
