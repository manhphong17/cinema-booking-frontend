"use client"

import type React from "react"
import {useState} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp"
import {Film} from "lucide-react"
import {toast} from "sonner"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export default function OTPVerifyPage() {
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Lấy email từ sessionStorage
    const email = sessionStorage.getItem("registerEmail")


    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email) {
            setError("Không tìm thấy email. Vui lòng quay lại bước đăng ký.")
            return
        }

        if (otp.length !== 6) {
            setError("Vui lòng nhập đầy đủ 6 số OTP")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(
                `${BACKEND_BASE_URL}/accounts/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}`,
                {method: "POST"}
            )

            const data = await response.json()

            if (response.ok) {
                toast.success(data.message || "Xác minh thành công!")
                router.push("/login")
            } else {
                setError(data.message || "OTP không hợp lệ")
                toast.error(data.message || "OTP không hợp lệ")
            }
        } catch (err) {
            setError("Không thể kết nối tới server")
            toast.error("Không thể kết nối tới server")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOTP = async () => {
        setIsResending(true)
        setError("")

        try {
            // Tạm thời gọi lại verify-otp (theo yêu cầu)
            const response = await fetch(
                `${BACKEND_BASE_URL}/accounts/verify-otp?email=${encodeURIComponent(email || "")}&otp=${otp || "000000"}`,
                {method: "POST"}
            )

            const data = await response.json()

            if (response.ok) {
                toast.success("OTP mới đã được gửi lại (giả lập)")
            } else {
                setError(data.message || "Không thể gửi lại OTP")
                toast.error(data.message || "Không thể gửi lại OTP")
            }
        } catch (err) {
            setError("Lỗi kết nối khi gửi lại OTP")
            toast.error("Lỗi kết nối khi gửi lại OTP")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl rounded-xl border-0">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary text-primary-foreground p-3 rounded-full">
                            <Film className="h-8 w-8"/>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Xác minh OTP</CardTitle>
                    <CardDescription className="text-gray-700">
                        Đã gửi mã OTP xác minh tài khoản về email của bạn,
                        hãy kiểm tra và nhập vào đây để tiếp tục.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                                containerClassName="group flex items-center has-disabled:opacity-30"
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0}/>
                                    <InputOTPSlot index={1}/>
                                    <InputOTPSlot index={2}/>
                                    <InputOTPSlot index={3}/>
                                    <InputOTPSlot index={4}/>
                                    <InputOTPSlot index={5}/>
                                </InputOTPGroup>
                            </InputOTP>

                            <p className="text-sm text-gray-800 text-center">Nhập mã OTP gồm 6 số</p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            disabled={isLoading || otp.length !== 6}
                        >
                            {isLoading ? "Đang xác minh..." : "Xác nhận"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-700">
                            Bạn không nhận được OTP?{" "}
                            <Button
                                variant="link"
                                className="p-0 h-auto text-sm font-normal text-primary hover:text-primary/80"
                                onClick={handleResendOTP}
                                disabled={isResending}
                            >
                                {isResending ? "Đang gửi..." : "Gửi lại mã"}
                            </Button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
