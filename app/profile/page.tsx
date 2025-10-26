"use client"

import { useState } from "react"
import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  ShoppingBag, 
  Gift, 
  Star, 
  Key, 
  Eye, 
  EyeOff, 
  Camera,
  CheckCircle,
  Crown,
  Award,
  TrendingUp,
  Film
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const userProfile = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@email.com",
  phone: "0123456789",
  address: "123 Đường ABC, Quận 1, TP.HCM",
  joinDate: "15/01/2023",
  avatar: "/customer-avatar.jpg",
  membership: "VIP",
  points: 1250
}

const recentOrders = [
  {
    id: "ORD001",
    movie: "Avengers: Endgame",
    date: "10/12/2024",
    seats: "A5, A6",
    total: "180,000đ",
    status: "Hoàn thành"
  },
  {
    id: "ORD002", 
    movie: "Spider-Man: No Way Home",
    date: "08/12/2024",
    seats: "B3, B4",
    total: "160,000đ",
    status: "Hoàn thành"
  },
  {
    id: "ORD003",
    movie: "The Batman",
    date: "05/12/2024", 
    seats: "C7, C8",
    total: "200,000đ",
    status: "Đã hủy"
  }
]

const vouchers = [
  {
    id: 1,
    title: "Giảm 20% Combo Bắp Nước",
    code: "COMBO20",
    validUntil: "31/12/2024",
    used: false
  },
  {
    id: 2,
    title: "Mua 2 Tặng 1 Vé",
    code: "BUY2GET1", 
    validUntil: "15/01/2025",
    used: true
  }
]

export default function ProfilePage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [editData, setEditData] = useState({
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
    address: userProfile.address
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleSaveProfile = () => {
    // Simulate API call
    toast({
      title: "Thành công",
      description: "Thông tin cá nhân đã được cập nhật",
    })
    setIsEditing(false)
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp",
        variant: "destructive"
      })
      return
    }
    
    // Simulate API call
    toast({
      title: "Thành công", 
      description: "Mật khẩu đã được thay đổi",
    })
    setIsPasswordDialogOpen(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Hồ sơ cá nhân
                  </span>
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <p className="text-lg text-muted-foreground mt-4">
                  Quản lý thông tin cá nhân và lịch sử giao dịch
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.points}</div>
                  <div className="text-sm text-muted-foreground">Điểm tích lũy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{recentOrders.length}</div>
                  <div className="text-sm text-muted-foreground">Đơn hàng</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{vouchers.filter(v => !v.used).length}</div>
                  <div className="text-sm text-muted-foreground">Voucher</div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
              <TabsTrigger value="vouchers">Voucher</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <Card className="lg:col-span-1 bg-gradient-to-br from-white to-blue-50/30 border-blue-200 shadow-xl">
                  <CardHeader className="text-center pb-4">
                    <div className="relative flex justify-center mb-6">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {userProfile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{userProfile.name}</CardTitle>
                    <div className="flex justify-center gap-2 mt-3">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        {userProfile.membership}
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        <Award className="h-3 w-3 mr-1" />
                        {userProfile.points} điểm
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{userProfile.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">{userProfile.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium">{userProfile.address}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-pink-600" />
                        </div>
                        <span className="text-sm font-medium">Tham gia: {userProfile.joinDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Profile */}
                <Card className="lg:col-span-2 bg-white shadow-xl border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <User className="h-6 w-6 text-blue-600" />
                        Thông tin cá nhân
                      </CardTitle>
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setIsEditing(false)}
                              variant="outline"
                              className="border-gray-300"
                            >
                              Hủy
                            </Button>
                            <Button
                              onClick={handleSaveProfile}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Lưu thay đổi
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Họ và tên
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={editData.name}
                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 font-medium">{editData.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 font-medium">{editData.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Số điện thoại
                        </Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900 font-medium">{editData.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="joinDate" className="text-sm font-medium text-gray-700">
                          Ngày tham gia
                        </Label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900 font-medium">{userProfile.joinDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Địa chỉ
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="address"
                          value={editData.address}
                          onChange={(e) => setEditData({...editData, address: e.target.value})}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                        />
                      ) : (
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <span className="text-gray-900 font-medium">{editData.address}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Password Change */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Bảo mật tài khoản</h4>
                          <p className="text-sm text-gray-600">Thay đổi mật khẩu để bảo vệ tài khoản</p>
                        </div>
                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                              <Key className="h-4 w-4 mr-2" />
                              Đổi mật khẩu
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-blue-600" />
                                Thay đổi mật khẩu
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                                <div className="relative">
                                  <Input
                                    id="currentPassword"
                                    type={showPasswords.current ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                  >
                                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                <div className="relative">
                                  <Input
                                    id="newPassword"
                                    type={showPasswords.new ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                  >
                                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                                <div className="relative">
                                  <Input
                                    id="confirmPassword"
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                  >
                                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsPasswordDialogOpen(false)}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  onClick={handleChangePassword}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Thay đổi
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card className="bg-white shadow-xl border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                    Lịch sử đơn hàng
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Theo dõi tất cả các đơn hàng và giao dịch của bạn</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Film className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">{order.movie}</h4>
                                <p className="text-sm text-gray-600">Mã đơn: {order.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {order.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Ghế: {order.seats}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-xl font-bold text-gray-900">{order.total}</div>
                            <Badge 
                              className={`px-3 py-1 ${
                                order.status === "Hoàn thành" ? "bg-green-100 text-green-700 border-green-200" :
                                order.status === "Đã hủy" ? "bg-red-100 text-red-700 border-red-200" :
                                "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {recentOrders.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                      <p className="text-gray-600">Bắt đầu đặt vé để xem lịch sử đơn hàng của bạn</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-6">
              <Card className="bg-white shadow-xl border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Gift className="h-6 w-6 text-purple-600" />
                    Voucher của tôi
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Quản lý và sử dụng các voucher ưu đãi</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vouchers.map((voucher) => (
                      <div key={voucher.id} className={`relative p-6 border-2 rounded-xl transition-all duration-300 ${
                        voucher.used 
                          ? 'border-gray-200 bg-gray-50 opacity-60' 
                          : 'border-purple-200 bg-gradient-to-br from-white to-purple-50/30 hover:border-purple-300 hover:shadow-lg'
                      }`}>
                        {voucher.used && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              voucher.used 
                                ? 'bg-gray-300' 
                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                              <Gift className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">{voucher.title}</h4>
                              <p className="text-sm text-gray-600">Mã: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-purple-600">{voucher.code}</span></p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>HSD: {voucher.validUntil}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              className={`px-3 py-1 ${
                                voucher.used 
                                  ? 'bg-gray-200 text-gray-600' 
                                  : 'bg-green-100 text-green-700 border-green-200'
                              }`}
                            >
                              {voucher.used ? "Đã sử dụng" : "Có thể sử dụng"}
                            </Badge>
                            
                            {!voucher.used && (
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                              >
                                Sử dụng ngay
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {vouchers.length === 0 && (
                    <div className="text-center py-12">
                      <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có voucher nào</h3>
                      <p className="text-gray-600">Tham gia các chương trình khuyến mãi để nhận voucher ưu đãi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notification Settings */}
                <Card className="bg-white shadow-xl border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Star className="h-6 w-6 text-green-600" />
                      Cài đặt thông báo
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">Quản lý cách bạn nhận thông báo</p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Thông báo Email</h4>
                            <p className="text-sm text-gray-600">Nhận thông báo về phim mới và ưu đãi</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Thông báo SMS</h4>
                            <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Thông báo ưu đãi</h4>
                            <p className="text-sm text-gray-600">Nhận thông báo về khuyến mãi đặc biệt</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu cài đặt thông báo
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="bg-white shadow-xl border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-6 w-6 text-red-600" />
                      Cài đặt tài khoản
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">Quản lý bảo mật và quyền riêng tư</p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <Key className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Đổi mật khẩu</h4>
                              <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                            Thay đổi
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Eye className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Quyền riêng tư</h4>
                              <p className="text-sm text-gray-600">Quản lý thông tin cá nhân</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                            Cài đặt
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-900">Xóa tài khoản</h4>
                              <p className="text-sm text-red-600">Xóa vĩnh viễn tài khoản của bạn</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </HomeLayout>
  )
}
