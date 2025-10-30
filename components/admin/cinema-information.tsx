"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react"

const branches = [
  {
    id: 1,
    name: "Downtown Cinema",
    address: "123 Main St, City Center",
    phone: "0123-456-789",
    mapUrl: "https://maps.google.com",
    status: "active",
  },
  {
    id: 2,
    name: "Mall Cinema",
    address: "456 Shopping Mall, District 1",
    phone: "0123-456-790",
    mapUrl: "https://maps.google.com",
    status: "active",
  },
  {
    id: 3,
    name: "Airport Cinema",
    address: "789 Airport Road, District 2",
    phone: "0123-456-791",
    mapUrl: "https://maps.google.com",
    status: "inactive",
  },
]

export function CinemaInformation() {
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cấu hình thông tin rạp</h1>
        <p className="text-gray-600 mt-2">Quản lý thông tin chi tiết về rạp chiếu phim</p>
      </div>

      {/* Basic Info Card */}
     
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Thông tin cơ bản</CardTitle>
          <CardDescription>Cập nhật thông tin chính của rạp chiếu phim</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cinema-name" className="text-gray-900">
                Tên rạp
              </Label>
              <Input id="cinema-name" placeholder="Nhập tên rạp" defaultValue="CineShow Cinema" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-address" className="text-gray-900">
                Địa chỉ
              </Label>
              <Input id="cinema-address" placeholder="Nhập địa chỉ" defaultValue="123 Main Street, City Center" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-phone" className="text-gray-900">
                Hotline
              </Label>
              <Input id="cinema-phone" placeholder="Nhập số điện thoại" defaultValue="0123-456-789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-email" className="text-gray-900">
                Email liên hệ
              </Label>
              <Input id="cinema-email" type="email" placeholder="Nhập email" defaultValue="contact@cineshow.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cinema-map" className="text-gray-900">
                Google Map link
              </Label>
              <Input id="cinema-map" placeholder="Nhập link Google Map" defaultValue="https://maps.google.com/..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours Card */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Giờ hoạt động</CardTitle>
          <CardDescription>Cập nhật giờ mở cửa và đóng cửa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="opening-time" className="text-gray-900">
                Giờ mở cửa
              </Label>
              <Input id="opening-time" type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-time" className="text-gray-900">
                Giờ đóng cửa
              </Label>
              <Input id="closing-time" type="time" defaultValue="23:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Upload Card */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900">Tải lên hình ảnh</CardTitle>
          <CardDescription>Cập nhật logo và banner của rạp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-gray-900">Logo (Hình vuông)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Kéo thả hoặc nhấp để tải lên</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG (tối đa 5MB)</p>
              </div>
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo preview</span>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <Label className="text-gray-900">Banner (Hình ngang)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Kéo thả hoặc nhấp để tải lên</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG (tối đa 10MB)</p>
              </div>
              <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-600">Banner preview</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Hủy</Button>
        <Button onClick={handleSave}>{isSaved ? "Đã lưu!" : "Lưu thay đổi"}</Button>
      </div>
    </div>
  )
}
