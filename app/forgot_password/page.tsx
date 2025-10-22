"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail } from "lucide-react"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export default function VerifyMailPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSendVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmed = email.trim()
        if (!trimmed) {
            toast.error("Vui lòng nhập email")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/accounts/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed }),
            })

            // Try parsing JSON body (either success or error shape).
            // BE error shape: { timestamp, status, path, error }
            // BE success shape (ResponseData): { status, message, data }
            let payload: any = null
            try {
                payload = await res.json()
            } catch {
                payload = null
            }

            // 200 OK → proceed normally
            if (res.ok) {
                // Save email temporarily for the next step (Verify OTP)
                if (typeof window !== "undefined") {
                    sessionStorage.setItem("fp_email", trimmed)
                }
                toast.success("Mã xác nhận đã được gửi tới email của bạn")
                router.push("/verify-otp-reset")
                return
            }

            // Map server status codes to user-friendly toasts.
            // Note: If you prefer neutral UX (avoid email enumeration),
            // you can treat 404 like success (save email + redirect).
            const errMsg = (payload?.error || payload?.message || "").toString() || undefined

            switch (res.status) {
                case 400:
                    toast.error(errMsg ?? "Token không hợp lệ hoặc đã hết hạn")
                    break
                case 401:
                    toast.error(errMsg ?? "Bạn chưa được xác thực")
                    break
                case 403:
                    toast.error(errMsg ?? "Truy cập bị từ chối")
                    break
                case 404:
                    toast.error(errMsg ?? "Không tìm thấy người dùng cho token này")
                    break
                case 500:
                    toast.error(errMsg ?? "Lỗi máy chủ, vui lòng thử lại")
                    break
                default:
                    toast.error(errMsg ?? `Lỗi không xác định (HTTP ${res.status})`)
            }
        } catch {
            // Network/CORS failure (client-side)
            toast.error("Không thể kết nối máy chủ. Kiểm tra mạng hoặc cấu hình CORS.")
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
                            <Mail className="h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">Xác nhận Email</CardTitle>
                    <CardDescription className="text-gray-600">
                        Nhập email của bạn, chúng tôi sẽ gửi cho bạn một mã xác thực để đặt lại mật khẩu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendVerifyCode} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="username@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="text-sm text-gray-600 hover:text-primary underline transition-colors"
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
