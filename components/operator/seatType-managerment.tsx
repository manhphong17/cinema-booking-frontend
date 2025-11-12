"use client"

// ===================================================================================
// TỔNG QUAN COMPONENT: SeatTypesManager
//
// Chức năng:
// - Cung cấp một giao diện hoàn chỉnh để quản lý "Loại ghế" (ví dụ: Standard, VIP, Sweetbox).
// - Cho phép người dùng thực hiện các thao tác CRUD: Thêm, Sửa, và thay đổi trạng thái
//   (Kích hoạt/Vô hiệu hóa) các loại ghế.
// - Hiển thị màu sắc đại diện cho mỗi loại ghế, được tạo tự động và nhất quán.
// - Tích hợp các tính năng tìm kiếm và lọc danh sách theo trạng thái.
//
// Đầu vào:
// - `seatTypesApi`: Một object chứa các phương thức gọi API (list, create, update, etc.).
// - `generateColorFromString`: Hàm tiện ích để tạo màu sắc từ tên loại ghế.
// - Tương tác của người dùng: Nhập liệu vào form, click nút, chọn bộ lọc.
//
// Đầu ra:
// - Một giao diện người dùng bao gồm form nhập liệu và bảng hiển thị dữ liệu.
// - Các lệnh gọi API để cập nhật dữ liệu trên backend.
// - Các thông báo (toast) cho người dùng về kết quả của các thao tác.
// ===================================================================================

import { useEffect, useMemo, useState, useRef, RefObject, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Filter, Pencil, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { seatTypesApi } from "@/app/api/room/seat-types"
import type { SeatTypeDto } from "@/app/api/room/rooms"
import { generateColorFromString } from "@/lib/color"
import { friendlyFromPayload } from "@/src/utils/server-error"

// Định nghĩa kiểu dữ liệu cho trạng thái trên UI
type Status = "active" | "inactive"

// Chức năng: Chuyển đổi trạng thái từ `Status` của UI sang `boolean` mà backend yêu cầu.
// Đầu vào: s - chuỗi "active" hoặc "inactive".
// Đầu ra: boolean (true nếu "active", ngược lại là false).
const toBool = (s: Status): boolean => s === "active"

// Chức năng: Chuyển đổi trạng thái `boolean` từ backend sang `Status` để UI hiển thị.
// Đầu vào: b - giá trị boolean từ API.
// Đầu ra: chuỗi "active" hoặc "inactive".
const toStatus = (b: boolean): Status => (b ? "active" : "inactive")

interface SeatTypesManagerProps {
    scrollContainerRef: RefObject<HTMLDivElement>
}

export default function SeatTypesManager({ scrollContainerRef }: SeatTypesManagerProps) {
    const { toast } = useToast()

    // -------------------------------------------------------------------------------
    // KHỐI QUẢN LÝ STATE
    // -------------------------------------------------------------------------------
    const [loading, setLoading] = useState(false) // Cờ báo hiệu một thao tác bất đồng bộ đang diễn ra.
    const [items, setItems] = useState<SeatTypeDto[]>([]) // Danh sách các loại ghế từ API.
    const [search, setSearch] = useState("") // State cho ô tìm kiếm.
    const [statusFilter, setStatusFilter] = useState<"all" | Status>("all") // State cho bộ lọc trạng thái.
    const [form, setForm] = useState<{ id?: number; name: string; description: string; status: Status }>({
        id: undefined,
        name: "",
        description: "",
        status: "active",
    }) // State cho form Thêm/Sửa.

    // -------------------------------------------------------------------------------
    // KHỐI LẤY DỮ LIỆU VÀ XỬ LÝ SIDE EFFECT
    // -------------------------------------------------------------------------------

    // Chức năng: Cuộn container cha lên đầu.
    const scrollToTop = useCallback(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, [scrollContainerRef])

    // Chức năng: Tải danh sách các loại ghế từ API.
    // Đầu vào: `statusFilter` từ state để quyết định có lọc theo trạng thái không.
    // Đầu ra: Cập nhật state `items` với dữ liệu mới, hoặc hiển thị toast báo lỗi.
    const fetchList = async () => {
        setLoading(true)
        try {
            const onlyActive = statusFilter === "all" ? undefined : statusFilter === "active"
            const data = await seatTypesApi.list(onlyActive)
            setItems(data)
        } catch (e: any) {
            toast({ title: "Lỗi tải dữ liệu", description: friendlyFromPayload(e?.response?.data, "Không thể tải danh sách loại ghế") })
        } finally {
            setLoading(false)
        }
    }

    // Chức năng: Tự động gọi `fetchList` khi bộ lọc thay đổi hoặc khi component được tải lần đầu.
    // Đầu vào: `statusFilter` - dependency của effect.
    // Đầu ra: Một lần gọi hàm `fetchList`.
    useEffect(() => {
        fetchList()
    }, [statusFilter])

    // -------------------------------------------------------------------------------
    // KHỐI CÁC HÀM XỬ LÝ SỰ KIỆN (ACTION HANDLERS)
    // -------------------------------------------------------------------------------

    // Chức năng: Đưa form về trạng thái mặc định (chế độ "Thêm mới").
    const resetForm = () => setForm({ id: undefined, name: "", description: "", status: "active" })

    // Chức năng: Xóa tất cả các bộ lọc.
    const clearFilters = () => { setSearch(""); setStatusFilter("all"); }

    // Chức năng: Xử lý việc submit form (Thêm mới hoặc Cập nhật).
    // Đầu vào: State `form`.
    // Đầu ra: Gọi API tương ứng, hiển thị toast, tải lại danh sách và reset form.
    const onSubmit = async () => {
        if (!form.name.trim()) {
            toast({ title: "Thiếu tên", description: "Vui lòng nhập tên loại ghế" })
            return
        }
        try {
            if (form.id != null) {
                await seatTypesApi.update(form.id, {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    active: toBool(form.status),
                } as any)
                toast({ title: "Đã cập nhật", description: "Loại ghế đã được cập nhật" })
            } else {
                await seatTypesApi.create({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: toBool(form.status),
                } as any)
                toast({ title: "Đã thêm", description: "Loại ghế mới đã được thêm" })
            }
            await fetchList()
            resetForm()
        } catch (e: any) {
            toast({ title: "Lỗi thao tác", description: friendlyFromPayload(e?.response?.data, "Thao tác không thành công") })
        }
    }

    // Chức năng: Đổ dữ liệu của một mục vào form để bắt đầu chỉnh sửa.
    // Đầu vào: `it` - Object `SeatTypeDto` từ hàng được chọn trong bảng.
    // Đầu ra: Cập nhật state `form` với dữ liệu của mục đó.
    const onEdit = (it: SeatTypeDto) => {
        setForm({
            id: it.id,
            name: it.name,
            description: it.description || "",
            status: toStatus((it as any).active ?? ((it as any).status === "active")),
        })
        scrollToTop() // Tự động cuộn lên đầu khi nhấn sửa
    }

    // Chức năng: Chuyển đổi trạng thái active/inactive của một loại ghế.
    // Đầu vào: `id` của mục và `current` (trạng thái hiện tại).
    // Đầu ra: Gọi API `activate` hoặc `deactivate`, sau đó tải lại danh sách.
    const onToggle = async (id: number, current: Status) => {
        try {
            const isActive = toBool(current)
            if (isActive) await seatTypesApi.deactivate(id)
            else await seatTypesApi.activate(id)
            fetchList()
        } catch (e: any) {
            toast({ title: "Lỗi cập nhật trạng thái", description: friendlyFromPayload(e?.response?.data, "Không thể cập nhật trạng thái") })
        }
    }

    // -------------------------------------------------------------------------------
    // KHỐI DỮ LIỆU PHÁI SINH (DERIVED DATA - useMemo)
    // -------------------------------------------------------------------------------

    // Chức năng: Lọc danh sách `items` dựa trên `search` và `statusFilter`.
    // `useMemo` giúp việc lọc chỉ chạy lại khi dependency thay đổi, tối ưu hiệu suất.
    // Đầu vào: `items`, `search`, `statusFilter`.
    // Đầu ra: Mảng `filtered` chứa các mục đã được lọc để hiển thị trong bảng.
    const filtered = useMemo(() => {
        return items.filter(it => {
            const q = search.toLowerCase()
            const matchText = it.name.toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q)
            const active = (it as any).active ?? ((it as any).status === "active")
            const matchStatus = statusFilter === "all" || toStatus(active) === statusFilter
            return matchText && matchStatus
        })
    }, [items, search, statusFilter])

    // -------------------------------------------------------------------------------
    // KHỐI RENDER GIAO DIỆN (UI RENDERING)
    // -------------------------------------------------------------------------------
    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Card Form: Dùng để thêm mới hoặc cập nhật loại ghế */}
            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-4 space-y-2 min-w-0">
                        <Label className="text-foreground">Tên</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-input border-border text-foreground w-full" placeholder="VD: Standard, VIP..." />
                    </div>
                    <div className="lg:col-span-6 space-y-2 min-w-0">
                        <Label className="text-foreground">Mô tả</Label>
                        <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-input border-border text-foreground w-full" placeholder="Mô tả ngắn" />
                    </div>
                    <div className="lg:col-span-2 flex flex-wrap items-end gap-2 justify-end">
                        <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onSubmit} disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" />
                            {form.id ? "Cập nhật" : "Thêm mới"}
                        </Button>
                        {form.id && (<Button type="button" variant="outline" onClick={resetForm} disabled={loading}>Hủy</Button>)}
                    </div>
                </div>
            </Card>

            {/* Card Filters: Dùng để tìm kiếm và lọc danh sách */}
            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2 min-w-0">
                        <Label className="text-sm text-foreground">Tìm kiếm</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mô tả..." className="pl-10 bg-input border-border text-foreground w-full" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Trạng thái</Label>
                        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                            <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Không hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="hidden lg:flex items-end gap-2 text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        <span>{loading ? "Đang tải..." : `${filtered.length} kết quả`}</span>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-transparent select-none">Hành động</Label>
                        <Button variant="outline" onClick={clearFilters} className="w-full text-foreground hover:bg-muted">Xóa bộ lọc</Button>
                    </div>
                </div>
            </Card>

            {/* Card Table: Hiển thị danh sách các loại ghế đã được lọc */}
            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Màu</TableHead>
                            <TableHead className="text-muted-foreground">Tên</TableHead>
                            <TableHead className="text-muted-foreground">Mô tả</TableHead>
                            <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                            <TableHead className="text-muted-foreground">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(it => {
                                const active = (it as any).active ?? ((it as any).status === "active")
                                const color = generateColorFromString(it.name)
                                return (
                                    <TableRow key={it.id} className="border-border">
                                        <TableCell>
                                            <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: color }} />
                                        </TableCell>
                                        <TableCell className="text-foreground break-words">{it.name}</TableCell>
                                        <TableCell className="text-foreground break-words">{it.description || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={active ? "default" : "secondary"} className={active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                                                {active ? "Hoạt động" : "Không hoạt động"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(it)} className="hover:bg-muted">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => onToggle(it.id, toStatus(active))} className="hover:bg-muted">
                                                    {active ? "Tắt" : "Bật"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
