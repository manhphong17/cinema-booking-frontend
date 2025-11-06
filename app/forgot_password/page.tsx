"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail } from "lucide-react"
import { friendlyFromPayload, type ApiEnvelope } from "../../src/utils/server-error"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
const EMAIL_RE =
    /^(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export default function VerifyMailPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

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
            // ⬇️ đính kèm header để helper đọc code/message
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

    const handleSendVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmed = email.trim()
        if (!trimmed) return toast.error("Vui lòng nhập email")
        if (!EMAIL_RE.test(trimmed)) return toast.error("Email không hợp lệ")

        setIsLoading(true)
        try {
            const resp = await postJson<unknown>(`${BACKEND_BASE_URL}/auth/forgot-password`, { email: trimmed })
            if (typeof window !== "undefined") sessionStorage.setItem("fp_email", trimmed)
            toast.success( "Mã xác nhận đã được gửi tới email của bạn")
            router.push("/verify-otp-reset")
        } catch (err: any) {
            const payload = err?.payload as ApiEnvelope | undefined
            toast.error(friendlyFromPayload(payload, err?.message))
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
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <Input
                                id="email" type="email" placeholder="username@email.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-all" disabled={isLoading}>
                            {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </Button>

                        <div className="text-center">
                            <button type="button" onClick={() => router.push("/")} className="text-sm text-gray-600 hover:text-primary underline transition-colors">
                                Quay lại trang chủ
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
