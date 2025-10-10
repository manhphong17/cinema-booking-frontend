"use client"

import type React from "react"
import {useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Eye, EyeOff, Film} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {toast} from "sonner"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
console.log("API base:", BACKEND_BASE_URL)


export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState("")
    const [dateOfBirth, setDateOfBirth] = useState("")
    const [gender, setGender] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // Kiểm tra mật khẩu nhập lại
        if (password !== confirmPassword) {
            setError("Mật khẩu và Xác nhận mật khẩu không khớp")
            setIsLoading(false)
            return
        }

        // Kiểm tra bắt buộc nhập
        if (!email || !password || !name || !dateOfBirth || !gender) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc")
            setIsLoading(false)
            return
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("Email không hợp lệ")
            setIsLoading(false)
            return
        }

        // Kiểm tra độ dài mật khẩu
        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(BACKEND_BASE_URL + "/accounts/register-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword,
                    name,
                    dateOfBirth,
                    gender
                }),
            })

            const data = await response.json()

            if (data.status === 201) {
                toast.success(data.message || "Vui lòng kiểm tra email để xác thực OTP.")
                sessionStorage.setItem("registerEmail", email)
                router.push("/verify-otp")
            } else {
                setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.")
                toast.error(data.message || "Đăng ký thất bại. Vui lòng thử lại.")
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error("Lỗi khi đăng ký:", err.message)
                setError("Lỗi kết nối mạng. Vui lòng kiểm tra lại và thử lại.")
                toast.error("Lỗi kết nối mạng. Vui lòng kiểm tra lại và thử lại.")
            } else {
                console.error("Lỗi không xác định:", err)
                setError("Đã xảy ra lỗi. Vui lòng thử lại.")
                toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        window.location.href = BACKEND_BASE_URL + "/oauth2/authorization/google-user"
    }
    const handleVerifyOtpRedirect = () => {
        router.push("/verify-otp")
    }

    const handleLoginRedirect = () => {
        router.push("/login")
    }

    return (
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
                    <CardTitle className="text-3xl font-bold text-gray-900">PHT Cinema Vietnam</CardTitle>
                    <CardDescription className="text-gray-600">Trở thành thành viên ngay hôm nay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Họ và tên</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Ngày
                                        sinh</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        required
                                        className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Giới
                                        tính</Label>
                                    <Select onValueChange={setGender} required>
                                        <SelectTrigger
                                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50">
                                            <SelectValue placeholder="Chọn giới tính"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Nam</SelectItem>
                                            <SelectItem value="FEMALE">Nữ</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-600"/> :
                                        <Eye className="h-4 w-4 text-gray-600"/>}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Xác nhận mật
                                khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-600"/> :
                                        <Eye className="h-4 w-4 text-gray-600"/>}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="text-sm">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                        </Button>
                    </form>

                    <div className="space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 text-gray-700"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.20-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.60 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Đăng ký với Google
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Đã có tài khoản?{" "}
                                <a
                                    href="#"
                                    onClick={handleLoginRedirect}
                                    className="text-primary hover:text-primary/80 font-medium underline transition-colors"
                                >
                                    Đăng nhập tại đây
                                </a>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
