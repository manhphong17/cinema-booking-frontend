"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, Building2, Ticket, TrendingUp } from "lucide-react"

type TimeFilter = "today" | "week" | "month" | "custom"

export function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today")

  const getStatsData = (filter: TimeFilter) => {
    const baseData = {
      today: {
        revenue: "$8,450",
        revenueChange: "+5.2% from yesterday",
        orders: "142",
        ordersChange: "+12 from yesterday",
        tickets: "284",
        ticketsChange: "+18 from yesterday",
        occupancy: "67%",
        occupancyChange: "+3% from yesterday",
      },
      week: {
        revenue: "$52,340",
        revenueChange: "+8.1% from last week",
        orders: "1,089",
        ordersChange: "+156 from last week",
        tickets: "2,178",
        ticketsChange: "+312 from last week",
        occupancy: "72%",
        occupancyChange: "+5% from last week",
      },
      month: {
        revenue: "$225,680",
        revenueChange: "+12.3% from last month",
        orders: "4,567",
        ordersChange: "+623 from last month",
        tickets: "9,134",
        ticketsChange: "+1,245 from last month",
        occupancy: "69%",
        occupancyChange: "+2% from last month",
      },
      custom: {
        revenue: "$125,430",
        revenueChange: "+10% from period",
        orders: "2,456",
        ordersChange: "+345 from period",
        tickets: "4,912",
        ticketsChange: "+678 from period",
        occupancy: "71%",
        occupancyChange: "+4% from period",
      },
    }
    return baseData[filter]
  }

  const getChartData = (filter: TimeFilter) => {
    const chartData = {
      today: [
        { time: "9AM", revenue: 450 },
        { time: "11AM", revenue: 680 },
        { time: "1PM", revenue: 920 },
        { time: "3PM", revenue: 1240 },
        { time: "5PM", revenue: 1680 },
        { time: "7PM", revenue: 2150 },
        { time: "9PM", revenue: 2890 },
        { time: "11PM", revenue: 3200 },
      ],
      week: [
        { time: "Mon", revenue: 6800 },
        { time: "Tue", revenue: 7200 },
        { time: "Wed", revenue: 5900 },
        { time: "Thu", revenue: 8100 },
        { time: "Fri", revenue: 9500 },
        { time: "Sat", revenue: 12400 },
        { time: "Sun", revenue: 11200 },
      ],
      month: [
        { time: "Week 1", revenue: 45600 },
        { time: "Week 2", revenue: 52300 },
        { time: "Week 3", revenue: 48900 },
        { time: "Week 4", revenue: 58200 },
      ],
      custom: [
        { time: "Jan", revenue: 42000 },
        { time: "Feb", revenue: 38000 },
        { time: "Mar", revenue: 45000 },
        { time: "Apr", revenue: 52000 },
        { time: "May", revenue: 48000 },
      ],
    }
    return chartData[filter]
  }

  const statsData = getStatsData(timeFilter)
  const chartData = getChartData(timeFilter)

  const summaryCards = [
    {
      title: "Revenue",
      value: statsData.revenue,
      change: statsData.revenueChange,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Orders",
      value: statsData.orders,
      change: statsData.ordersChange,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Tickets Sold",
      value: statsData.tickets,
      change: statsData.ticketsChange,
      icon: Ticket,
      color: "text-purple-600",
    },
    {
      title: "Occupancy Rate",
      value: statsData.occupancy,
      change: statsData.occupancyChange,
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  const topMovies = [
    { rank: 1, title: "Spider-Man: No Way Home", revenue: "$45,230", tickets: 892 },
    { rank: 2, title: "Avatar: The Way of Water", revenue: "$38,450", tickets: 756 },
    { rank: 3, title: "Top Gun: Maverick", revenue: "$32,180", tickets: 634 },
    { rank: 4, title: "Black Panther: Wakanda Forever", revenue: "$28,920", tickets: 567 },
    { rank: 5, title: "Doctor Strange 2", revenue: "$24,680", tickets: 485 },
  ]

  const topCombos = [
    { rank: 1, name: "Large Popcorn + Soda", orders: 456, revenue: "$6,840" },
    { rank: 2, name: "Family Pack", orders: 234, revenue: "$4,680" },
    { rank: 3, name: "Nachos + Drink", orders: 189, revenue: "$2,835" },
    { rank: 4, name: "Candy + Soda", orders: 167, revenue: "$2,505" },
    { rank: 5, name: "Premium Snack Box", orders: 123, revenue: "$2,460" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cinema Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor your cinema performance and analytics</p>
        </div>
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom">Custom Period</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Revenue Trend</CardTitle>
          <CardDescription>Revenue performance over selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="time"
                  className="text-muted-foreground"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  className="text-muted-foreground"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Movies</CardTitle>
            <CardDescription>Best performing movies by revenue and tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Movie</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMovies.map((movie) => (
                  <TableRow key={movie.rank}>
                    <TableCell className="font-medium">{movie.rank}</TableCell>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{movie.revenue}</TableCell>
                    <TableCell className="text-right">{movie.tickets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Combos</CardTitle>
            <CardDescription>Best selling food combos by orders and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Combo</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCombos.map((combo) => (
                  <TableRow key={combo.rank}>
                    <TableCell className="font-medium">{combo.rank}</TableCell>
                    <TableCell className="font-medium">{combo.name}</TableCell>
                    <TableCell className="text-right">{combo.orders}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{combo.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
