"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { KeyRound } from "lucide-react"
import { friendlyFromPayload, type ApiEnvelope } from "../../src/utils/server-error"
import { BACKEND_BASE_URL } from "@/src/utils/config"
const EMAIL_RE =
    /^(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

type VerifyOtpResetData = { resetToken?: string; token?: string }
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const extractResetToken = (resp: ApiEnvelope<unknown>): string | undefined => {
    if (isRecord(resp?.data)) {
        const d = resp.data as Record<string, unknown>
        if (typeof d.resetToken === "string") return d.resetToken
        if (typeof d.token === "string") return d.token
    }
    if (typeof (resp as any)?.resetToken === "string") return (resp as any).resetToken
    if (typeof (resp as any)?.token === "string") return (resp as any).token
    return undefined
}

async function postJson<T>(url: string, body: any): Promise<ApiEnvelope<T>> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    let data: ApiEnvelope<T>
    try { data = (await res.json()) as ApiEnvelope<T> }
    catch { data = { status: res.status, message: res.statusText } as ApiEnvelope<T> }

    const ok = data?.status ? data.status === 200 || data.status === 201 : res.ok
    if (!ok) {
        ;(data as any).__headers = {
            "x-error-code": res.headers.get("x-error-code"),
            "x-app-error-code": res.headers.get("x-app-error-code"),
            "x-error": res.headers.get("x-error"),
            "x-error-message": res.headers.get("x-error-message"),
            "x-app-error-message": res.headers.get("x-app-error-message"),
        }
        const err: any = new Error( "Yêu cầu không thành công")
        err.payload = data
        err.httpStatus = res.status
        throw err
    }
    return data
}

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState("")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        let em = ""
        if (typeof window !== "undefined") em = sessionStorage.getItem("fp_email") || ""
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

        const emailTrim = email.trim()
        const otpTrim = otp.trim()

        if (!emailTrim) { toast.error("Thiếu email. Vui lòng quay lại bước trước."); router.replace("/forgot_password"); return }
        if (!EMAIL_RE.test(emailTrim)) return toast.error("Email không hợp lệ")
        if (!/^\d{6}$/.test(otpTrim)) return toast.error("Vui lòng nhập đủ 6 chữ số")

        setIsLoading(true)
        try {
            // ❗ Chỉ gửi đúng field BE: { email, otpInput }
            const resp = await postJson<VerifyOtpResetData>(`${BACKEND_BASE_URL}/auth/verify-otp-reset`, {
                email: emailTrim,
                otpInput: otpTrim, // service layer bạn dùng tên này
                otp: otpTrim,      // nếu Controller/DTO dùng 'otp'
                otpCode: otpTrim,  // nếu Controller/DTO dùng 'otpCode'
            })

            const resetToken = extractResetToken(resp)
            if (!resetToken) return toast.error("Thiếu reset token từ máy chủ. Vui lòng thử lại.")

            if (typeof window !== "undefined") sessionStorage.setItem("reset_token", String(resetToken))
            toast.success("Xác minh OTP thành công. Hãy đặt lại mật khẩu.")
            router.push("/reset-password")
        } catch (err: any) {
            const payload = err?.payload as ApiEnvelope | undefined
            toast.error(friendlyFromPayload(payload, err?.message))
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        const emailTrim = email.trim()
        if (!emailTrim) { toast.error("Thiếu email. Vui lòng quay lại bước trước."); router.replace("/forgot_password"); return }
        if (!EMAIL_RE.test(emailTrim)) return toast.error("Email không hợp lệ")

        try {
            const res = await fetch(`${BACKEND_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailTrim }),
            })
            let env: ApiEnvelope<unknown>
            try { env = await res.json() } catch { env = { status: res.status, message: res.statusText } }
            const ok = env?.status ? env.status === 200 || env.status === 201 : res.ok
            if (!ok) throw Object.assign(new Error(env?.message || "Yêu cầu không thành công"), { payload: env })

            toast.success(env?.message || "Nếu email tồn tại, chúng tôi đã gửi mã mới")
        } catch (err: any) {
            const payload = err?.payload as ApiEnvelope | undefined
            toast.error(friendlyFromPayload(payload, err?.message))
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
                        Một mã 6 chữ số đã được gửi tới <span className="font-semibold break-all">{email}</span>. Nhập mã để tiếp tục đặt lại mật khẩu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="text" inputMode="numeric" maxLength={6}
                                placeholder="Nhập mã OTP 6 chữ số"
                                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="text-center text-xl tracking-widest border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                                {isLoading ? "Đang xác nhận..." : "Xác nhận mã"}
                            </Button>
                            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/forgot_password")}>
                                Thay đổi email
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-600">
                            Không nhận được mã?{" "}
                            <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">
                                Gửi Lại
                            </button>
                        </div>

                        <div className="text-center">
                            <button type="button" onClick={() => router.push("/")} className="text-sm text-gray-500 hover:underline">
                                Quay lại trang chủ
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
