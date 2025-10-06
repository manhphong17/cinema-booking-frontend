"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { KeyRound } from "lucide-react"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState("")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()

    // Lấy email: ưu tiên sessionStorage, fallback query (?email=)
    useEffect(() => {
        let em = ""
        if (typeof window !== "undefined") {
            em = sessionStorage.getItem("fp_email") || ""
        }
        if (!em) {
            const fromQuery = searchParams.get("email") ?? ""
            if (fromQuery) em = fromQuery
        }
        if (!em) {
            toast.error("Thiếu email. Vui lòng nhập lại email để nhận OTP.")
            router.replace("/forgot_password")
            return
        }
        setEmail(em)
    }, [router, searchParams])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error("Thiếu email. Vui lòng quay lại bước trước.")
            router.replace("/forgot_password")
            return
        }
        if (!/^\d{6}$/.test(otp)) {
            toast.error("Vui lòng nhập đủ 6 chữ số")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/accounts/verify-otp-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otpCode: otp }),
            })

            // ResponseData<T>: { status, message, data }
            let data: any = null
            try {
                data = await res.json()
            } catch {
                data = null
            }

            if (!res.ok) {
                const msg = data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn"
                toast.error(msg)
                return
            }

            const resetToken =
                data?.data?.resetToken || data?.resetToken || data?.token

            if (!resetToken) {
                toast.error("Thiếu reset token từ máy chủ. Vui lòng thử lại.")
                return
            }

            // Lưu token và sang trang reset (không đính token lên URL)
            if (typeof window !== "undefined") {
                sessionStorage.setItem("reset_token", String(resetToken))
            }
            toast.success("Xác thực thành công, vui lòng đặt lại mật khẩu")
            router.push("/reset-password")
        } catch (err) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email.trim()) {
            toast.error("Thiếu email. Vui lòng quay lại bước trước.")
            router.replace("/forgot_password")
            return
        }
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/accounts/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            let data: any = null
            try {
                data = await res.json()
            } catch {
                data = null
            }
            if (res.ok) {
                toast.success("Mã xác nhận mới đã được gửi")
            } else {
                toast.error(data?.message || "Không gửi lại được mã")
            }
        } catch {
            toast.error("Có lỗi khi gửi lại mã")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl border-0">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-full shadow-lg">
                            <KeyRound className="h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">Nhập Mã Xác Nhận</CardTitle>
                    <CardDescription className="text-gray-600">
                        Một mã 6 chữ số đã được gửi tới{" "}
                        <span className="font-semibold">{email}</span>. Nhập mã để tiếp tục đặt lại mật khẩu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Nhập mã OTP 6 chữ số"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="text-center text-xl tracking-widest border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang xác nhận..." : "Xác nhận mã"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push("/forgot_password")}
                            >
                                Thay đổi email
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-600">
                            Không nhận được mã?{" "}
                            <button
                                type="button"
                                onClick={handleResend}
                                className="text-primary hover:underline font-medium"
                            >
                                Gửi Lại
                            </button>
                        </div>

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
