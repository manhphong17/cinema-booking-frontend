"use client"

import type React from "react"
import {useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {Eye, EyeOff, Film} from "lucide-react"
import {toast} from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showVerifyModal, setShowVerifyModal] = useState(false)
    const router = useRouter()

    const validateLogin = (email: string, password: string) => {
        if (!email.trim() || !password.trim()) {
            return "Vui lòng nhập email và mật khẩu"
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return "Email không đúng định dạng"
        }
        if (password.length < 8 || password.length > 20) {
            return "Mật khẩu phải từ 8 đến 20 ký tự"
        }
        return null
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const errorMsg = validateLogin(email, password)
        if (errorMsg) {
            toast.error(errorMsg)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(BACKEND_BASE_URL + "/auth/log-in", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password}),
            })

            const data = await response.json()

            if (data.status === 200 && data.data.accessToken) {
                const roles: string[] = data.data.roleName
                const allowedRoles = ["ADMIN", "OPERATION", "STAFF", "BUSINESS"];

                if (!roles.some(r => allowedRoles.includes(r))) {
                    toast.error("Trang đăng nhập này chỉ dành cho nhân viên hệ thống")
                    return;
                }
                localStorage.setItem("accessToken", data.data.accessToken)
                localStorage.setItem("userId", String(data.data.userId))
                localStorage.setItem("roleName", JSON.stringify(data.data.roleName))
                localStorage.setItem("email", data.data.email)

                toast.success(data.message)
                if (roles.includes("ADMIN")) {
                    router.push("/admin")
                } else if (roles.includes("OPERATION")) {
                    router.push("/operator-manager")
                } else if (roles.includes("STAFF")) {
                    router.push("/staff")
                } else if (roles.includes("BUSINESS")) {
                    router.push("/business")
                }
            } else if (data.status === 1003) {
                setShowVerifyModal(true)
            } else if (data.status === 1004) {
                toast.error("Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động")
            } else {
                toast.error("Email hoặc mật khẩu không chính xác")
            }
        } catch (err) {
            toast.error("Có lỗi xảy ra. Vui lòng thử lại sau")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        try {
            const res = await fetch(
                BACKEND_BASE_URL + "/auth/resend-verification?email=" + encodeURIComponent(email),
                {method: "POST"}
            )
            if (res.ok) {
                toast.success("Email xác minh đã được gửi lại. Vui lòng nhập mã OTP để xác minh tài khoản.")
                setShowVerifyModal(false)
                sessionStorage.setItem("verifyEmail", email)
                sessionStorage.setItem("verifyContext", "login")
                router.push("/verify-otp")
            } else {
                toast.error("Không thể gửi lại email")
            }
        } catch {
            toast.error("Có lỗi xảy ra khi gửi lại email")
        } finally {
            setShowVerifyModal(false)
        }
    }

    const handleGoogleSignIn = () => {
        window.location.href = BACKEND_BASE_URL + "/oauth2/authorization/google-admin"
    }

    const handleForgotPassword = () => {
        router.push("/forgot-password")
    }

    const handleRegister = () => {
        router.push("/register")
    }

    return (
        <>
            {/* Modal xác minh email */}
            <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tài khoản chưa được xác minh</DialogTitle>
                        <DialogDescription>
                            Vui lòng kiểm tra hộp thư để xác minh tài khoản. Nếu chưa nhận được email, bạn có thể gửi
                            lại.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowVerifyModal(false)}>Đóng</Button>
                        <Button onClick={handleResendVerification}>Gửi lại email</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Form đăng nhập */}
            <div
                className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl border-0">
                    <CardHeader className="text-center space-y-4">
                        <div className="flex justify-center mb-4">
                            <div
                                className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-full shadow-lg">
                                <Film className="h-8 w-8"/>
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">PHT Cinema VietNam</CardTitle>
                        <CardDescription className="text-gray-600">Chào mừng quay lại</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Nhập email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>

                            <div className="text-right">
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-sm text-primary hover:text-primary/80"
                                    onClick={handleForgotPassword}
                                >
                                    Quên mật khẩu?
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                            </Button>
                        </form>

                        <div className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"/>
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"/>
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        fill="#FBBC05"/>
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"/>
                                </svg>
                                Đăng nhập với Google
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}