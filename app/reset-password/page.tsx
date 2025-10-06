"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LockKeyhole, Eye, EyeOff } from "lucide-react"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("") // chỉ hiển thị

    const router = useRouter()

    // Lấy email (chỉ để hiển thị) & kiểm tra token có sẵn trong sessionStorage không
    useEffect(() => {
        if (typeof window === "undefined") return
        const em = sessionStorage.getItem("fp_email") || ""
        setEmail(em)

        const token = sessionStorage.getItem("reset_token")
        if (!token) {
            toast.error("Thiếu reset token. Vui lòng xác thực OTP lại.")
            router.replace("/verify-otp-reset")
        }
    }, [router])

    const pwd = password.trim()
    const cpwd = confirmPassword.trim()
    const validLength = pwd.length >= 8

    const canSubmit = useMemo(() => validLength && pwd === cpwd && !isLoading, [validLength, pwd, cpwd, isLoading])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!pwd || !cpwd) {
            toast.error("Vui lòng nhập đầy đủ mật khẩu")
            return
        }
        if (!validLength) {
            toast.error("Mật khẩu tối thiểu 8 ký tự")
            return
        }
        if (pwd !== cpwd) {
            toast.error("Mật khẩu nhập lại không khớp")
            return
        }

        if (typeof window === "undefined") return
        const resetToken = sessionStorage.getItem("reset_token") || ""
        if (!resetToken) {
            toast.error("Thiếu reset token. Vui lòng xác thực OTP lại.")
            router.replace("/verify-otp-reset")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/accounts/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resetToken, newPassword: pwd }), // ✅ token + password trong BODY
            })

            let data: any = null
            try {
                data = await res.json()
            } catch {
                data = null
            }

            if (res.ok) {
                // Dọn dữ liệu tạm
                try {
                    sessionStorage.removeItem("reset_token")
                    sessionStorage.removeItem("fp_email")
                } catch {}
                toast.success("Đặt lại mật khẩu thành công, vui lòng đăng nhập")
                router.push("/")
            } else {
                const msg = data?.message || data?.error || "Đặt lại mật khẩu thất bại"
                toast.error(msg)
            }
        } catch {
            toast.error("Có lỗi xảy ra, vui lòng thử lại")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl border-0">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-full shadow-lg">
                            <LockKeyhole className="h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">Đặt lại mật khẩu</CardTitle>
                    <CardDescription className="text-gray-600">
                        Nhập mật khẩu mới cho tài khoản{" "}
                        <span className="font-semibold">{email || "của bạn"}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới"
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {!validLength && password.length > 0 && (
                                <p className="text-xs text-red-600 mt-1">Mật khẩu tối thiểu 8 ký tự</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {cpwd.length > 0 && pwd !== cpwd && (
                                <p className="text-xs text-red-600 mt-1">Mật khẩu nhập lại không khớp</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            disabled={!canSubmit}
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
