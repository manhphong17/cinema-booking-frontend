import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, ShoppingBag, Gift, Star } from "lucide-react"

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
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Quản lý tài khoản
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            <p className="text-lg text-muted-foreground mt-4">
              Quản lý thông tin cá nhân và lịch sử giao dịch
            </p>
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
                <Card className="lg:col-span-1">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-2xl">{userProfile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">{userProfile.name}</CardTitle>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge className="bg-primary text-primary-foreground">{userProfile.membership}</Badge>
                      <Badge variant="outline">{userProfile.points} điểm</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Tham gia: {userProfile.joinDate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Chỉnh sửa thông tin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input id="name" defaultValue={userProfile.name} />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={userProfile.email} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" defaultValue={userProfile.phone} />
                      </div>
                      <div>
                        <Label htmlFor="joinDate">Ngày tham gia</Label>
                        <Input id="joinDate" defaultValue={userProfile.joinDate} disabled />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Textarea id="address" defaultValue={userProfile.address} />
                    </div>
                    <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg">
                      <Save className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Lịch sử đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <div className="font-semibold">{order.movie}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.date} • Ghế: {order.seats}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-semibold">{order.total}</div>
                          <Badge 
                            className={
                              order.status === "Hoàn thành" ? "bg-green-100 text-green-700" :
                              order.status === "Đã hủy" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Voucher của tôi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vouchers.map((voucher) => (
                      <div key={voucher.id} className={`p-4 border rounded-lg ${voucher.used ? 'opacity-50' : 'hover:bg-gray-50'} transition-colors`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{voucher.title}</h4>
                          <Badge variant={voucher.used ? "secondary" : "default"}>
                            {voucher.used ? "Đã sử dụng" : "Chưa sử dụng"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Mã: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{voucher.code}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          HSD: {voucher.validUntil}
                        </div>
                        {!voucher.used && (
                          <Button size="sm" className="mt-2 w-full">
                            Sử dụng ngay
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Thông báo email</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-notifications" defaultChecked />
                      <label htmlFor="email-notifications" className="text-sm">
                        Nhận thông báo về phim mới và ưu đãi
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Thông báo SMS</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sms-notifications" />
                      <label htmlFor="sms-notifications" className="text-sm">
                        Nhận thông báo qua SMS
                      </label>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg">
                    Lưu cài đặt
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </HomeLayout>
  )
}
