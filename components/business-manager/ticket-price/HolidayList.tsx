"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Loader2 } from "lucide-react"

interface Holiday {
    id: number
    date: string
    isRecurring: boolean
    description?: string
}

interface HolidayListProps {
    holidays: Holiday[]
    filterType: string
    onFilterChange: (type: string) => void
    currentPage: number
    onPageChange: (page: number) => void
    itemsPerPage: number
    loading?: boolean
    onRemoveHoliday: (id: number) => void // 🟢 sửa
    year: number
}

export function HolidayList({
                                holidays,
                                filterType,
                                onFilterChange,
                                currentPage,
                                itemsPerPage,
                                loading = false,
                                onPageChange,
                                onRemoveHoliday,
                                year,
                            }: HolidayListProps) {
    const indexOfLast = currentPage * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    const currentPageHolidays = holidays.slice(indexOfFirst, indexOfLast)
    const totalPages = Math.ceil(holidays.length / itemsPerPage)

    return (
        <div className="w-full lg:w-[30%] border border-blue-100 rounded-lg bg-gray-50 p-4 flex flex-col">
            {/* Header + Bộ lọc */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Danh sách ngày lễ</h3>

                <Select value={filterType} onValueChange={onFilterChange}>
                    <SelectTrigger className="w-[200px] border-blue-200 text-xs">
                        <SelectValue placeholder="Lọc loại ngày lễ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recurring">Ngày lễ cố định hàng năm</SelectItem>
                        <SelectItem value="yearly">Ngày lễ riêng của năm {year}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Danh sách ngày lễ */}
            <div className="space-y-2 overflow-y-auto h-[50vh]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : currentPageHolidays.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                        Chưa có ngày lễ nào
                    </p>
                ) : (
                    currentPageHolidays.map((holiday) => (
                        <div
                            key={holiday.id} // 🟢 dùng id để key
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 text-sm">
                    {holiday.date}
                  </span>
                                    <span className="text-gray-600 text-xs">
                    {holiday.description}
                  </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onRemoveHoliday(holiday.id)} // 🟢 gọi theo id
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {holidays.length > 0 && (
                <div className="flex justify-between items-center mt-3 text-sm">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    >
                        Trang trước
                    </Button>

                    <span className="text-gray-600">
            Trang {currentPage} / {totalPages || 1}
          </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    >
                        Trang sau
                    </Button>
                </div>
            )}
        </div>
    )
}
