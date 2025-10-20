"use client"

import {useEffect, useMemo, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {Edit, Loader2, Save, Star, X, User, Mail, Phone, MapPin, Calendar, Shield, Crown, Award} from "lucide-react"
import {getMe, updateMe} from "../../src/api/user"
import axios from "axios"
import { useRouter } from "next/navigation"

const getStoredEmail = () => {
    if (typeof window === "undefined") {
        return null
    }
    return localStorage.getItem("email") || localStorage.getItem("userEmail")
}

const showToast = (message: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 3000)
}

const extractErrorMessage = (error: unknown) => {
    if (typeof error === "object" && error) {
        const maybeResponse = (error as any).response
        const fallback = (error as any).message
        const message = maybeResponse?.data?.message || maybeResponse?.data?.error || fallback
        if (typeof message === "string" && message.trim().length > 0) {
            return message
        }
    }
    if (error instanceof Error && error.message) {
        return error.message
    }
    return "Đã xảy ra lỗi"
}

export function CustomerProfile() {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        gender: "MALE",
        dateOfBirth: "",
        email: "",
        address: "",
        phoneNumber: "",
        loyaltyPoints: 0,
    })
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [passwordLoading, setPasswordLoading] = useState({ change: false })
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const router = useRouter()
    const resolvedEmail = useMemo(() => {
        const storedEmail = getStoredEmail()
        // eslint-disable-next-line no-console
        console.log("[CustomerProfile] resolvedEmail computed", { storedEmail, formEmail: formData.email })
        return storedEmail || formData.email
    }, [formData.email])

    const formattedDob = useMemo(() => {
        if (!formData.dateOfBirth) {
            return "Chưa cập nhật"
        }
        const parsed = new Date(formData.dateOfBirth)
        return Number.isNaN(parsed.getTime()) ? "Chưa cập nhật" : parsed.toLocaleDateString()
    }, [formData.dateOfBirth])

    useEffect(() => {
        const stored = getStoredEmail()
        const email = stored || formData.email
        // eslint-disable-next-line no-console
        console.log("[CustomerProfile] useEffect mount, stored email:", stored, "resolved:", email)
        if (!email) {
            // eslint-disable-next-line no-console
            console.warn("[CustomerProfile] No email found. Ask user to login.")
            return
        }
        setLoading(true)
        getMe(email)
            .then((data) => {
                // eslint-disable-next-line no-console
                console.log("[CustomerProfile] getMe data:", data)
                const gender = localStorage.getItem("userGender") || data.gender || formData.gender || "male"
                const dateOfBirth = localStorage.getItem("userDob") || data.dateOfBirth || formData.dateOfBirth || ""
                setFormData((prev) => ({
                    ...prev,
                    name: data.name ?? prev.name ?? "",
                    gender,
                    dateOfBirth,
                    email: data.email ?? email,
                    address: data.address ?? prev.address ?? "",
                    phoneNumber: data.phoneNumber ?? prev.phoneNumber ?? "",
                    loyaltyPoints: data.loyaltyPoints ?? prev.loyaltyPoints ?? 0,
                }))
                if (typeof window !== "undefined" && (data.email || email)) {
                    const resolved = data.email ?? email
                    localStorage.setItem("email", resolved)
                    localStorage.setItem("userEmail", resolved)
                }
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error("[CustomerProfile] getMe error:", err)
                showToast("Failed to load profile", "error")
            })
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast("Vui lòng nhập họ tên", "error")
            return
        }
        
        try {
            setLoading(true)
            const accessToken = localStorage.getItem("accessToken")
            if (!accessToken) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.")
            }

            // Create payload with the exact structure expected by the backend
            const requestBody = {
                name: formData.name,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth || null,
                address: formData.address || '',
                phoneNumber: formData.phoneNumber || ''
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/users/me`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate, br, zstd'
                    }
                }
            )

            if (response.data && response.data.status === 200) {
                // Update local state with new data from response
                const updatedData = response.data.data
                setFormData(prev => ({
                    ...prev,
                    name: updatedData.name || prev.name,
                    gender: updatedData.gender || prev.gender,
                    dateOfBirth: updatedData.dateOfBirth || prev.dateOfBirth,
                    address: updatedData.address || prev.address,
                    phoneNumber: updatedData.phoneNumber || prev.phoneNumber
                }))
                
                // Update local storage
                localStorage.setItem("userName", updatedData.name)
                localStorage.setItem("userGender", updatedData.gender || 'MALE')
                localStorage.setItem("userDob", updatedData.dateOfBirth || '')
                localStorage.setItem("userAddress", updatedData.address || '')
                localStorage.setItem("userPhone", updatedData.phoneNumber || '')
                
                setIsEditing(false)
                showToast(response.data.message || "Cập nhật thông tin thành công!")
            } else {
                throw new Error(response.data?.message || "Có lỗi xảy ra khi cập nhật thông tin")
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[CustomerProfile] update error:", error)
            showToast(extractErrorMessage(error) || "Cập nhật thông tin thất bại. Vui lòng thử lại sau.", "error")
        } finally {
            setLoading(false)
        }
    }


    const handleChangePassword = async () => {
        if (!resolvedEmail) {
            showToast("Không tìm thấy email người dùng", "error")
            return
        }
        const trimmed = {
            currentPassword: passwordForm.currentPassword.trim(),
            newPassword: passwordForm.newPassword.trim(),
            confirmPassword: passwordForm.confirmPassword.trim(),
        }
        if (!trimmed.currentPassword) {
            showToast("Vui lòng nhập mật khẩu hiện tại", "error")
            return
        }
        if (!trimmed.newPassword) {
            showToast("Vui lòng nhập mật khẩu mới", "error")
            return
        }
        if (trimmed.newPassword.length < 6) {
            showToast("Mật khẩu mới phải tối thiểu 6 ký tự", "error")
            return
        }
        if (trimmed.newPassword !== trimmed.confirmPassword) {
            showToast("Mật khẩu xác nhận không khớp", "error")
            return
        }
        try {
            setPasswordLoading((prev) => ({ ...prev, change: true }))
            const accessToken = localStorage.getItem("accessToken")
            if (!accessToken) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.")
            }
            
            await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/accounts/change-password`,
                {
                    oldPassword: trimmed.currentPassword,
                    newPassword: trimmed.newPassword,
                    confirmPassword: trimmed.confirmPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            
            showToast("Đổi mật khẩu thành công")
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[CustomerProfile] changePassword error:", error)
            showToast(extractErrorMessage(error) || "Đổi mật khẩu thất bại. Vui lòng thử lại sau.", "error")
        } finally {
            setPasswordLoading((prev) => ({ ...prev, change: false }))
        }
    }

    const getMembershipTier = (points: number) => {
        if (points >= 1000) return { name: "Platinum", color: "bg-purple-500", icon: Crown }
        if (points >= 500) return { name: "Gold", color: "bg-yellow-500", icon: Award }
        if (points >= 100) return { name: "Silver", color: "bg-gray-400", icon: Star }
        return { name: "Bronze", color: "bg-orange-500", icon: Star }
    }

    const membership = getMembershipTier(formData.loyaltyPoints)
    const MembershipIcon = membership.icon

    return (
        <div id="view-profile" className="p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
                        <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <MembershipIcon className="h-5 w-5 text-yellow-500" />
                                <span className="text-sm font-semibold text-gray-700">{membership.name} Member</span>
                            </div>
                            <Badge className={`${membership.color} text-white text-xs`}>
                                {formData.loyaltyPoints.toLocaleString()} điểm
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
                    {!isEditing && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Đã xác thực
                        </Badge>
                    )}
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                        <Edit className="h-4 w-4"/>
                        Chỉnh sửa
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button 
                            id="btnSaveProfile" 
                            disabled={loading} 
                            onClick={handleSave} 
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4"/>
                            )}
                            Lưu thay đổi
                        </Button>
                        <Button
                            id="btnCancelProfile"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2"
                        >
                            <X className="h-4 w-4"/>
                            Hủy
                        </Button>
                    </div>
                )}
            </div>

            {/* Profile Information */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Thông tin cá nhân
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4" />
                                Họ và tên
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="mt-1"
                                    placeholder="Nhập họ và tên"
                                />
                            ) : (
                                <p className="text-gray-900 font-medium text-lg">{formData.name || "Chưa cập nhật"}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Mail className="h-4 w-4" />
                                Email
                            </Label>
                            <p id="email" className="text-gray-600 text-lg">
                                {resolvedEmail}
                            </p>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4" />
                                Giới tính
                            </Label>
                            {isEditing ? (
                                <RadioGroup
                                    id="gender"
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({...formData, gender: value})}
                                    className="flex gap-6 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="MALE" id="male"/>
                                        <Label htmlFor="male">Nam</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="FEMALE" id="female"/>
                                        <Label htmlFor="female">Nữ</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="OTHER" id="other"/>
                                        <Label htmlFor="other">Khác</Label>
                                    </div>
                                </RadioGroup>
                            ) : (
                                <p className="text-gray-900 font-medium text-lg capitalize">
                                    {formData.gender === "MALE" ? "Nam" : formData.gender === "FEMALE" ? "Nữ" : "Khác"}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <Label htmlFor="dob" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Calendar className="h-4 w-4" />
                                Ngày sinh
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth || ""}
                                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                    className="mt-1"
                                />
                            ) : (
                                <p id="dob" className="text-gray-600 text-lg">
                                    {formattedDob}
                                </p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Phone className="h-4 w-4" />
                                Số điện thoại
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    placeholder="Nhập số điện thoại"
                                    className="mt-1"
                                />
                            ) : (
                                <p id="phone" className="text-gray-600 text-lg">
                                    {formData.phoneNumber || "Chưa cập nhật"}
                                </p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MapPin className="h-4 w-4" />
                                Địa chỉ
                            </Label>
                            {isEditing ? (
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    placeholder="Nhập địa chỉ"
                                    className="mt-1"
                                />
                            ) : (
                                <p id="address" className="text-gray-600 text-lg">
                                    {formData.address || "Chưa cập nhật"}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator className="my-6"/>

                    {/* Loyalty Points Section */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <Star className="h-6 w-6 text-yellow-600"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Điểm tích lũy</h3>
                                    <p className="text-sm text-gray-600">Tích lũy điểm để nâng cấp thành viên</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge id="loyaltyPoints" className="text-lg px-4 py-2 bg-yellow-500 text-white">
                                    {formData.loyaltyPoints.toLocaleString()} điểm
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                    {membership.name} Member
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Section */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        Bảo mật tài khoản
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {!showPasswordForm ? (
                        <div className="text-center py-8">
                            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Shield className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đổi mật khẩu</h3>
                            <p className="text-gray-600 mb-4">
                                Để bảo mật tài khoản, hãy thường xuyên thay đổi mật khẩu
                            </p>
                            <Button 
                                onClick={() => setShowPasswordForm(true)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Đổi mật khẩu
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Thay đổi mật khẩu</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowPasswordForm(false)
                                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Hủy
                                </Button>
                            </div>
                            
                            <p className="text-sm text-gray-500">
                                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                                        Mật khẩu hiện tại
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        autoComplete="current-password"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                                        Mật khẩu mới
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                        autoComplete="new-password"
                                        className="mt-1"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                        Xác nhận mật khẩu mới
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        placeholder="Xác nhận mật khẩu mới"
                                        autoComplete="new-password"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                <Button 
                                    id="btnChangePassword" 
                                    disabled={passwordLoading.change} 
                                    onClick={handleChangePassword}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {passwordLoading.change ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang đổi mật khẩu...
                                        </>
                                    ) : (
                                        "Xác nhận đổi mật khẩu"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                                >
                                    Xóa thông tin
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
