"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SeatSetup, type SeatCell } from "./seat-setup"
import {
    fetchRooms, fetchRoomMeta, createRoom as createRoomApi,
    updateRoom as updateRoomApi,
    type RoomDto, type RoomTypeDto, type SeatTypeDto,
} from "@/app/api/room/rooms"
import { roomTypesApi } from "@/app/api/room/room-types"
import { fetchSeatMatrix, saveSeatMatrix, type SeatCellDto } from "@/app/api/room/seats"
import { seatTypesApi } from "@/app/api/room/seat-types"
import { friendlyFromPayload } from "@/src/utils/server-error"

const RoomTypeManager = dynamic(
    () =>
        import("@/components/operator/roomType-managerment").then(
            (m) => m.default,
        ),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại phòng…</div> },
)
const SeatTypeManager = dynamic(
    () =>
        import("@/components/operator/seatType-managerment").then(
            (m) => m.default,
        ),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại ghế…</div> },
)

interface RoomItem {
    id: number
    name: string
    roomTypeId: number | null
    roomTypeName: string
    rows: number
    columns: number
    capacity: number
    status: "active" | "inactive"
    description?: string | null
    screenType?: string | null
}

interface RoomManagementProps {
    onSelectRoom: (roomId: number) => void
}

interface SelectedRoomData {
    room: RoomItem
    matrix: SeatCell[][]
}

interface FormState {
    name: string
    roomTypeId: string
    rows: string
    columns: string
    status: "ACTIVE" | "INACTIVE"
}

export function RoomManagement({ onSelectRoom }: RoomManagementProps) {
    const roomTypeScrollRef = useRef<HTMLDivElement>(null)
    const seatTypeScrollRef = useRef<HTMLDivElement>(null)

    const { toast } = useToast()

    const [rooms, setRooms] = useState<RoomItem[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([])
    const [seatTypes, setSeatTypes] = useState<SeatTypeDto[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreateOpen, setCreateOpen] = useState(false)
    const [isRoomTypeOpen, setRoomTypeOpen] = useState(false)
    const [isSeatTypeOpen, setSeatTypeOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<SelectedRoomData | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [capacityFilter, setCapacityFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [formData, setFormData] = useState<FormState>({
        name: "",
        roomTypeId: "",
        rows: "",
        columns: "",
        status: "ACTIVE",
    })

    const transformSeatMatrix = useCallback(
        (matrixData: (SeatCellDto | null)[][]): SeatCell[][] => {
            return (matrixData ?? []).map((row, rIndex) =>
                (row ?? []).map((cell, cIndex): SeatCell => {
                    if (!cell) {
                        return { id: null, row: rIndex, column: cIndex, seatTypeId: -1, status: "AVAILABLE", seatTypeName: "Vô hiệu hóa" }
                    }
                    const isBlocked = cell.status === "BLOCKED";
                    return {
                        id: cell.id,
                        row: (cell.rowIndex ?? rIndex + 1) - 1,
                        column: (cell.columnIndex ?? cIndex + 1) - 1,
                        seatTypeId: isBlocked ? -1 : (cell.seatType?.id ?? -1),
                        status: isBlocked ? "BLOCKED" : "AVAILABLE",
                        seatTypeName: cell.seatType?.name,
                    }
                }),
            )
        },
        [],
    )

    const buildMatrixPayload = useCallback(
        (matrix: SeatCell[][]) => {
            const fallbackSeatTypeId = seatTypes[0]?.id;
            return {
                matrix: matrix.map((row) =>
                    row.map((cell) => {
                        if (!cell) return null;
                        if (cell.seatTypeId === -1) {
                            if (fallbackSeatTypeId === undefined) return null;
                            return {
                                id: cell.id ? Number(cell.id) : null,
                                rowIndex: cell.row + 1,
                                columnIndex: cell.column + 1,
                                seatTypeId: fallbackSeatTypeId,
                                status: "BLOCKED",
                            };
                        }
                        return {
                            id: cell.id ? Number(cell.id) : null,
                            rowIndex: cell.row + 1,
                            columnIndex: cell.column + 1,
                            seatTypeId: cell.seatTypeId,
                            status: cell.status,
                        }
                    }),
                ),
            }
        },
        [seatTypes],
    )

    const loadMeta = useCallback(async () => {
        try {
            const [activeRoomTypes, seatTypesRes] = await Promise.all([
                roomTypesApi.list(true),
                seatTypesApi.list(true)
            ]);
            if (activeRoomTypes && seatTypesRes) {
                setRoomTypes(activeRoomTypes ?? [])
                setSeatTypes(seatTypesRes ?? [])
            } else {
                toast({ title: "Không thể tải metadata", description: "Vui lòng thử lại sau." })
            }
        } catch (error: any) {
            console.error("Failed to fetch room meta", error)
            toast({ title: "Lỗi tải metadata", description: friendlyFromPayload(error?.response?.data, "Không thể tải loại phòng/ghế") })
        }
    }, [toast])

    const loadRooms = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchRooms({ page: 0, size: 500 })
            if (res.status === 200 && res.data) {
                const mapped: RoomItem[] = (res.data.items ?? []).map((room: RoomDto) => ({
                    id: room.id,
                    name: room.name,
                    roomTypeId: room.roomType?.id ?? null,
                    roomTypeName: room.roomType?.name ?? "Không xác định",
                    rows: room.rows,
                    columns: room.columns,
                    capacity: room.capacity ?? room.rows * room.columns,
                    status: room.status === "ACTIVE" ? "active" : "inactive",
                    description: room.description ?? undefined,
                    screenType: room.screenType ?? undefined,
                }))
                setRooms(mapped)
            } else {
                toast({ title: "Không thể tải danh sách phòng", description: friendlyFromPayload(res, "Vui lòng thử lại") })
            }
        } catch (error: any) {
            console.error("Failed to fetch rooms", error)
            toast({ title: "Lỗi tải phòng", description: friendlyFromPayload(error?.response?.data, "Không thể tải danh sách phòng") })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadMeta()
        loadRooms()
    }, [loadMeta, loadRooms])

    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => {
            const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = typeFilter === "all" || room.roomTypeId?.toString() === typeFilter
            const matchesStatus = statusFilter === "all" || room.status === statusFilter.toLowerCase()
            const matchesCapacity =
                capacityFilter === "all" ||
                (capacityFilter === "small" && room.capacity < 50) ||
                (capacityFilter === "medium" && room.capacity >= 50 && room.capacity < 100) ||
                (capacityFilter === "large" && room.capacity >= 100)
            return matchesSearch && matchesType && matchesStatus && matchesCapacity
        })
    }, [rooms, searchTerm, typeFilter, statusFilter, capacityFilter])

    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

    const resetForm = () => {
        setFormData({ name: "", roomTypeId: "", rows: "", columns: "", status: "ACTIVE" })
        setEditingRoom(null)
    }

    const handleSubmit = async () => {
        const rows = Number(formData.rows)
        const columns = Number(formData.columns)
        const roomTypeId = Number(formData.roomTypeId)
        if (!formData.name.trim() || !roomTypeId || !rows || !columns) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên, loại phòng, số hàng và số cột" })
            return
        }
        if (rows < 1 || columns < 1 || rows > 12 || columns > 12) {
            toast({
                title: "kích thước không hợp lệ",
                description: "Số hàng và số cột không được nhỏ hơn 1 hoặc lớn hơn 12",
            })
            return
        }
        const payload = { name: formData.name.trim(), roomTypeId, rows, columns, status: formData.status }
        try {
            setLoading(true)
            if (editingRoom) {
                await updateRoomApi(editingRoom.id, payload)
                toast({ title: "Cập nhật thành công", description: "Phòng chiếu đã được cập nhật" })
            } else {
                await createRoomApi(payload)
                toast({ title: "Thêm thành công", description: "Phòng chiếu mới đã được thêm" })
            }
            setCreateOpen(false)
            resetForm()
            await loadRooms()
        } catch (error: any) {
            console.error("Failed to submit room", error)
            toast({ title: "Lỗi", description: friendlyFromPayload(error?.response?.data, "Không thể lưu phòng chiếu") })
        } finally {
            setLoading(false)
        }
    }

    const updateRoomStatus = async (room: RoomItem, status: "ACTIVE" | "INACTIVE") => {
        const payload = { name: room.name, roomTypeId: room.roomTypeId ?? 0, rows: room.rows, columns: room.columns, status }
        await updateRoomApi(room.id, payload)
    }

    const deactivateRoom = async (room: RoomItem) => {
        try {
            setLoading(true)
            await updateRoomStatus(room, "INACTIVE")
            toast({ title: "Đã vô hiệu hóa", description: "Phòng chuyển sang không hoạt động" })
            await loadRooms()
        } catch (error: any) {
            toast({ title: "Lỗi vô hiệu hóa", description: friendlyFromPayload(error?.response?.data, "Không thể vô hiệu hóa phòng") })
        } finally {
            setLoading(false)
        }
    }

    const activateRoom = async (room: RoomItem) => {
        try {
            setLoading(true)
            await updateRoomStatus(room, "ACTIVE")
            toast({ title: "Đã bật lại", description: "Phòng đã hoạt động" })
            await loadRooms()
        } catch (error: any) {
            toast({ title: "Lỗi kích hoạt", description: friendlyFromPayload(error?.response?.data, "Không thể kích hoạt phòng") })
        } finally {
            setLoading(false)
        }
    }

    const openEditDialog = (room: RoomItem) => {
        setEditingRoom(room)
        setFormData({
            name: room.name,
            roomTypeId: room.roomTypeId ? room.roomTypeId.toString() : "",
            rows: room.rows.toString(),
            columns: room.columns.toString(),
            status: room.status === "active" ? "ACTIVE" : "INACTIVE",
        })
        setCreateOpen(true)
    }

    const handleSelectRoom = async (room: RoomItem) => {
        onSelectRoom(room.id)
        try {
            setLoading(true);
            await loadMeta();
            const res = await fetchSeatMatrix(room.id)
            if (res.status === 200 && res.data) {
                const matrix = transformSeatMatrix(res.data.matrix ?? [])
                setSelectedRoom({ room, matrix })
            } else {
                toast({ title: "Không thể tải sơ đồ ghế", description: friendlyFromPayload(res, "Vui lòng thử lại") })
            }
        } catch (error: any) {
            console.error("Failed to fetch seat matrix", error)
            toast({ title: "Lỗi tải ghế", description: friendlyFromPayload(error?.response?.data, "Không thể tải ma trận ghế") })
        } finally {
            setLoading(false);
        }
    }

    const handleBackFromSeatSetup = () => {
        setSelectedRoom(null)
    }

    const handleSaveSeatConfig = async (matrix: SeatCell[][]) => {
        if (!selectedRoom) return
        try {
            setLoading(true)
            const payload = buildMatrixPayload(matrix)
            await saveSeatMatrix(selectedRoom.room.id, payload)
            toast({ title: "Đã lưu cấu hình ghế", description: "Sơ đồ ghế đã được cập nhật" })
            setSelectedRoom(null)
            await loadRooms()
        } catch (error: any) {
            console.error("Failed to save seat matrix", error)
            toast({ title: "Lỗi", description: friendlyFromPayload(error?.response?.data, "Không thể lưu ma trận ghế") })
        } finally {
            setLoading(false)
        }
    }

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

    const handleRoomTypeDialogChange = (open: boolean) => {
        setRoomTypeOpen(open);
        if (!open) {
            loadRooms();
            loadMeta();
        }
    }

    const handleSeatTypeDialogChange = (open: boolean) => {
        setSeatTypeOpen(open);
        if (!open) {
            loadMeta();
        }
    }

    if (selectedRoom) {
        return (
            <SeatSetup
                room={selectedRoom.room}
                initialMatrix={selectedRoom.matrix}
                seatTypes={seatTypes}
                onBack={handleBackFromSeatSetup}
                onSave={handleSaveSeatConfig}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold text-foreground">Quản lý phòng chiếu</h1>
                    <p className="text-muted-foreground">Quản lý phòng chiếu và cấu hình sơ đồ ghế</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRoomTypeOpen(true)}>Quản lý loại phòng</Button>
                    {/*<Button variant="outline" onClick={() => setSeatTypeOpen(true)}>Quản lý loại ghế</Button>*/}
                    <Button onClick={() => setCreateOpen(true)} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm phòng
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2 text-muted-foreground"><Filter className="w-4 h-4" />Bộ lọc & tìm kiếm</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm font-medium text-foreground">Tìm kiếm theo tên</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input id="search" placeholder="Nhập tên phòng..." value={searchTerm} onChange={(e) => handleFilterChange("search", e.target.value)} className="pl-10 bg-input border-border text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Loại phòng</Label>
                            <Select value={typeFilter} onValueChange={(v) => handleFilterChange("type", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Tất cả loại" /></SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {roomTypes.map((type) => (<SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Trạng thái</Label>
                            <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Sức chứa</Label>
                            <Select value={capacityFilter} onValueChange={(v) => handleFilterChange("capacity", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Sức chứa" /></SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="small">Nhỏ (&lt;50 ghế)</SelectItem>
                                    <SelectItem value="medium">Vừa (50-99 ghế)</SelectItem>
                                    <SelectItem value="large">Lớn (≥100 ghế)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-transparent select-none">Clear</Label>
                            <Button variant="outline" onClick={clearFilters} className="w-full text-foreground hover:bg-muted">Xóa bộ lọc</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Danh sách phòng</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredRooms.length > 0 ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredRooms.length)} trong ${filteredRooms.length} phòng` : "Không có phòng phù hợp."}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground">Tên phòng</TableHead>
                                <TableHead className="text-muted-foreground">Loại phòng</TableHead>
                                <TableHead className="text-muted-foreground">Kích thước</TableHead>
                                <TableHead className="text-muted-foreground">Sức chứa</TableHead>
                                <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                                <TableHead className="text-muted-foreground text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRooms.map((room) => (
                                <TableRow key={room.id} className="border-border hover:bg-muted/30">
                                    <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                                    <TableCell className="text-foreground">{room.roomTypeName}</TableCell>
                                    <TableCell className="text-foreground">{room.rows} x {room.columns}</TableCell>
                                    <TableCell className="text-foreground">{room.capacity} ghế</TableCell>
                                    <TableCell>
                                        <Badge variant={room.status === "active" ? "default" : "secondary"} className={room.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                                            {room.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(room)} className="text-foreground hover:bg-muted" type="button"><Pencil className="w-4 h-4" /></Button>
                                            {room.status === "active" ? (
                                                <Button size="sm" variant="ghost" onClick={() => deactivateRoom(room)} className="text-destructive hover:bg-destructive/10" type="button" title="Vô hiệu hóa"><Trash2 className="w-4 h-4" /></Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" onClick={() => activateRoom(room)} className="text-primary hover:bg-primary/10" type="button" title="Bật lại"><Plus className="w-4 h-4" /></Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => handleSelectRoom(room)} className="text-primary hover:bg-primary/10" type="button"><Settings className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Trang {currentPage} / {totalPages} — Tổng {filteredRooms.length} phòng</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-foreground hover:bg-muted"><ChevronLeft className="w-4 h-4 mr-1" />Trước</Button>
                            <span className="text-sm text-muted-foreground">Trang {currentPage}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-foreground hover:bg-muted">Sau<ChevronRight className="w-4 h-4 ml-1" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 sm:max-w-lg">
                    <DialogHeader><DialogTitle className="text-foreground">{editingRoom ? "Sửa phòng chiếu" : "Thêm phòng mới"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2"><Label htmlFor="name" className="text-foreground">Tên phòng</Label><Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                        <div className="grid gap-2"><Label className="text-foreground">Loại phòng</Label><Select value={formData.roomTypeId} onValueChange={(value) => setFormData((prev) => ({ ...prev, roomTypeId: value }))}><SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger><SelectContent className="bg-popover border-border">{roomTypes.map((type) => (<SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>))}</SelectContent></Select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label htmlFor="rows" className="text-foreground">Số hàng</Label><Input id="rows" type="number" min={1} max={12} value={formData.rows} onChange={(e) => setFormData((prev) => ({ ...prev, rows: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                            <div className="grid gap-2"><Label htmlFor="columns" className="text-foreground">Số cột</Label><Input id="columns" type="number" min={1} max={12} value={formData.columns} onChange={(e) => setFormData((prev) => ({ ...prev, columns: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                        </div>
                        <div className="grid gap-2"><Label className="text-foreground">Trạng thái</Label><Select value={formData.status} onValueChange={(value: "ACTIVE" | "INACTIVE") => setFormData((prev) => ({ ...prev, status: value }))}><SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="ACTIVE">Hoạt động</SelectItem><SelectItem value="INACTIVE">Không hoạt động</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetForm() }} className="border-border text-foreground hover:bg-muted">Hủy</Button>
                        <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">Lưu</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isRoomTypeOpen} onOpenChange={handleRoomTypeDialogChange}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý loại phòng</DialogTitle>
                    </DialogHeader>
                    <div ref={roomTypeScrollRef} className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <RoomTypeManager scrollContainerRef={roomTypeScrollRef} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isSeatTypeOpen} onOpenChange={handleSeatTypeDialogChange}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý loại ghế</DialogTitle>
                    </DialogHeader>
                    <div ref={seatTypeScrollRef} className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <SeatTypeManager scrollContainerRef={seatTypeScrollRef} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
