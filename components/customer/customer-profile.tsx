"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Edit, Loader2, Save, Star, X, User, MapPin, Shield, Mail } from "lucide-react"
import { getMe, updateMe } from "../../src/api/user"
import axios from "axios"
import { useRouter } from "next/navigation"
import { BACKEND_BASE_URL } from "@/src/utils/config"

const getStoredEmail = () => {
    if (typeof window === "undefined") {
        return null
    }
    return localStorage.getItem("email") || localStorage.getItem("userEmail")
}
const ICONS = {
    MALE:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="56" cy="72" r="26" fill="none" stroke="%2360a5fa" stroke-width="10"/><path d="M74 54 L96 32 M86 32 H96 V42" stroke="%2360a5fa" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    FEMALE:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="50" r="26" fill="none" stroke="%23fb7185" stroke-width="10"/><path d="M64 76 V106 M48 92 H80" stroke="%23fb7185" stroke-width="10" fill="none" stroke-linecap="round"/></svg>',

    OTHER:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M44 40a20 20 0 0136 0c0 16-20 14-20 28" fill="none" stroke="%23f59e0b" stroke-width="10" stroke-linecap="round"/><circle cx="60" cy="98" r="6" fill="%23f59e0b"/></svg>',
};
const GENDER_OPTIONS = [
    {
        value: "MALE",
        label: "Nam",
        image: ICONS.MALE,
    },
    {
        value: "FEMALE",
        label: "Nữ",
        image: ICONS.FEMALE,
    },
    {
        value: "OTHER",
        label: "Khác",
        image: ICONS.OTHER,
    },
]
// STEP 1: helper chuẩn hoá giá trị giới tính về MALE/FEMALE/OTHER
const normalizeGender = (v?: string) => {
    if (!v) return "MALE";
    const up = v.toUpperCase();
    return ["MALE", "FEMALE", "OTHER"].includes(up) ? up : "MALE";
};



const showToast = (message: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${type === "success" ? "bg-green-500" : "bg-red-500"
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
        email: "",
        gender: "MALE",
        address: "",
        phoneNumber: "",
        loyaltyPoints: 0,
        avatar: "",
    })
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [passwordLoading, setPasswordLoading] = useState({ change: false })
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState("")
    const [hasFetched, setHasFetched] = useState(false)
    const router = useRouter()
    const resolvedEmail = useMemo(() => {
        const storedEmail = getStoredEmail()
        // eslint-disable-next-line no-console
        console.log("[CustomerProfile] resolvedEmail computed", { storedEmail })
        return storedEmail
    }, [])

    // Function to fetch user profile
    const fetchProfile = useCallback((email: string) => {
        if (!email) {
            return
        }
        // eslint-disable-next-line no-console
        console.log("[CustomerProfile] fetchProfile called with email:", email)
        setLoading(true)
        setHasFetched(true)
        // Also store in localStorage as a flag for polling check
        if (typeof window !== "undefined") {
            localStorage.setItem("_profileFetched", "true")
        }
        getMe(email)
            .then((data) => {
                // eslint-disable-next-line no-console
                console.log("[CustomerProfile] getMe data:", data)
                const gender = normalizeGender(
                    localStorage.getItem("userGender") || data.gender || "MALE"
                );

                setFormData((prev) => ({
                    ...prev,
                    name: data.name ?? prev.name ?? "",
                    gender,
                    email: data.email ?? prev.email ?? "",
                    address: data.address ?? prev.address ?? "",
                    phoneNumber: data.phoneNumber ?? prev.phoneNumber ?? "",
                    loyaltyPoints: data.loyaltyPoints ?? prev.loyaltyPoints ?? 0,
                    avatar: data.avatar ?? prev.avatar ?? "",
                }))
                setAvatarPreview(data.avatar ?? "")
                if (typeof window !== "undefined" && (data.email || email)) {
                    const resolved = data.email ?? email
                    localStorage.setItem("email", resolved)
                    localStorage.setItem("userEmail", resolved)
                }
                // Save avatar to localStorage for header display
                if (typeof window !== "undefined" && data.avatar) {
                    localStorage.setItem("userAvatar", data.avatar)
                }
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error("[CustomerProfile] getMe error:", err)
                setHasFetched(false) // Reset to allow retry
                // Reset flag in localStorage to allow retry
                if (typeof window !== "undefined") {
                    localStorage.removeItem("_profileFetched")
                }
                showToast("Failed to load profile", "error")
            })
            .finally(() => setLoading(false))
    }, [])

    // Try to fetch immediately if email is available
    useEffect(() => {
        const stored = getStoredEmail()
        const email = stored
        // eslint-disable-next-line no-console
        console.log("[CustomerProfile] useEffect mount, stored email:", stored, "resolved:", email)
        if (email) {
            fetchProfile(email)
        } else {
            // eslint-disable-next-line no-console
            console.warn("[CustomerProfile] No email found. Will retry...")
        }
    }, [fetchProfile])

    // Poll for email if not available initially (for OAuth callback case)
    useEffect(() => {
        if (hasFetched) {
            return // Already fetched, no need to poll
        }

        const stored = getStoredEmail()
        if (stored) {
            fetchProfile(stored)
            return
        }

        // Poll for email for up to 5 seconds (for OAuth callback)
        let attempts = 0
        const maxAttempts = 10 // 10 attempts over 5 seconds
        const pollInterval = setInterval(() => {
            attempts++
            // Check hasFetched from state to avoid stale closure
            const currentHasFetched = localStorage.getItem("_profileFetched") === "true"
            if (currentHasFetched) {
                clearInterval(pollInterval)
                return
            }
            
            const email = getStoredEmail()
            if (email) {
                // eslint-disable-next-line no-console
                console.log("[CustomerProfile] Email found after polling, fetching profile...")
                fetchProfile(email)
                clearInterval(pollInterval)
            } else if (attempts >= maxAttempts) {
                // eslint-disable-next-line no-console
                console.warn("[CustomerProfile] Email not found after polling. User may need to login.")
                clearInterval(pollInterval)
            }
        }, 500) // Check every 500ms

        return () => clearInterval(pollInterval)
    }, [hasFetched, fetchProfile])

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
                address: formData.address || '',
                phoneNumber: formData.phoneNumber || '',
                avatar: formData.avatar || ''
            }

            const response = await axios.put(
                `${BACKEND_BASE_URL}/users/me`,
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
                    email: updatedData.email || prev.email,
                    gender: updatedData.gender || prev.gender,
                    address: updatedData.address || prev.address,
                    phoneNumber: updatedData.phoneNumber || prev.phoneNumber,
                    avatar: updatedData.avatar || prev.avatar
                }))
                setAvatarPreview(updatedData.avatar || "")

                // Update local storage
                localStorage.setItem("userName", updatedData.name)
                localStorage.setItem("userGender", normalizeGender(updatedData.gender));
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
            const userId = localStorage.getItem("userId")

            if (!accessToken) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.")
            }

            if (!userId) {
                throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.")
            }

            const response = await axios.post(
                `${BACKEND_BASE_URL}/accounts/${userId}/change-password`,
                {
                    currentPassword: trimmed.currentPassword,
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

            showToast(response.data?.message || "Đổi mật khẩu thành công")
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            setShowPasswordForm(false)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[CustomerProfile] changePassword error:", error)
            showToast(extractErrorMessage(error) || "Đổi mật khẩu thất bại. Vui lòng thử lại sau.", "error")
        } finally {
            setPasswordLoading((prev) => ({ ...prev, change: false }))
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast("Kích thước ảnh không được vượt quá 5MB", "error")
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            showToast("Vui lòng chọn file ảnh", "error")
            return
        }

        try {
            setLoading(true)

            // Get access token
            const accessToken = localStorage.getItem("accessToken")
            if (!accessToken) {
                throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.")
            }

            // Create FormData and append file
            const formData = new FormData()
            formData.append('file', file)

            // Upload avatar to backend
            const response = await fetch(`${BACKEND_BASE_URL}/users/me/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            })

            const result = await response.json()

            if (result.status === 200 && result.data) {
                // Update avatar preview and form data with the URL from backend
                setAvatarPreview(result.data)
                setFormData(prev => ({ ...prev, avatar: result.data }))

                // Save to localStorage so it appears in the home layout header
                localStorage.setItem("userAvatar", result.data)

                showToast("Cập nhật ảnh đại diện thành công!")
            } else {
                throw new Error(result.message || "Có lỗi xảy ra khi tải ảnh lên")
            }
        } catch (error) {
            console.error('Upload avatar failed:', error)
            showToast(extractErrorMessage(error) || "Tải ảnh lên thất bại. Vui lòng thử lại sau.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div id="view-profile" className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>
            
            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
            
            <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">

            {/* Header Section */}
            <div className="mb-12 relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                <div className="inline-block mb-4">
                    <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 px-3 py-1 bg-blue-50 rounded-md">
                        Profile
                    </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Thông tin cá nhân
                            </span>
                        </h1>
                        {!isEditing && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 shadow-lg">
                                <Shield className="h-3 w-3 mr-1 text-white" />
                                Đã xác thực
                            </Badge>
                        )}
                    </div>
                    {!isEditing ? (
                        <Button 
                            onClick={() => setIsEditing(true)} 
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 border-2 border-blue-400"
                        >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                id="btnSaveProfile"
                                disabled={loading}
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-700 text-white font-bold shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 border-2 border-emerald-400"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Lưu thay đổi
                            </Button>
                            <Button
                                id="btnCancelProfile"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 border-2 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                                Hủy
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-300"></div>
                    <div className="h-1.5 w-2 rounded-full bg-blue-400"></div>
                </div>
            </div>

            {/* Profile Information */}
            <Card className="mb-8 shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                            <User className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">Thông tin cá nhân</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Avatar */}
                        <div className="md:w-1/3 space-y-4">
                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4" />
                                Ảnh đại diện
                            </Label>

                            <div className="flex flex-col items-center md:items-start gap-4">
                                {/* Khung tròn + to + luôn đầy khung */}
                                <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 
                    rounded-full overflow-hidden ring-4 ring-blue-200 border-4 border-white shadow-2xl">
                                    <img
                                        src={avatarPreview || formData.avatar || "/placeholder-avatar.png"}
                                        alt="Avatar"
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                    />
                                </div>

                                {isEditing && (
                                    <div className="w-full">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('avatar-upload')?.click()}
                                            className="text-sm w-full md:w-auto border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                        >
                                            Chọn ảnh
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-1">JPG/PNG/GIF tối đa 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Fields */}
                        <div className="md:w-2/3 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                                            placeholder="Nhập họ và tên"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium text-lg bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">{formData.name || "Chưa cập nhật"}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800"
                                    >
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        value={formData.email}
                                        disabled
                                        className="mt-1 bg-blue-50 border-2 border-blue-200 text-base md:text-lg h-12 px-4
               disabled:opacity-100 placeholder:text-base md:placeholder:text-lg"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <User className="h-4 w-4" />
                                        Giới tính
                                    </Label>

                                    {isEditing ? (
                                        <RadioGroup
                                            value={formData.gender}
                                            onValueChange={(v) =>
                                                setFormData({ ...formData, gender: normalizeGender(v) })
                                            }
                                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                                        >
                                            {GENDER_OPTIONS.map((option) => {
                                                const selected = formData.gender === option.value;
                                                return (
                                                    <label
                                                        key={option.value}
                                                        htmlFor={`gender-${option.value}`}
                                                        className="group cursor-pointer select-none"
                                                    >
                                                        {/* radio ẩn nhưng vẫn đảm bảo ARIA/keyboard */}
                                                        <RadioGroupItem
                                                            id={`gender-${option.value}`}
                                                            value={option.value}
                                                            className="sr-only"
                                                        />

                                                        {/* Ô vuông icon */}
                                                        <div
                                                            className={[
                                                                "relative rounded-xl border-2 transition-all",
                                                                "w-full aspect-square flex items-center justify-center",
                                                                "bg-[linear-gradient(180deg,#0f172a_0%,#1f2937_100%)]",
                                                                selected
                                                                    ? "border-blue-500 ring-4 ring-blue-300 shadow-xl scale-105"
                                                                    : "border-gray-200 hover:border-blue-400 hover:shadow-lg hover:scale-105"
                                                            ].join(" ")}
                                                        >
                                                            <img
                                                                src={option.image}
                                                                alt={option.label}
                                                                className="w-12 h-12 md:w-14 md:h-14 object-contain opacity-90"
                                                            />
                                                        </div>

                                                        {/* Nhãn bên dưới */}
                                                        <div className="mt-2 text-center">
                                                            <span
                                                                className={[
                                                                    "text-sm font-medium",
                                                                    selected ? "text-blue-600" : "text-gray-800"
                                                                ].join(" ")}
                                                            >
                                                                {option.label}
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </RadioGroup>
                                    ) : (
                                        // Chế độ xem: chỉ hiện 1 icon + nhãn gọn
                                        <div className="flex items-center gap-3 mt-2">
                                            {(() => {
                                                const selected =
                                                    GENDER_OPTIONS.find(
                                                        (opt) => opt.value === normalizeGender(formData.gender)
                                                    ) || GENDER_OPTIONS[0];
                                                return (
                                                    <>
                                                        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                                                            <img
                                                                src={selected.image}
                                                                alt={selected.label}
                                                                className="w-8 h-8 object-contain"
                                                            />
                                                        </div>
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium">
                                                            {selected.label}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>


                                {/* Address */}
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MapPin className="h-4 w-4" />
                                        Địa chỉ
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Nhập địa chỉ"
                                            className="mt-1 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                                        />
                                    ) : (
                                        <p id="address" className="text-gray-600 text-lg bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                            {formData.address || "Chưa cập nhật"}
                                        </p>
                                    )}
                                </div>
                            </div>
                    </div>
                </div>

                    {/* Loyalty Points Section */}
                    <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                                    <Star className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Điểm tích lũy</h3>
                                    <p className="text-sm text-gray-600">Tích lũy điểm khi đặt vé</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge id="loyaltyPoints" className="text-lg px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-2 border-blue-400 shadow-xl">
                                    {formData.loyaltyPoints.toLocaleString()} điểm
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Section */}
            <Card className="shadow-2xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b-2 border-blue-200">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">Bảo mật tài khoản</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {!showPasswordForm ? (
                        <div className="text-center py-8">
                            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center border-4 border-blue-300 shadow-lg">
                                <Shield className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Đổi mật khẩu</h3>
                            <p className="text-gray-600 mb-6 font-medium">
                                Để bảo mật tài khoản, hãy thường xuyên thay đổi mật khẩu
                            </p>
                            <Button
                                onClick={() => setShowPasswordForm(true)}
                                className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 border-2 border-blue-400"
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
                                        className="mt-1 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
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
                                        className="mt-1 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
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
                                        className="mt-1 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    id="btnChangePassword"
                                    disabled={passwordLoading.change}
                                    onClick={handleChangePassword}
                                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 border-2 border-blue-400"
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
                                    className="border-2 hover:bg-gray-50"
                                >
                                    Xóa thông tin
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </div>
    )
}
