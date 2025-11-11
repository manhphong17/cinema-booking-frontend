"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Calendar, Loader2, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { 
    fetchTheaterHistory, 
    fetchTheaterHistoryByDateRange,
    type TheaterUpdateHistory,
    type TheaterHistoryResponse 
} from "@/app/api/theater/theater-history"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

// Field name mapping
const fieldNameMap: Record<string, string> = {
    name: "Tên rạp",
    address: "Địa chỉ",
    hotline: "Hotline",
    contactEmail: "Email liên hệ",
    googleMapUrl: "Google Map URL",
    openTime: "Giờ mở cửa",
    closeTime: "Giờ đóng cửa",
    overnight: "Hoạt động qua đêm",
    bannerUrl: "Banner URL",
    information: "Thông tin rạp",
    representativeName: "Tên đại diện",
    representativeTitle: "Chức vụ đại diện",
    representativePhone: "SĐT đại diện",
    representativeEmail: "Email đại diện",
}

export function TheaterHistory() {
    const { toast } = useToast()
    const [historyData, setHistoryData] = useState<TheaterHistoryResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)
    
    // Filter state
    const [isFiltering, setIsFiltering] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Load history data
    useEffect(() => {
        loadHistory()
    }, [currentPage, isFiltering])

    const loadHistory = async () => {
        try {
            setLoading(true)
            
            let data: TheaterHistoryResponse
            
            if (isFiltering && startDate && endDate) {
                // Filter by date range
                data = await fetchTheaterHistoryByDateRange({
                    theaterId: 1,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    page: currentPage,
                    size: pageSize
                })
            } else {
                // Normal pagination
                data = await fetchTheaterHistory({
                    theaterId: 1,
                    page: currentPage,
                    size: pageSize
                })
            }
            
            setHistoryData(data)
        } catch (error: any) {
            console.error('Error loading theater history:', error)
            toast({
                title: "Lỗi",
                description: error.response?.data?.message || error.message || "Không thể tải lịch sử thay đổi",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFilter = () => {
        if (!startDate || !endDate) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn ngày bắt đầu và kết thúc",
                variant: "destructive",
            })
            return
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            toast({
                title: "Lỗi",
                description: "Ngày bắt đầu phải trước ngày kết thúc",
                variant: "destructive",
            })
            return
        }
        
        setIsFiltering(true)
        setCurrentPage(1)
    }

    const clearFilter = () => {
        setStartDate("")
        setEndDate("")
        setIsFiltering(false)
        setCurrentPage(1)
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const formatValue = (value: string, field: string): string => {
        if (!value || value === "null") return "Không có"
        
        // Format boolean values
        if (field === "overnight") {
            return value === "true" ? "Có" : "Không"
        }
        
        // Truncate long values
        if (value.length > 100) {
            return value.substring(0, 100) + "..."
        }
        
        return value
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-8 h-8" />
                    Lịch sử thay đổi thông tin rạp
                </h1>
                <p className="text-gray-600 mt-2">Theo dõi tất cả các thay đổi về thông tin rạp chiếu phim</p>
            </div>

            {/* Filter Section */}
            <Card className="bg-white border-blue-100 shadow-md">
                <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Lọc theo thời gian
                    </CardTitle>
                    <CardDescription>Tìm kiếm lịch sử thay đổi trong khoảng thời gian cụ thể</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="start-date" className="text-gray-900">
                                Từ ngày
                            </Label>
                            <Input
                                id="start-date"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="end-date" className="text-gray-900">
                                Đến ngày
                            </Label>
                            <Input
                                id="end-date"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleFilter} className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Lọc
                            </Button>
                            {isFiltering && (
                                <Button 
                                    variant="outline" 
                                    onClick={clearFilter}
                                    className="flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Xóa lọc
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {isFiltering && (
                        <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            Đang lọc từ {format(new Date(startDate), "dd/MM/yyyy HH:mm", { locale: vi })} 
                            {" đến "} 
                            {format(new Date(endDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History Table */}
            <Card className="bg-white border-blue-100 shadow-md">
                <CardHeader>
                    <CardTitle className="text-gray-900">
                        Danh sách thay đổi
                        {historyData && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                                (Tổng: {historyData.totalItems} bản ghi)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!historyData || historyData.history.length === 0 ? (
                        <div className="text-center py-12 text-gray-600">
                            Không có lịch sử thay đổi
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Trường</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giá trị cũ</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giá trị mới</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Người sửa</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.history.map((item: TheaterUpdateHistory) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{item.id}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {fieldNameMap[item.updatedField] || item.updatedField}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                {formatValue(item.oldValue, item.updatedField)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-blue-600 font-medium max-w-xs truncate">
                                                {formatValue(item.newValue, item.updatedField)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{item.updatedBy}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {historyData && historyData.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-600">
                                Trang {currentPage} / {historyData.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === historyData.totalPages}
                                >
                                    Sau
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
