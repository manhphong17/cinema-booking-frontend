"use client"

import {useEffect, useMemo, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {Edit, Loader2, Save, Star, X} from "lucide-react"
import {getMe, updateMe} from "@/src/api/user"
import axios from "axios"

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

    return (
        <div id="view-profile" className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                        <Edit className="h-4 w-4"/>
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button id="btnSaveProfile" disabled={loading} onClick={handleSave} className="flex items-center gap-2">
                            <Save className="h-4 w-4"/>
                            Save
                        </Button>
                        <Button
                            id="btnCancelProfile"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2"
                        >
                            <X className="h-4 w-4"/>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            {isEditing ? (
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            ) : (
                                <p className="text-gray-900 font-medium">{formData.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Gender</Label>
                            {isEditing ? (
                                <RadioGroup
                                    id="gender"
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({...formData, gender: value})}
                                    className="flex gap-4"
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
                                <p className="text-gray-900 font-medium capitalize">{formData.gender}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Ngày sinh</Label>
                            {isEditing ? (
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth || ""}
                                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                />
                            ) : (
                                <p id="dob" className="text-gray-600">
                                    {formattedDob}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <p id="email" className="text-gray-600">
                                {resolvedEmail}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            {isEditing ? (
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    placeholder="Nhập số điện thoại"
                                />
                            ) : (
                                <p id="phone" className="text-gray-600">
                                    {formData.phoneNumber || "Chưa cập nhật"}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ</Label>
                            {isEditing ? (
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    placeholder="Nhập địa chỉ"
                                />
                            ) : (
                                <p id="address" className="text-gray-600">
                                    {formData.address || "Chưa cập nhật"}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator/>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Loyalty Points</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge id="loyaltyPoints" variant="secondary" className="text-lg px-3 py-1">
                                    <Star className="h-4 w-4 mr-1 text-yellow-500"/>
                                    {formData.loyaltyPoints.toLocaleString()} Points
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Gold Member Status</p>
                            <p className="text-xs text-gray-500">Next tier: Platinum (500 points to go)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Đổi mật khẩu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                placeholder="Nhập mật khẩu hiện tại"
                                autoComplete="current-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="Mật khẩu mới"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                placeholder="Xác nhận mật khẩu"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button id="btnChangePassword" disabled={passwordLoading.change} onClick={handleChangePassword}>
                            {passwordLoading.change ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang đổi mật khẩu...
                                </>
                            ) : (
                                "Đổi mật khẩu"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                        >
                            Xóa thông tin
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
