"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SeatSetup } from "./seat-setup"

// Import CHUẨN cho 2 màn popup (render trong Dialog, không SSR)
const RoomTypeManager = dynamic(
    () => import("@/components/operator/roomType-managerment").then(m => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại phòng…</div> }
)
const SeatTypeManager = dynamic(
    () => import("@/components/operator/seatType-managerment").then(m => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại ghế…</div> }
)

interface Seat {
    id: string
    row: number
    column: number
    type: "standard" | "vip" | "disabled"
    status: "available" | "occupied" | "reserved"
}

interface Room {
    id: string
    name: string
    type: string
    capacity: number
    status: "active" | "inactive"
    seatMatrix: Seat[][]
    rows: number
    columns: number
}

interface RoomManagementProps {
    onSelectRoom: (roomId: string) => void
}

const ROOM_TYPES = ["Standard", "VIP", "IMAX", "4DX"] as const
type RoomType = (typeof ROOM_TYPES)[number]

export function RoomManagement({ onSelectRoom }: RoomManagementProps) {
    const { toast } = useToast()

    const [rooms, setRooms] = useState<Room[]>([])

    // 3 popup controlled
    const [isCreateOpen, setCreateOpen] = useState(false)
    const [isRoomTypeOpen, setRoomTypeOpen] = useState(false)
    const [isSeatTypeOpen, setSeatTypeOpen] = useState(false)

    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    // Search & filter
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [capacityFilter, setCapacityFilter] = useState<string>("all")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)

    const [formData, setFormData] = useState({
        name: "",
        type: "" as "" | RoomType,
        capacity: "",
        rows: "",
        columns: "",
        status: "active" as "active" | "inactive",
    })

    const generateSeatMatrix = (rows: number, columns: number): Seat[][] => {
        const matrix: Seat[][] = []
        for (let r = 0; r < rows; r++) {
            matrix[r] = []
            for (let c = 0; c < columns; c++) {
                matrix[r][c] = { id: `${r}-${c}`, row: r, column: c, type: "standard", status: "available" }
            }
        }
        return matrix
    }

    const handleSubmit = () => {
        const rows = Number(formData.rows)
        const columns = Number(formData.columns)
        const capacity = rows * columns

        if (!formData.name || !formData.type || !rows || !columns) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên, loại, số hàng và số cột" })
            return
        }

        if (editingRoom) {
            const updated: Room = {
                ...editingRoom,
                name: formData.name,
                type: formData.type,
                capacity,
                rows,
                columns,
                status: formData.status,
                seatMatrix: generateSeatMatrix(rows, columns),
            }
            setRooms(prev => prev.map(r => (r.id === editingRoom.id ? updated : r)))
            toast({ title: "Cập nhật thành công", description: "Phòng chiếu đã được cập nhật" })
        } else {
            const newRoom: Room = {
                id: Date.now().toString(),
                name: formData.name,
                type: formData.type,
                capacity,
                rows,
                columns,
                status: formData.status,
                seatMatrix: generateSeatMatrix(rows, columns),
            }
            setRooms(prev => [...prev, newRoom])
            toast({ title: "Thêm thành công", description: "Phòng chiếu mới đã được thêm" })
        }

        setCreateOpen(false)
        resetForm()
    }

    const handleDelete = (id: string) => {
        setRooms(prev => prev.filter(r => r.id !== id))
        toast({ title: "Xóa thành công", description: "Phòng chiếu đã được xóa" })
    }

    const resetForm = () => {
        setFormData({ name: "", type: "", capacity: "", rows: "", columns: "", status: "active" })
        setEditingRoom(null)
    }

    const openEditDialog = (room: Room) => {
        setEditingRoom(room)
        setFormData({
            name: room.name,
            type: room.type as RoomType,
            capacity: room.capacity.toString(),
            rows: room.rows.toString(),
            columns: room.columns.toString(),
            status: room.status,
        })
        setCreateOpen(true)
    }

    const handleSelectRoom = (room: Room) => setSelectedRoom(room)

    const handleSaveSeatConfig = (updatedRoom: Room) => {
        setRooms(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)))
        setSelectedRoom(null)
    }

    const handleBackFromSeatSetup = () => setSelectedRoom(null)

    // Filter + search
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = typeFilter === "all" || room.type === typeFilter
            const matchesStatus = statusFilter === "all" || room.status === statusFilter
            const matchesCapacity =
                capacityFilter === "all" ||
                (capacityFilter === "small" && room.capacity < 50) ||
                (capacityFilter === "medium" && room.capacity >= 50 && room.capacity < 100) ||
                (capacityFilter === "large" && room.capacity >= 100)

            return matchesSearch && matchesType && matchesStatus && matchesCapacity
        })
    }, [rooms, searchTerm, typeFilter, statusFilter, capacityFilter])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

    const handleFilterChange = (type: string, value: string) => {
        setCurrentPage(1)
        if (type === "search") setSearchTerm(value)
        else if (type === "type") setTypeFilter(value)
        else if (type === "status") setStatusFilter(value)
        else if (type === "capacity") setCapacityFilter(value)
    }

    const clearFilters = () => {
        setSearchTerm("")
        setTypeFilter("all")
        setStatusFilter("all")
        setCapacityFilter("all")
        setCurrentPage(1)
    }

    if (selectedRoom) {
        return <SeatSetup room={selectedRoom} onBack={handleBackFromSeatSetup} onSave={handleSaveSeatConfig} />
    }

    return (
        <div className="space-y-6">
            {/* Header + nút mở popup */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý Phòng chiếu</h1>
                    <p className="text-muted-foreground mt-1">Quản lý phòng chiếu và cấu hình ghế ngồi</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={e => {
                            setRoomTypeOpen(true)
                        }}
                    >
                        Loại phòng
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={e => {
                            setSeatTypeOpen(true)
                        }}
                    >
                        Loại ghế
                    </Button>

                    <Button
                        type="button"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={e => {
                            setCreateOpen(true)
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm phòng mới
                    </Button>
                </div>
            </div>

            {/* Search & Filter */}
            <Card className="bg-card border-border p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Tìm kiếm và Lọc</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm font-medium text-foreground">
                                Tìm kiếm theo tên
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Nhập tên phòng..."
                                    value={searchTerm}
                                    onChange={e => handleFilterChange("search", e.target.value)}
                                    className="pl-10 bg-input border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Loại phòng</Label>
                            <Select value={typeFilter} onValueChange={v => handleFilterChange("type", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả loại" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {ROOM_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Trạng thái</Label>
                            <Select value={statusFilter} onValueChange={v => handleFilterChange("status", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả trạng thái" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Sức chứa</Label>
                            <Select value={capacityFilter} onValueChange={v => handleFilterChange("capacity", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả sức chứa" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả sức chứa</SelectItem>
                                    <SelectItem value="small">Nhỏ (&lt; 50 ghế)</SelectItem>
                                    <SelectItem value="medium">Vừa (50-99 ghế)</SelectItem>
                                    <SelectItem value="large">Lớn (≥ 100 ghế)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground opacity-0">Clear</Label>
                            <Button variant="outline" onClick={clearFilters} className="w-full text-foreground hover:bg-muted" type="button">
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredRooms.length > 0
                  ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredRooms.length)} trong ${filteredRooms.length} phòng`
                  : "Chưa có phòng nào"}
            </span>
                        {filteredRooms.length !== rooms.length && rooms.length > 0 && (
                            <span className="text-primary">{rooms.length - filteredRooms.length} phòng đã được lọc</span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Bảng + phân trang */}
            <Card className="bg-card border-border p-6">
                {paginatedRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-xl font-medium text-foreground mb-2">Danh sách trống</div>
                        <p className="text-muted-foreground mb-6">Hãy tạo phòng chiếu đầu tiên của bạn.</p>
                        <Button
                            type="button"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={e => {
                                e.preventDefault()
                                setCreateOpen(true)
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm phòng mới
                        </Button>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground">Tên phòng</TableHead>
                                    <TableHead className="text-muted-foreground">Loại phòng</TableHead>
                                    <TableHead className="text-muted-foreground">Kích thước</TableHead>
                                    <TableHead className="text-muted-foreground">Sức chứa</TableHead>
                                    <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                                    <TableHead className="text-muted-foreground">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRooms.map(room => (
                                    <TableRow key={room.id} className="border-border hover:bg-muted/30">
                                        <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                                        <TableCell className="text-foreground">{room.type}</TableCell>
                                        <TableCell className="text-foreground">
                                            {room.rows} x {room.columns}
                                        </TableCell>
                                        <TableCell className="text-foreground">{room.capacity} ghế</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={room.status === "active" ? "default" : "secondary"}
                                                className={room.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                                            >
                                                {room.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(room)} className="text-foreground hover:bg-muted" type="button">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(room.id)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                    type="button"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSelectRoom(room)}
                                                    className="text-primary hover:bg-primary/10"
                                                    type="button"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-muted-foreground">
                                    Trang {currentPage} / {totalPages}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="text-foreground hover:bg-muted"
                                        type="button"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Trước
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNumber
                                            if (totalPages <= 5) pageNumber = i + 1
                                            else if (currentPage <= 3) pageNumber = i + 1
                                            else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i
                                            else pageNumber = currentPage - 2 + i

                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className={currentPage === pageNumber ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground hover:bg-muted"}
                                                    type="button"
                                                >
                                                    {pageNumber}
                                                </Button>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="text-foreground hover:bg-muted"
                                        type="button"
                                    >
                                        Sau
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Popup: tạo/sửa phòng */}
            <Dialog
                open={isCreateOpen}
                onOpenChange={open => {
                    setCreateOpen(open)
                    if (!open) resetForm()
                }}
            >
                <DialogContent className="bg-card text-card-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editingRoom ? "Sửa phòng chiếu" : "Thêm phòng mới"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-foreground">
                                Tên phòng
                            </Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-input border-border text-foreground" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type" className="text-foreground">
                                Loại phòng
                            </Label>
                            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as RoomType })}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Chọn loại phòng" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {ROOM_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rows" className="text-foreground">
                                    Số hàng
                                </Label>
                                <Input id="rows" type="number" min="1" max="20" value={formData.rows} onChange={e => setFormData({ ...formData, rows: e.target.value })} className="bg-input border-border text-foreground" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="columns" className="text-foreground">
                                    Số cột
                                </Label>
                                <Input id="columns" type="number" min="1" max="20" value={formData.columns} onChange={e => setFormData({ ...formData, columns: e.target.value })} className="bg-input border-border text-foreground" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="capacity" className="text-foreground">
                                Sức chứa (tự động tính)
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={formData.rows && formData.columns ? (Number(formData.rows) * Number(formData.columns)).toString() : ""}
                                disabled
                                className="bg-muted border-border text-muted-foreground"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status" className="text-foreground">
                                Trạng thái
                            </Label>
                            <Select value={formData.status} onValueChange={(v: "active" | "inactive") => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setCreateOpen(false)
                                resetForm()
                            }}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Hủy
                        </Button>
                        <Button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Lưu
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Popup: Loại phòng */}
            <Dialog open={isRoomTypeOpen} onOpenChange={setRoomTypeOpen}>
                <DialogContent
                    className="
      bg-card text-card-foreground
      border border-border/60      /* 1 lớp border mảnh */
      w-[85vw] max-w-[85vw] h-[92vh]
      p-0 rounded-lg shadow-xl
      sm:max-w-none
    "
                >
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý Loại phòng</DialogTitle>
                    </DialogHeader>

                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <RoomTypeManager />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Popup: Loại ghế */}
            <Dialog open={isSeatTypeOpen} onOpenChange={setSeatTypeOpen}>
                <DialogContent
                    className="
      bg-card text-card-foreground
      border border-border/60
      w-[85vw] max-w-[85vw] h-[92vh]
      p-0 rounded-lg shadow-xl
      sm:max-w-none
    "
                >
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý Loại ghế</DialogTitle>
                    </DialogHeader>

                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <SeatTypeManager />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
