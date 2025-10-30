"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Database, Server, FileText, AlertCircle, TrendingUp, Activity } from "lucide-react"

const systemHealthData = [
  { service: "API Gateway", status: "Healthy", uptime: "99.9%", requests: 12500 },
  { service: "Database", status: "Healthy", uptime: "99.8%", requests: 8900 },
  { service: "File Storage", status: "Healthy", uptime: "100%", requests: 3200 },
  { service: "Payment Gateway", status: "Warning", uptime: "98.5%", requests: 2100 },
]

const revenueData = [
  { month: "T7", revenue: 125000, tickets: 5230 },
  { month: "CN", revenue: 142000, tickets: 5890 },
  { month: "T2", revenue: 98000, tickets: 4100 },
  { month: "T3", revenue: 115000, tickets: 4800 },
  { month: "T4", revenue: 138000, tickets: 5750 },
  { month: "T5", revenue: 152000, tickets: 6350 },
  { month: "T6", revenue: 165000, tickets: 6900 },
]

const errorLogs = [
  { id: 1, time: "2025-01-15 15:23", type: "Warning", message: "API response time exceeded threshold", severity: "low" },
  { id: 2, time: "2025-01-15 14:15", type: "Error", message: "Database connection timeout", severity: "high" },
  { id: 3, time: "2025-01-15 13:42", type: "Warning", message: "High memory usage detected", severity: "medium" },
  { id: 4, time: "2025-01-15 12:30", type: "Info", message: "Daily backup completed successfully", severity: "info" },
  { id: 5, time: "2025-01-15 11:15", type: "Error", message: "Failed payment processing attempt", severity: "medium" },
]

export function SystemDashboard() {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Comprehensive system monitoring and reporting</p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">All systems running normally</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Requests</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">28,700</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">120ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Health Table */}
      <Card className="bg-card hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-card-foreground">Service Health Status</CardTitle>
          <CardDescription>Real-time monitoring of all system services</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Requests (24h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemHealthData.map((service) => (
                <TableRow key={service.service}>
                  <TableCell className="font-medium text-card-foreground">{service.service}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                      <span className="text-card-foreground">{service.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-card-foreground">{service.uptime}</TableCell>
                  <TableCell className="text-muted-foreground">{service.requests.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="bg-card hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-card-foreground">Weekly Revenue & Tickets</CardTitle>
          <CardDescription>Revenue and ticket sales overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#009CFF" name="Doanh thu (VND)" />
              <Bar dataKey="tickets" fill="#10b981" name="Số vé" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card className="bg-card hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-card-foreground">System Error Logs</CardTitle>
          <CardDescription>Recent system errors and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm">{log.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.type}</Badge>
                  </TableCell>
                  <TableCell className="text-card-foreground">{log.message}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

