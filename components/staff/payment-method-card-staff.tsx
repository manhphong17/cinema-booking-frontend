"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronRight } from "lucide-react"
import { apiClient } from "@/src/api/interceptor"
import { toast } from "sonner"

interface PaymentMethod {
    paymentName: string
    paymentCode: string
    imageUrl: string
}

interface PaymentMethodCardStaffProps {
    onSelect: (methodCode: string, methodName?: string) => void;
    includeCash?: boolean // Cho phép hiển thị tiền mặt
}

export default function PaymentMethodCardStaff({ onSelect, includeCash = true }: PaymentMethodCardStaffProps) {
    const [mainMethods, setMainMethods] = useState<string[]>([])
    const [banks, setBanks] = useState<PaymentMethod[]>([])
    const [selectedMain, setSelectedMain] = useState<string | null>(null)
    const [selectedBank, setSelectedBank] = useState<PaymentMethod | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // 🔹 Lấy danh sách nhóm phương thức thanh toán (bao gồm cả tiền mặt)
    useEffect(() => {
        const fetchMainMethods = async () => {
            try {
                const res = await apiClient.get("bookings/payment-methods/all-distinct/")
                const methods = res.data?.data || []
                setMainMethods(methods)
            } catch (err) {
                console.error("Lỗi khi lấy phương thức thanh toán (staff):", err)
                toast.error("Không thể tải danh sách phương thức thanh toán")
            }
        }
        fetchMainMethods()
    }, [includeCash])

    // 🔹 Khi click 1 nhóm chính → mở dialog chọn bank
    const handleSelectMain = async (methodName: string) => {
        if (methodName !== selectedMain) {
            setSelectedBank(null)
            onSelect("") // reset
        }

        setSelectedMain(methodName)
        setDialogOpen(true)
        try {
            const res = await apiClient.get(`bookings/payment-methods/${encodeURIComponent(methodName)}`)
            setBanks(res.data.data || [])
        } catch (err) {
            console.error("Lỗi khi lấy danh sách ngân hàng:", err)
            toast.error("Không thể tải danh sách ngân hàng")
        }
    }

    // 🔹 Khi chọn bank cụ thể
    const handleSelectBank = (bank: PaymentMethod) => {
        setSelectedBank(bank)
        onSelect(bank.paymentCode, bank.paymentName)
        setDialogOpen(false)
    }

    return (
        <>
            <Card className="shadow-xl border-2 border-gray-200/80 rounded-xl bg-white transition-all duration-300">
                <CardHeader className="border-b">
                    <CardTitle className="text-xl font-bold text-gray-900">
                        Chọn phương thức thanh toán
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 mt-3">
                    {mainMethods.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">Không có phương thức thanh toán khả dụng</p>
                    ) : (
                        mainMethods.map((methodName) => (
                            <div key={methodName}>
                                <button
                                    onClick={() => handleSelectMain(methodName)}
                                    className={`w-full flex items-center justify-between border rounded-lg px-4 py-3 transition-all ${
                                        selectedMain === methodName
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="font-semibold text-gray-800">{methodName}</span>
                                    <ChevronRight className="text-red-500 w-5 h-5" />
                                </button>

                                {/* Nếu đã chọn bank, hiển thị bank đã chọn */}
                                {selectedMain === methodName && selectedBank && (
                                    <div className="mt-3 ml-4 flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50 shadow-inner">
                                        <img
                                            src={selectedBank.imageUrl}
                                            alt={selectedBank.paymentName}
                                            className="w-10 h-10 object-contain"
                                        />
                                        <span className="text-gray-800 font-medium">
                      {selectedBank.paymentName} - đã chọn
                    </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* === Dialog chọn ngân hàng === */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {selectedMain || "Chọn ngân hàng"}
                        </DialogTitle>
                    </DialogHeader>

                    {banks.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-10">
                            Không có ngân hàng khả dụng
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-6 p-6">
                            {banks.map((bank) => (
                                <button
                                    key={bank.paymentCode}
                                    onClick={() => handleSelectBank(bank)}
                                    className="flex items-center justify-center border border-gray-200 hover:border-blue-400
                  rounded-2xl p-6 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                                >
                                    <img
                                        src={bank.imageUrl || "/payment-default.png"}
                                        alt={bank.paymentName}
                                        className="w-24 h-12 object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
