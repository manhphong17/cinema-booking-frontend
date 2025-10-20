"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import apiClient from "@/src/api/interceptor"
import { toast } from "sonner"
import { AxiosError } from "axios"

// =====================
// 💡 Kiểu dữ liệu rõ ràng
// =====================

// Dữ liệu gửi lên BE (không có id)
export interface HolidayRequest {
    date: string
    description: string
    isRecurring: boolean
}

// Dữ liệu BE trả về (có id)
export interface Holiday extends HolidayRequest {
    id: number
}

// =====================
// 🧩 Props
// =====================
interface AddHolidayDialogProps {
    open: boolean
    onClose: () => void
    selectedDays: string[]
    onSave: (newHolidays: Holiday[]) => void
}

export function AddHolidayDialog({ open, onClose, selectedDays, onSave }: AddHolidayDialogProps) {
    const [holidayData, setHolidayData] = useState<HolidayRequest[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Reset mỗi khi mở dialog mới
    useEffect(() => {
        if (open) {
            setHolidayData(selectedDays.map(d => ({ date: d, description: "", isRecurring: false })))
        }
    }, [selectedDays, open])

    const handleChange = (index: number, field: keyof HolidayRequest, value: any) => {
        setHolidayData(prev =>
            prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
        )
    }

    const toggleRecurring = (index: number) => {
        setHolidayData(prev =>
            prev.map((h, i) =>
                i === index ? { ...h, isRecurring: !h.isRecurring } : h
            )
        )
    }

    const handleSubmit = async () => {
        try {
            setSubmitting(true)

            // 🧠 Đổi key "date" → "holidayDate" cho đúng DTO BE
            const payload = holidayData.map(h => ({
                holidayDate: h.date,  // ✅ sửa chỗ này
                description: h.description,
                isRecurring: h.isRecurring
            }))

            const res = await apiClient.post("/holidays/create", payload)
            const created: Holiday[] = res.data.data

            toast.success("Thêm ngày lễ thành công!")
            onSave(created)
            onClose()
        } catch (err) {
            console.error("Create holidays failed:", err)
            const error = err as AxiosError<any>
            const statusCode = error.response?.data?.status || 0
            const message =
                error.response?.data?.message || "Không thể thêm ngày lễ"

            if (statusCode === 1028) {
                toast.warning("Ngày lễ này đã tồn tại!")
            } else {
                toast.error(message)
            }
        } finally {
            setSubmitting(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thêm Ngày Lễ</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                    {holidayData.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Chưa chọn ngày nào</p>
                    ) : (
                        holidayData.map((h, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2"
                            >
                                {/* Ngày */}
                                <div className="w-28 text-sm font-medium text-gray-800">{h.date}</div>

                                {/* Mô tả */}
                                <div className="flex-1">
                                    <Input
                                        placeholder="Nhập tên ngày lễ..."
                                        value={h.description}
                                        onChange={(e) =>
                                            handleChange(index, "description", e.target.value)
                                        }
                                        className="w-full"
                                    />
                                </div>

                                {/* Toggle “hằng năm” */}
                                <div className="flex items-center justify-end">
                                    <Button
                                        type="button"
                                        variant={h.isRecurring ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleRecurring(index)}
                                        className={`transition ${
                                            h.isRecurring
                                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {h.isRecurring ? "Đã set cho mọi năm" : "Set ngày lễ cho mọi năm"}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={holidayData.some((h) => !h.description.trim()) || submitting}
                    >
                        {submitting ? "Đang lưu..." : "Xác nhận"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
