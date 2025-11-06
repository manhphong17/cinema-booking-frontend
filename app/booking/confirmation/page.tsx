"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Ticket, Home, Info } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import apiClient from "@/src/api/interceptor"

export default function ConfirmationPage() {
    const router = useRouter()
    const params = useSearchParams()
    const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">("PENDING")
    const [loading, setLoading] = useState(true)


    //  Call backend API to verify payment result
    useEffect(() => {
        const fetchReturn = async () => {
            try {
                const query = window.location.search
                const data = await apiClient.get(`/payment/return${query}`)
                if (data.data?.data?.status === "SUCCESS") {
                    setStatus("SUCCESS")
                } else {
                    setStatus("FAILED")
                }

            } catch (error) {
                console.error("Error verifying VNPay return:", error)
                setStatus("FAILED")
            } finally {
                setLoading(false)
            }
        }
        fetchReturn()
    }, [])

    if (loading) {
        return (
            <HomeLayout>
                <div className="flex h-[60vh] items-center justify-center text-gray-500">
                    Đang xác minh giao dịch...
                </div>
            </HomeLayout>
        )
    }

    const isSuccess = status === "SUCCESS"

    return (
        <HomeLayout>
            <main className="flex flex-col justify-center items-center min-h-[calc(100vh-220px)] bg-gradient-to-b from-background to-gray-50/50">
                <div className="container mx-auto px-4 pt-10 pb-8 flex flex-col items-center">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                                isSuccess ? "bg-green-100" : "bg-red-100"
                            }`}
                        >
                            {isSuccess ? (
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            ) : (
                                <XCircle className="h-10 w-10 text-red-600" />
                            )}
                        </div>

                        <h1
                            className={`text-2xl font-semibold mb-3 ${
                                isSuccess ? "text-green-700" : "text-red-700"
                            }`}
                        >
                            {isSuccess ? "Thanh toán thành công 🎉" : "Thanh toán không thành công 😢"}
                        </h1>

                        <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
                            {isSuccess
                                ? "Cảm ơn bạn đã hoàn tất thanh toán! Vé điện tử của bạn đã sẵn sàng xem trong mục 'Đơn hàng của tôi'."
                                : "Rất tiếc, giao dịch của bạn chưa được hoàn tất. Vui lòng kiểm tra lại hoặc thử thanh toán lại sau."}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        {isSuccess ? (
                            <>
                                <Button
                                    onClick={() => router.push("/")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Home className="h-4 w-4 mr-2" /> Về trang chủ
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/customer?section=orders")}
                                >
                                    <Ticket className="h-4 w-4 mr-2" /> Xem vé điện tử
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => router.push("/")}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Home className="h-4 w-4 mr-2" /> Về trang chủ
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </HomeLayout>

    )
}
