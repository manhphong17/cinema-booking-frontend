"use client"

import type React from "react"
import {useState, useEffect} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp"
import {Film} from "lucide-react"
import {toast} from "sonner"
import { BACKEND_BASE_URL } from "@/src/utils/config"

export default function OTPVerifyPage() {
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [email, setEmail] = useState<string | null>(null)
    const [name, setName] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Lấy email và name từ sessionStorage chỉ khi component mount (client-side)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedEmail = sessionStorage.getItem("registerEmail")
            const storedName = sessionStorage.getItem("name")
            setEmail(storedEmail)
            setName(storedName)
        }
    }, [])


    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email) {
            setError("Không tìm thấy email. Vui lòng quay lại bước đăng ký.")
            router.push("/register")
            return
        }

        if (otp.length !== 6) {
            setError("Vui lòng nhập đầy đủ 6 số OTP")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(
                `${BACKEND_BASE_URL}/auth/verify-otp?email=${encodeURIComponent(email)}&name=${name}&otp=${otp}`,
                {method: "POST"}
            )

            const data = await response.json()

            if (response.ok) {
                toast.success( "Xác minh thành công!")
                router.push("/login")
            } else {
                setError("OTP không hợp lệ")
                toast.error( "OTP không hợp lệ")
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

        if (!email) {
            setError("Không tìm thấy email. Vui lòng quay lại bước đăng ký.")
            router.push("/register")
            setIsResending(false)
            return
        }

        try {
            const response = await fetch(
                `${BACKEND_BASE_URL}/auth/resend-otp?email=${encodeURIComponent(email)}&name=${name || ""}`,
                {method: "POST"}
            )

            const data = await response.json()

            if (response.ok) {
                toast.success("OTP mới đã được gửi lại ")
            } else {
                setError( "Không thể gửi lại OTP")
                toast.error( "Không thể gửi lại OTP")
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
                <CardHeader className="space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg">
                                <Film className="h-6 w-6"/>
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
                    <CardTitle className="text-center text-2xl font-bold text-gray-900">Xác minh OTP</CardTitle>
                    <CardDescription className="text-center text-gray-700">
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
                            className="w-full text-white transition-all duration-300"
                            style={{ backgroundColor: '#38AAEC' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#38AAEC'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38AAEC'}
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
                                className="p-0 h-auto text-sm font-normal transition-colors"
                                style={{ color: '#38AAEC' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#38AAEC'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#38AAEC'}
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
