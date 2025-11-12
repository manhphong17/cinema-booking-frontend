"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LockKeyhole, Eye, EyeOff } from "lucide-react"
import { friendlyFromPayload, type ApiEnvelope } from "../../src/utils/server-error"
import { BACKEND_BASE_URL } from "@/src/utils/config"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")

    const router = useRouter()

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

    const postJson = async <T,>(url: string, body: any): Promise<ApiEnvelope<T>> => {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
        let data: ApiEnvelope<T>
        try { data = (await res.json()) as ApiEnvelope<T> }
        catch { data = { status: res.status, message: res.statusText } as ApiEnvelope<T> }

        const ok = data?.status ? (data.status === 200 || data.status === 201) : res.ok
        if (!ok) {
            ;(data as any).__headers = {
                "x-error-code": res.headers.get("x-error-code"),
                "x-app-error-code": res.headers.get("x-app-error-code"),
                "x-error": res.headers.get("x-error"),
                "x-error-message": res.headers.get("x-error-message"),
                "x-app-error-message": res.headers.get("x-app-error-message"),
            }
            const err: any = new Error("Yêu cầu không thành công")
            err.payload = data
            err.httpStatus = res.status
            throw err
        }
        return data
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!pwd || !cpwd) return toast.error("Vui lòng nhập đầy đủ mật khẩu")
        if (!validLength) return toast.error("Mật khẩu tối thiểu 8 ký tự")
        if (pwd !== cpwd) return toast.error("Mật khẩu nhập lại không khớp")

        if (typeof window === "undefined") return
        const resetToken = sessionStorage.getItem("reset_token") || ""
        if (!resetToken) {
            toast.error("Thiếu reset token. Vui lòng xác thực OTP lại.")
            router.replace("/verify-otp-reset")
            return
        }

        setIsLoading(true)
        try {
            const resp = await postJson<unknown>(`${BACKEND_BASE_URL}/auth/reset-password`, {
                resetToken, newPassword: pwd,
            })

            try {
                sessionStorage.removeItem("reset_token")
                sessionStorage.removeItem("fp_email")
            } catch {}

            toast.success( "Đặt lại mật khẩu thành công, vui lòng đăng nhập")
            router.push("/")
        } catch (err: any) {
            const payload = err?.payload as ApiEnvelope | undefined
            toast.error(
                friendlyFromPayload(
                    payload,
                     "Không thể đặt lại mật khẩu. Token có thể không hợp lệ hoặc đã hết hạn."
                )
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl border-0">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                <LockKeyhole className="h-6 w-6" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-2xl font-black text-gray-900">
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Cinema
                                </span>
                            </span>
                            <span className="text-xs text-gray-500 font-medium -mt-1">Premium Experience</span>
                        </div>
                    </div>
                    <CardTitle className="text-center text-3xl font-bold text-gray-900">Đặt lại mật khẩu</CardTitle>
                    <CardDescription className="text-center text-gray-600">
                        Nhập mật khẩu mới cho tài khoản <span className="font-semibold">{email || "của bạn"}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="password" type={showPassword ? "text" : "password"}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới" required className="pr-10 border-gray-300 focus:border-[#38AAEC] focus:ring-2 focus:ring-[#38AAEC]/50"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword((prev) => !prev)}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {!validLength && password.length > 0 && (<p className="text-xs text-red-600 mt-1">Mật khẩu tối thiểu 8 ký tự</p>)}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu" required className="pr-10 border-gray-300 focus:border-[#38AAEC] focus:ring-2 focus:ring-[#38AAEC]/50"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {cpwd && pwd !== cpwd && (<p className="text-xs text-red-600 mt-1">Mật khẩu nhập lại không khớp</p>)}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full text-white transition-all duration-300" 
                            style={{ backgroundColor: '#38AAEC' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#38AAEC'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38AAEC'}
                            disabled={!canSubmit}
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                        </Button>

                        <div className="text-center">
                            <button 
                                type="button" 
                                onClick={() => router.push("/")} 
                                className="text-sm transition-colors hover:underline"
                                style={{ color: '#38AAEC' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#38AAEC'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#38AAEC'}
                            >
                                Quay lại trang chủ
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
