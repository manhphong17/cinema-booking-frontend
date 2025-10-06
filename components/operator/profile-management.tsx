"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  Edit3,
  Camera,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ProfileManagement() {
  const { toast } = useToast()
  
  // Profile data
  const [profile, setProfile] = useState({
    name: "Operations Manager",
    email: "manager@cinema.com",
    phone: "+84 123 456 789",
    address: "123 Cinema Street, District 1, HCMC",
    position: "Operations Manager",
    department: "Operations",
    joinDate: "2023-01-15",
    avatar: "/admin-avatar.png"
  })

  // Password change states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(profile)

  const handleEdit = () => {
    setIsEditing(true)
    setEditData(profile)
  }

  const handleSave = () => {
    setProfile(editData)
    setIsEditing(false)
    toast({
      title: "Cập nhật thành công",
      description: "Thông tin profile đã được cập nhật"
    })
  }

  const handleCancel = () => {
    setEditData(profile)
    setIsEditing(false)
  }

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive"
      })
      return
    }

    // Simulate password change
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    setIsPasswordDialogOpen(false)
    
    toast({
      title: "Đổi mật khẩu thành công",
      description: "Mật khẩu đã được cập nhật"
    })
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Profile</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin cá nhân và bảo mật</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="text-foreground hover:bg-muted"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">{profile.name}</h2>
            <Badge variant="secondary" className="mb-4">
              {profile.position}
            </Badge>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Quyền: Quản lý</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Tham gia: {new Date(profile.joinDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Họ và tên
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="bg-input border-border text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="bg-input border-border text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Số điện thoại
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="bg-input border-border text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Địa chỉ
                </Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={editData.address}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    className="bg-input border-border text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Work Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Thông tin công việc</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Chức vụ</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.position}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Phòng ban</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.department}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Bảo mật</h3>
              </div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-foreground hover:bg-muted">
                    <Key className="w-4 h-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-card-foreground border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Đổi mật khẩu</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                        Mật khẩu hiện tại
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="bg-input border-border text-foreground pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                        Mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="bg-input border-border text-foreground pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                        Xác nhận mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="bg-input border-border text-foreground pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                        className="text-foreground hover:bg-muted"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handlePasswordChange}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mật khẩu mạnh</p>
                  <p className="text-xs text-muted-foreground">Mật khẩu của bạn đã được bảo mật</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Xác thực 2 yếu tố</p>
                  <p className="text-xs text-muted-foreground">Chưa được kích hoạt</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
