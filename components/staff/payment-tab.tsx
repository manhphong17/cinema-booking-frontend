"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, Printer } from "lucide-react"
import { toast } from "sonner"
import { jwtDecode } from "jwt-decode"
import { apiClient } from "@/src/api/interceptor"
import { getOrderDetail, OrderDetail } from "@/src/api/orders"
import BookingOrderSummary, { SeatInfo, ConcessionInfo } from "@/components/booking/booking-order-summary"
import PaymentMethodCardStaff from "@/components/staff/payment-method-card-staff"

interface PaymentTabProps {
    showtimeId: number | null
    onPaymentSuccess: () => void
}

export function PaymentTab({ showtimeId, onPaymentSuccess }: PaymentTabProps) {
    const [userId, setUserId] = useState<number | null>(null)
    const [seatData, setSeatData] = useState<any[]>([])
    const [concessions, setConcessions] = useState<any[]>([])
    const [comboQty, setComboQty] = useState<Record<string, number>>({})
    const [ticketIds, setTicketIds] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [selectedPaymentCode, setSelectedPaymentCode] = useState<string | null>(null)
    const [selectedPaymentName, setSelectedPaymentName] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)

    // 1️⃣ Decode userId từ accessToken
    useEffect(() => {
        try {
            const token = localStorage.getItem("accessToken")
            if (token) {
                const decoded: any = jwtDecode(token)
                setUserId(decoded.userId)
            }
        } catch (err) {
            console.error("Error decoding token:", err)
        }
    }, [])

    // 2️⃣ Fetch order session
    useEffect(() => {
        async function fetchOrderSession() {
            if (!showtimeId || !userId) return
            setIsLoading(true)
            try {
                const res = await apiClient.get(`/bookings/order-session`, {
                    params: { showtimeId, userId },
                })
                const session = res.data.data
                console.log("[Staff] Order session:", session)

                const ticketIds = session.ticketIds || []
                const concessionOrders = session.concessionOrders || []
                setTicketIds(ticketIds)

                // Fetch ticket details
                if (ticketIds.length > 0) {
                    const seatRes = await apiClient.get(`/bookings/tickets/details`, {
                        params: { ids: ticketIds.join(",") },
                    })
                    setSeatData(seatRes.data.data || [])
                }

                // Fetch concession details
                if (concessionOrders.length > 0) {
                    const comboIds = concessionOrders.map((c: any) => c.comboId)
                    const consRes = await apiClient.get(`/concession/list-by-ids`, {
                        params: { ids: comboIds.join(",") },
                    })
                    setConcessions(consRes.data.data || [])

                    // Map quantity
                    const map: Record<string, number> = {}
                    concessionOrders.forEach((c: any) => (map[c.comboId] = c.quantity))
                    setComboQty(map)
                }
            } catch (err) {
                console.error("Failed to fetch order session:", err)
                toast.error("Không thể tải thông tin đơn hàng")
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrderSession()
    }, [showtimeId, userId])

    // 3️⃣ Map ticket & concession info
    const seatsInfo: SeatInfo[] = useMemo(() => {
        return seatData.map((seat) => ({
            id: seat.ticketId,
            type: seat.seatType?.toLowerCase() || "standard",
            price: seat.ticketPrice,
        }))
    }, [seatData])

    const concessionsInfo: ConcessionInfo[] = useMemo(() => {
        return concessions
            .filter((item) => comboQty[item.concessionId] > 0)
            .map((item) => ({
                id: item.concessionId,
                name: item.name,
                quantity: comboQty[item.concessionId] || 0,
                price: item.price,
            }))
    }, [concessions, comboQty])

    // 4️⃣ Tổng tiền
    const seatsTotal = useMemo(() => seatData.reduce((sum, s) => sum + (s.ticketPrice || 0), 0), [seatData])
    const concessionsTotal = useMemo(
        () => concessionsInfo.reduce((sum, c) => sum + c.price * c.quantity, 0),
        [concessionsInfo]
    )
    const total = seatsTotal + concessionsTotal

    // 5️⃣ Nhận phương thức thanh toán
    const handleSelectPayment = (code: string, name?: string) => {
        setSelectedPaymentCode(code)
        setSelectedPaymentName(name || null)
    }

    // 6️⃣ Xử lý thanh toán
    const handlePayment = async () => {
        if (!selectedPaymentCode || !selectedPaymentName) {
            toast.error("Vui lòng chọn phương thức thanh toán")
            return
        }

        try {
            setIsProcessing(true)
            const payload = {
                userId,
                ticketIds,
                concessions: concessionsInfo.map((c) => ({
                    concessionId: c.id,
                    quantity: c.quantity,
                })),
                showtimeId,
                totalPrice: total,
                discount: 0,
                amount: total,
                paymentCode: selectedPaymentCode,
            }

            // Gọi API tương ứng
            if (selectedPaymentCode ==="CASH") {
                const res = await apiClient.post("/payment/checkout-cash", payload)
                if (res.status === 200) {
                    const orderId = res.data?.data?.orderId || res.data?.orderId
                    toast.success("Thanh toán tiền mặt thành công!")
                    setPaymentSuccess(true)
                    
                    // Fetch order details để hiển thị thông tin vé
                    if (orderId) {
                        try {
                            const order = await getOrderDetail(orderId)
                            setOrderDetail(order)
                        } catch (err) {
                            console.error("Failed to fetch order details:", err)
                        }
                    }
                }
            } else {
                const res = await apiClient.post("/payment/checkout", payload)
                const payUrl = res.data?.data || res.data?.payUrl
                if (payUrl) {
                    window.location.href = payUrl
                } else toast.error("Không tìm thấy URL thanh toán")
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err)
            toast.error("Không thể xử lý thanh toán")
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading)
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-600">Đang tải đơn hàng...</span>
            </div>
        )

    return (
        <div className="flex gap-6">
            {/* Cột trái */}
            <div className="flex-1 space-y-6">
                <PaymentMethodCardStaff onSelect={(code, name) => handleSelectPayment(code, name)} includeCash={true} />

                <Card>
                    <CardHeader>
                        <CardTitle>Xác nhận thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentSuccess ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                                    <h3 className="text-2xl font-semibold text-green-600">Thanh toán thành công!</h3>
                                    <p className="text-muted-foreground">Đơn hàng đã được ghi nhận</p>
                                </div>
                                
                                {orderDetail && (
                                    <>
                                        <div className="border-t pt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Mã đơn hàng:</span>
                                                <span className="font-mono font-semibold">{orderDetail.orderCode}</span>
                                            </div>
                                            {orderDetail.movieName && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-muted-foreground">Phim:</span>
                                                    <span className="font-semibold">{orderDetail.movieName}</span>
                                                </div>
                                            )}
                                            {orderDetail.roomName && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-muted-foreground">Phòng:</span>
                                                    <span>{orderDetail.roomName}</span>
                                                </div>
                                            )}
                                            {orderDetail.showtimeStart && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-muted-foreground">Suất chiếu:</span>
                                                    <span>{new Date(orderDetail.showtimeStart).toLocaleString("vi-VN")}</span>
                                                </div>
                                            )}
                                            {orderDetail.seats && orderDetail.seats.length > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-muted-foreground">Ghế:</span>
                                                    <span className="font-semibold">{orderDetail.seats.join(", ")}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <span className="text-sm font-medium text-muted-foreground">Tổng tiền:</span>
                                                <span className="text-lg font-bold text-green-600">{orderDetail.totalPrice.toLocaleString("vi-VN")}đ</span>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={() => window.print()} 
                                            variant="outline" 
                                            className="w-full"
                                            size="lg"
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            In vé
                                        </Button>
                                        
                                        <Button
                                            onClick={() => {
                                                setPaymentSuccess(false)
                                                setOrderDetail(null)
                                                onPaymentSuccess()
                                            }}
                                            className="w-full"
                                            size="lg"
                                        >
                                            Tiếp tục đặt vé
                                        </Button>
                                    </>
                                )}
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
                    seats={seatsInfo}
                    seatsTotal={seatsTotal}
                    concessions={concessionsInfo}
                    concessionsTotal={concessionsTotal}
                    total={total}
                    showSeatTypeStats={false}
                />
            </div>
        </div>
    )
}
