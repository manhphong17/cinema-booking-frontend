"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Clock, ImageIcon, Loader2, Edit, History } from "lucide-react"
import { fetchTheaterDetails, updateTheaterDetails, type TheaterDetails } from "@/app/api/theater/theater"
import { useToast } from "@/hooks/use-toast"

export function CinemaInformation() {
  const { toast } = useToast()
  const router = useRouter()
  const [theaterData, setTheaterData] = useState<TheaterDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<TheaterDetails>>({})

  // Fetch theater details on mount
  useEffect(() => {
    loadTheaterDetails()
  }, [])

  const loadTheaterDetails = async () => {
    try {
      setLoading(true)
      console.log('Fetching theater details...')
      const data = await fetchTheaterDetails()
      console.log('Theater data received:', data)

      if (!data) {
        throw new Error('No data returned from API')
      }

      setTheaterData(data)
      setFormData(data)
    }  catch (error: any) {
      console.error('Error loading theater details:', error)
      console.error('Error response:', error.response?.data)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || error.message || "Không thể tải thông tin rạp",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Saving theater details:', formData)
      await updateTheaterDetails(formData)
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin rạp",
      })
      await loadTheaterDetails()
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving theater details:', error)
      console.error('Error response:', error.response?.data)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || error.message || "Không thể lưu thông tin",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(theaterData || {})
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleInputChange = (field: keyof TheaterDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }



  // Extract Google Map embed URL - simple iframe without API key
  const getGoogleMapEmbedUrl = (url: string) => {
    if (!url) return ""
    // If it's already an embed URL, return it
    if (url.includes("embed")) return url
    
    // Convert regular Google Maps URL to embed URL
    // Example: https://maps.google.com/?q=Galaxy%20Star%20Cinema
    // To: https://maps.google.com/maps?q=Galaxy%20Star%20Cinema&output=embed
    
    // Extract query parameter
    const match = url.match(/[?&]q=([^&]+)/)
    if (match) {
      return `https://maps.google.com/maps?q=${match[1]}&output=embed`
    }
    
    // If URL contains coordinates or place name, use it directly
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!theaterData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy thông tin rạp</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cấu hình thông tin rạp</h1>
          <p className="text-gray-600 mt-2">Quản lý thông tin chi tiết về rạp chiếu phim</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/theater-history')}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Lịch sử thay đổi
          </Button>
          {!isEditing && (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
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
              <Label htmlFor="cinema-name" className="text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Tên rạp
              </Label>
              <Input
                id="cinema-name"
                placeholder="Nhập tên rạp"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-hotline" className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Hotline
              </Label>
              <Input
                id="cinema-hotline"
                placeholder="Nhập số điện thoại"
                value={formData.hotline || ""}
                onChange={(e) => handleInputChange("hotline", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cinema-address" className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Địa chỉ
              </Label>
              <Input
                id="cinema-address"
                placeholder="Nhập địa chỉ"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-email" className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email liên hệ
              </Label>
              <Input
                id="cinema-email"
                type="email"
                placeholder="Nhập email"
                value={formData.contactEmail || ""}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-map" className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Google Map URL
              </Label>
              <Input
                id="cinema-map"
                placeholder="Nhập link Google Map"
                value={formData.googleMapUrl || ""}
                onChange={(e) => handleInputChange("googleMapUrl", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cinema-information" className="text-gray-900">
                Thông tin rạp
              </Label>
              {isEditing ? (
                <Textarea
                  id="cinema-information"
                  placeholder="Nhập mô tả thông tin rạp"
                  value={formData.information || ""}
                  onChange={(e) => handleInputChange("information", e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-line border border-gray-200 rounded-lg p-3 bg-gray-50 min-h-[120px]">
                  {formData.information?.trim() || "Chưa có thông tin mô tả"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours Card */}
      <Card className="bg-white border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Giờ hoạt động
          </CardTitle>
          <CardDescription>Cập nhật giờ mở cửa và đóng cửa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="opening-time" className="text-gray-900">
                Giờ mở cửa
              </Label>
              <Input
                id="opening-time"
                type="time"
                value={formData.openTime?.substring(0, 5) || ""}
                onChange={(e) => handleInputChange("openTime", e.target.value + ":00")}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-time" className="text-gray-900">
                Giờ đóng cửa
              </Label>
              <Input
                id="closing-time"
                type="time"
                value={formData.closeTime?.substring(0, 5) || ""}
                onChange={(e) => handleInputChange("closeTime", e.target.value + ":00")}
                disabled={!isEditing}
              />
            </div>
          </div>
          {formData.overnight && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                ⚠️ Rạp hoạt động qua đêm (overnight mode)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Map Preview */}
      {formData.googleMapUrl && (
        <Card className="bg-white border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Vị trí trên bản đồ
            </CardTitle>
            <CardDescription>Xem trước vị trí rạp trên Google Maps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96 rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={getGoogleMapEmbedUrl(formData.googleMapUrl)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Theater Location"
              />
            </div>
            <div className="mt-4">
              <a
                href={formData.googleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Mở trong Google Maps
              </a>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Save Button - Only show when editing */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
