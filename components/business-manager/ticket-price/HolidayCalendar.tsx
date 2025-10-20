"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HolidayList } from "./HolidayList"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddHolidayDialog } from "./AddHolidayDialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import apiClient from "@/src/api/interceptor"

// ==========================
// 🔹 Kiểu dữ liệu thống nhất
// ==========================
export interface Holiday {
    id: number
    date: string
    isRecurring: boolean
    description?: string
}

export interface HolidayRequest {
    date: string
    description: string
    isRecurring: boolean
}

interface HolidayCalendarProps {
    holidays: Holiday[]
    onHolidaysChange: (holidays: Holiday[]) => void
    loading?: boolean
    filterType: string
    onFilterTypeChange: (type: string) => void
    onYearChange?: (year: number) => void
}

export function HolidayCalendar({
                                    holidays,
                                    onHolidaysChange,
                                    loading,
                                    filterType,
                                    onFilterTypeChange,
                                    onYearChange,
                                }: HolidayCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1))
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    // Reset phân trang khi đổi filter
    useEffect(() => {
        setCurrentPage(1)
    }, [filterType])

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const getDaysInMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

    // ==========================
    // 🎯 Kiểm tra ngày lễ
    // ==========================
    const isHoliday = (day: number) => {
        const dateStrFull = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const dateStrShort = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

        return holidays.some((h) => {
            const normalized = h.date?.substring(0, 10)?.trim()
            if (!normalized) return false
            return h.isRecurring ? normalized === dateStrShort : normalized === dateStrFull
        })
    }

    const isRecurringHoliday = (day: number) => {
        const dateStrShort = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        return holidays.some(
            (h) => h.isRecurring && (h.date === dateStrShort || h.date.endsWith(dateStrShort))
        )
    }

    // ==========================
    // 🗑️ Xóa ngày lễ theo id
    // ==========================
    const handleRemoveHoliday = async (id: number) => {
        try {
            await apiClient.delete(`/holidays/${id}`)
            toast.success("Xoá ngày lễ thành công!")
            onHolidaysChange(holidays.filter((h) => h.id !== id))
        } catch (err) {
            console.error("Xoá ngày lễ thất bại:", err)
            toast.error("Không thể xoá ngày lễ, vui lòng thử lại!")
        }
    }

    // ==========================
    // 📅 Chọn ngày thêm
    // ==========================
    const handleSelectDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        setSelectedDays((prev) =>
            prev.includes(dateStr)
                ? prev.filter((d) => d !== dateStr)
                : [...prev, dateStr]
        )
    }

    // ==========================
    // ➕ Thêm ngày lễ mới (BE trả Holiday[])
    // ==========================
    const handleAddHolidays = (newHolidays: Holiday[]) => {
        onHolidaysChange([...holidays, ...newHolidays])
        setSelectedDays([])
    }

    // ==========================
    // ⏪⏩ Điều hướng tháng
    // ==========================
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    // ==========================
    // 🧩 Render
    // ==========================
    return (
        <Card className="bg-white border-blue-100 shadow-md">
            <CardHeader>
                <CardTitle className="text-gray-900">Lịch Ngày Lễ</CardTitle>
                <CardDescription className="text-gray-600">
                    Thiết lập các ngày lễ được áp dụng giá vé cuối tuần / ngày lễ.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ===== Lịch ===== */}
                    <div className="w-full lg:w-[70%] flex flex-col gap-4">
                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={prevMonth}
                                    className="border-blue-200 bg-transparent"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-lg font-semibold text-gray-900 min-w-48 text-center">
                  Tháng {month + 1} / {year}
                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={nextMonth}
                                    className="border-blue-200 bg-transparent"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            <Select
                                value={year.toString()}
                                onValueChange={(y) => {
                                    const newYear = Number(y)
                                    setCurrentDate(new Date(newYear, month, 1))
                                    onYearChange?.(newYear)
                                }}
                            >
                                <SelectTrigger className="w-32 border-blue-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Calendar */}
                        <div className="border border-blue-100 rounded-lg bg-blue-50 flex justify-center p-3">
                            <div className="w-full max-w-3xl h-[50vh] overflow-y-auto rounded-md bg-blue-50 p-2">
                                <div className="grid grid-cols-7 gap-2 place-items-center">
                                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                                        <div
                                            key={day}
                                            className="text-center font-semibold text-gray-600 text-sm py-1"
                                        >
                                            {day}
                                        </div>
                                    ))}

                                    {emptyDays.map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square w-9 sm:w-12 md:w-14" />
                                    ))}

                                    {days.map((day) => {
                                        const holiday = isHoliday(day)
                                        const recurring = isRecurringHoliday(day)
                                        return (
                                            <div key={day} className="relative">
                                                <button
                                                    onClick={() => handleSelectDay(day)}
                                                    className={`w-9 sm:w-12 md:w-14 aspect-square rounded-lg font-medium text-sm transition-colors 
                            ${
                                                        holiday
                                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                                            : selectedDays.includes(
                                                                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                                                            )
                                                                ? "bg-blue-200 text-blue-900 border border-blue-400"
                                                                : "bg-white text-gray-900 hover:bg-blue-50 border border-blue-100"
                                                    }`}
                                                >
                                                    {day}
                                                </button>

                                                {holiday && (
                                                    <div
                                                        className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
                                                            recurring ? "bg-amber-400" : "bg-red-500"
                                                        }`}
                                                    ></div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={() => setDialogOpen(true)}
                                disabled={selectedDays.length === 0}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Thêm ngày lễ
                            </Button>
                        </div>
                    </div>

                    {/* ===== Danh sách ngày lễ ===== */}
                    <HolidayList
                        holidays={holidays}
                        filterType={filterType}
                        onFilterChange={onFilterTypeChange}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        loading={loading}
                        onRemoveHoliday={handleRemoveHoliday}
                        year={year}
                    />
                </div>
            </CardContent>

            <AddHolidayDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                selectedDays={selectedDays}
                onSave={handleAddHolidays}
            />
        </Card>
    )
}
