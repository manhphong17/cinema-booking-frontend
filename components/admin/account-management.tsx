"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, RotateCcw, UserPlus, Shield, Users, Eye, EyeOff } from "lucide-react"

// 🔹 Cập nhật mock data ở trên cùng
const allAccounts = [
  { id: 1, name: "John Smith", email: "john.smith@cinema.com", role: "Admin", status: "active" },
  { id: 2, name: "Sarah Johnson", email: "sarah@cinema.com", role: "Business Manager", status: "active" },
  { id: 3, name: "Mike Wilson", email: "mike@cinema.com", role: "Operator Manager", status: "inactive" },
  { id: 4, name: "Emma Davis", email: "emma@cinema.com", role: "Ticket Staff", status: "active" },
  { id: 5, name: "Tom Brown", email: "tom@cinema.com", role: "Ticket Staff", status: "inactive" },
]

// 🔹 Thống kê role
const totalByRole = {
  admin: allAccounts.filter(a => a.role === "Admin").length,
  business: allAccounts.filter(a => a.role === "Business Manager").length,
  operator: allAccounts.filter(a => a.role === "Operator Manager").length,
  staff: allAccounts.filter(a => a.role === "Ticket Staff").length,
}

// 🔹 Thống kê trạng thái
const totalActive = allAccounts.filter(a => a.status === "active").length
const totalInactive = allAccounts.filter(a => a.status === "inactive").length


const staffAccounts = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@cinema.com",
    role: "Cinema Manager",
    status: "active",
    cinema: "Downtown Cinema",
    lastLogin: "2024-01-15 14:30",
    avatar: "/avatars/john.jpg",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@cinema.com",
    role: "Ticket Staff",
    status: "active",
    cinema: "Mall Cinema",
    lastLogin: "2024-01-15 09:15",
    avatar: "/avatars/sarah.jpg",
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.w@cinema.com",
    role: "Cinema Manager",
    status: "inactive",
    cinema: "Airport Cinema",
    lastLogin: "2024-01-10 16:45",
    avatar: "/avatars/mike.jpg",
  },
  {
    id: 4,
    name: "Emma Davis",
    email: "emma.d@cinema.com",
    role: "Ticket Staff",
    status: "active",
    cinema: "Downtown Cinema",
    lastLogin: "2024-01-15 11:20",
    avatar: "/avatars/emma.jpg",
  },
]

const managerAccounts = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@cinema.com",
    cinema: "Downtown Cinema",
    status: "active",
    staffCount: 8,
    lastLogin: "2024-01-15 14:30",
  },
  {
    id: 2,
    name: "Mike Wilson",
    email: "mike.w@cinema.com",
    cinema: "Airport Cinema",
    status: "inactive",
    staffCount: 6,
    lastLogin: "2024-01-10 16:45",
  },
]

export function AccountManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    showNew: false,
    showConfirm: false,
  })

  const filteredStaff = allAccounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === "all" || acc.role === selectedRole
    const matchesStatus = selectedStatus === "all" || acc.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const handleEditClick = (user: any) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
    setShowPasswordFields(false)
    setPasswordData({
      newPassword: "",
      confirmPassword: "",
      showNew: false,
      showConfirm: false,
    })
  }

  const handleSaveEdit = () => {
    // Handle save logic here
    console.log("Save edited user:", editingUser)
    // You can add API call here
    setIsEditDialogOpen(false)
    setEditingUser(null)
  }

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setPasswordData(prev => ({
      ...prev,
      [field === 'new' ? 'showNew' : 'showConfirm']: !prev[field === 'new' ? 'showNew' : 'showConfirm']
    }))
  }

  const handleDeleteClick = (user: any) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    // Handle delete logic here
    console.log("Delete user:", deletingUser)
    // You can add API call here
    setIsDeleteDialogOpen(false)
    setDeletingUser(null)
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-600 mt-2">Quản lý tài khoản nhân viên và quản lý trên toàn hệ thống</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Tạo tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
              <DialogDescription>Thêm tài khoản nhân viên hoặc quản lý mới</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Họ tên */}
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" placeholder="Nhập họ và tên" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Nhập địa chỉ email" />
              </div>

              {/* Vai trò */}
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Nhân viên bán vé</SelectItem>
                    <SelectItem value="manager">Quản lý rạp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordData.showNew ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() =>
                      setPasswordData({ ...passwordData, showNew: !passwordData.showNew })
                    }
                  >
                    {passwordData.showNew ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={passwordData.showConfirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Nhập lại mật khẩu"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() =>
                      setPasswordData({ ...passwordData, showConfirm: !passwordData.showConfirm })
                    }
                  >
                    {passwordData.showConfirm ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Gợi ý quy tắc mật khẩu */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-xs text-blue-700">
                  • Mật khẩu cần có ít nhất 8 ký tự<br />
                  • Bao gồm chữ hoa, chữ thường và số
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </DialogContent>

        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tổng tài khoản khách hàng */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Khách Hàng
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {
                allAccounts.filter((a) =>
                  ["Customer", "Khách hàng"].includes(a.role)
                ).length || 1203 // tạm giá trị giả định nếu chưa có role Customer
              }
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Bao gồm tất cả người dùng đã đăng ký tài khoản.
            </p>
          </CardContent>
        </Card>

        {/* Tổng tài khoản Ticket Staff */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Nhân Viên Bán Vé
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {allAccounts.filter((a) => a.role === "Ticket Staff").length}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Nhân viên bán vé tại các rạp phim.
            </p>
          </CardContent>
        </Card>

        {/* Tổng tài khoản Manager */}
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Quản Lí
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {
                allAccounts.filter((a) =>
                  ["Business Manager", "Operator Manager"].includes(a.role)
                ).length
              }
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Gồm các Business & Operator Manager.
            </p>
          </CardContent>
        </Card>
      </div>



        {/* Account Management */}
        <div className="space-y-6">
          {/* Filters */}
          <Card className="bg-white border-blue-100 shadow-md">
            <CardContent className="pt-6">
<div className="flex flex-col sm:flex-row gap-4">
  <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
    <Input
      placeholder="Tìm kiếm theo tên hoặc email..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>

  {/* 🔹 Lọc theo Role */}
  <Select value={selectedRole} onValueChange={setSelectedRole}>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="All Roles" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tất cả vai trò</SelectItem>
      <SelectItem value="Admin">Quản trị viên</SelectItem>
      <SelectItem value="Business Manager">Quản lý kinh doanh</SelectItem>
      <SelectItem value="Operator Manager">Quản lý vận hành</SelectItem>
      <SelectItem value="Ticket Staff">Nhân viên bán vé</SelectItem>
    </SelectContent>
  </Select>

  {/* 🔹 Lọc theo Status */}
  <Select defaultValue="all" onValueChange={setSelectedStatus}>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tất cả trạng thái</SelectItem>
      <SelectItem value="active">Đang hoạt động</SelectItem>
      <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
    </SelectContent>
  </Select>
</div>

            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card className="bg-white border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900">Danh sách tài khoản</CardTitle>
              <CardDescription className="text-gray-600">Quản lý tài khoản và quyền truy cập</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                      </TableCell>
                      <TableCell className="text-gray-600">{staff.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(staff.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(staff)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(staff)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-blue-100 shadow-lg sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription className="text-gray-600">
              Cập nhật thông tin và cài đặt người dùng
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-4">
              {/* User Avatar Section */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {editingUser.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">{editingUser.name}</p>
                  <p className="text-gray-600 text-sm">{editingUser.email}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-gray-900 font-medium">Họ và tên</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-gray-900 font-medium">Email (Chỉ đọc)</Label>
                  <Input
                    id="edit-email"
                    value={editingUser.email}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-600">Không thể thay đổi email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-gray-900 font-medium">Vai trò</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Quản trị viên</SelectItem>
                      <SelectItem value="Business Manager">Quản lý kinh doanh</SelectItem>
                      <SelectItem value="Operator Manager">Quản lý vận hành</SelectItem>
                      <SelectItem value="Ticket Staff">Nhân viên bán vé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Password Change Section */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>{showPasswordFields ? 'Ẩn' : 'Đổi'} mật khẩu</span>
                  </div>
                </Button>

                {showPasswordFields && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-900 font-medium">Mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={passwordData.showNew ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Nhập mật khẩu mới"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {passwordData.showNew ? (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-900 font-medium">Xác nhận mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={passwordData.showConfirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Xác nhận mật khẩu mới"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {passwordData.showConfirm ? (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                      <p className="text-xs text-blue-700">
                        • Mật khẩu phải có ít nhất 8 ký tự<br />
                        • Bao gồm chữ hoa, chữ thường và số
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white border-red-100 shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg">Xác nhận xóa tài khoản</DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            {deletingUser && (
              <>
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {deletingUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{deletingUser.name}</p>
                    <p className="text-gray-600 text-sm">{deletingUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{deletingUser.role}</Badge>
                      {getStatusBadge(deletingUser.status)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Bạn có chắc muốn xóa tài khoản <strong>{deletingUser.name}</strong> (Email: {deletingUser.email}) không?
                  Hành động này không thể hoàn tác.
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-red-100">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-border text-gray-700 hover:bg-muted"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
