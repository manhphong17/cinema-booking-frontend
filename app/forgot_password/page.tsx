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

            // BE dùng ResponseData<T> { status, message, data }
            // Ta cố gắng parse, nếu lỗi vẫn fallback theo res.ok
            let payload: any = null
            try {
                payload = await res.json()
            } catch {
                payload = null
            }

            if (res.ok) {
                // Lưu email tạm để bước Verify dùng gửi kèm body
                if (typeof window !== "undefined") {
                    sessionStorage.setItem("fp_email", trimmed)
                }
                toast.success("Mã xác nhận đã được gửi tới email của bạn")
                router.push("/verify-otp-reset")
            } else {
                const msg = payload?.message || "Gửi mã thất bại"
                toast.error(msg)
            }
        } catch (err) {
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
