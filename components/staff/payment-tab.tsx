"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import BookingOrderSummary, { SeatInfo, ConcessionInfo } from "@/components/booking/booking-order-summary"
import PaymentMethodCardStaff from "@/components/staff/payment-method-card-staff"
import { apiClient } from "@/src/api/interceptor"

interface PaymentTabProps {
    seats: SeatInfo[]
    seatsTotal: number
    concessions: ConcessionInfo[]
    concessionsTotal: number
    total: number
    showtimeId: number | null
    onPaymentSuccess: () => void
}

export function PaymentTab({
                               seats,
                               seatsTotal,
                               concessions,
                               concessionsTotal,
                               total,
                               showtimeId,
                               onPaymentSuccess,
                           }: PaymentTabProps) {
    const [selectedPaymentCode, setSelectedPaymentCode] = useState<string | null>(null)
    const [selectedPaymentName, setSelectedPaymentName] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    //  Nhận data khi chọn payment method (code + name)
    const handleSelectPayment = (methodCode: string, methodName?: string) => {
        setSelectedPaymentCode(methodCode)
        setSelectedPaymentName(methodName || null)
    }


    //  Xử lý thanh toán (tùy theo phương thức)
    const handlePayment = async () => {
        if (!selectedPaymentName || !selectedPaymentCode) {
            toast.error("Vui lòng chọn phương thức thanh toán")
            return
        }

        const payload = {
            ticketIds: seats.map((s) => s.id),
            concessions: concessions.map((c) => ({
                concessionId: c.id,
                quantity: c.quantity,
            })),
            showtimeId,
            totalPrice: seatsTotal + concessionsTotal,
            discount: 0,
            amount: total,
            paymentCode: selectedPaymentCode,
        }

        try {
            setIsProcessing(true)

            // 🔹 Nếu là Tiền mặt → gọi checkout-cash
            if (selectedPaymentName.toLowerCase().includes("tiền mặt")) {
                const res = await apiClient.post("/payment/checkout-cash", payload)
                if (res.status === 200) {
                    toast.success("Thanh toán tiền mặt thành công!")
                    setPaymentSuccess(true)
                    setTimeout(() => {
                        setPaymentSuccess(false)
                        onPaymentSuccess()
                    }, 2000)
                }
            } else {
                // 🔹 Còn lại → gọi checkout (VNPay,...)
                const res = await apiClient.post("/payment/checkout", payload)
                if (res.status === 200) {
                    const payUrl = res.data?.data || res.data?.payUrl
                    if (payUrl) {
                        window.location.href = payUrl // chuyển sang trang thanh toán
                    } else {
                        toast.error("Không tìm thấy URL thanh toán")
                    }
                }
            }
        } catch (err: any) {
            console.error("Lỗi thanh toán:", err)
            toast.error(err?.response?.data?.message || "Không thể xử lý thanh toán")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex gap-6">
            {/* Cột trái */}
            <div className="flex-1 space-y-6">
                {/* 🔹 Chọn phương thức thanh toán */}
                <PaymentMethodCardStaff
                    onSelect={(code, name) => handleSelectPayment(code, name)}
                    includeCash={true}
                />

                {/* 🔹 Nút xác nhận thanh toán */}
                <Card>
                    <CardHeader>
                        <CardTitle>Xác nhận thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentSuccess ? (
                            <div className="text-center space-y-4 py-8">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                                <h3 className="text-2xl font-semibold text-green-600">Thanh toán thành công!</h3>
                                <p className="text-muted-foreground">Đơn hàng đã được ghi nhận</p>
                            </div>
                        ) : (
                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing || total <= 0}
                                className="w-full"
                                size="lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : selectedPaymentName ? (
                                    `Thanh toán qua ${selectedPaymentName} - ${total.toLocaleString("vi-VN")}đ`
                                ) : (
                                    `Chọn phương thức thanh toán`
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cột phải */}
            <div className="shrink-0 w-80">
                <BookingOrderSummary
                    title="Đơn hàng"
                    seats={seats}
                    seatsTotal={seatsTotal}
                    concessions={concessions}
                    concessionsTotal={concessionsTotal}
                    total={total}
                    showSeatTypeStats={false}
                />
            </div>
        </div>
    )
}
