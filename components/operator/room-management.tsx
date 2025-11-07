"use client"

// Overview
// Function: Room management UI for cinema operator dashboard.
// Input: API clients (rooms, seats), user interactions (filters, forms), initial state.
// Output: Interactive CRUD for rooms, seat-map editor entry, and type managers via dialogs.

import { useCallback, useEffect, useMemo, useState } from "react"
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
import { SeatSetup } from "./seat-setup"
import {
    fetchRooms, fetchRoomMeta, createRoom as createRoomApi,
    updateRoom as updateRoomApi, deleteRoom as deleteRoomApi,
    type RoomDto, type RoomTypeDto, type SeatTypeDto,
} from "@/app/api/room/rooms"
import { fetchSeatMatrix, saveSeatMatrix, type SeatCellDto } from "@/app/api/room/seats"


// Function: Lazy-load management submodules for RoomType & SeatType.
// Input: None at call-time (dynamic import handles code-splitting).
// Output: Components loaded client-side only with loading placeholders.
const RoomTypeManager = dynamic(
    () => import("@/components/operator/roomType-managerment").then((m) => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại phòng…</div> },
)
const SeatTypeManager = dynamic(
    () => import("@/components/operator/seatType-managerment").then((m) => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại ghế…</div> },
)

// ===== Types =====
// Function: Define UI-only seat visualization enums.
// Input: N/A (type-level only).
// Output: SeatVisualType & SeatVisualStatus discriminated unions used across the UI.
type SeatVisualType = "standard" | "vip" | "disabled"
type SeatVisualStatus = "available" | "reserved" | "occupied" | "blocked"

// Function: Local seat cell view model.
// Input: N/A.
// Output: Runtime shape for seat grid cells consumed by SeatSetup.
interface SeatCell {
    id: string | null
    row: number
    column: number
    type: SeatVisualType
    status: SeatVisualStatus
    seatTypeId?: number
    seatTypeName?: string
}

// Function: Local room item view model for listing table.
// Input: N/A.
// Output: Transformed shape mapped from RoomDto for table rendering.
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

// Function: Parent callback prop contract.
// Input: roomId to select.
// Output: Notifies parent about room selection.
interface RoomManagementProps {
    onSelectRoom: (roomId: number) => void
}

// Function: Composite data used when entering seat setup.
// Input: Selected room & its current matrix.
// Output: Props for <SeatSetup/>.
interface SelectedRoomData {
    room: RoomItem
    matrix: SeatCell[][]
}

// Function: Form state shape for Create/Edit room dialog.
// Input: N/A.
// Output: Controlled form fields.
interface FormState {
    name: string
    roomTypeId: string
    rows: string
    columns: string
    status: "ACTIVE" | "INACTIVE"
}

// ===== Component =====
// Function: RoomManagement component (default exportable named export).
// Input: onSelectRoom callback from parent.
// Output: Full management UI and nested dialogs.
export function RoomManagement({ onSelectRoom }: RoomManagementProps) {
    const { toast } = useToast()

    // ---- State buckets ----
    // Function: Hold server data collections.
    // Input: Results from fetchRoomMeta & fetchRooms.
    // Output: roomTypes, seatTypes, rooms arrays for rendering and filtering.
    const [rooms, setRooms] = useState<RoomItem[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([])
    const [seatTypes, setSeatTypes] = useState<SeatTypeDto[]>([])

    // Function: Global loading flag for async actions.
    // Input: Async operations toggling setLoading.
    // Output: Disables buttons/spinners where needed.
    const [loading, setLoading] = useState(false)

    // Function: Dialog open flags.
    // Input: Clicks on buttons.
    // Output: Open/close Room/RoomType/SeatType dialogs.
    const [isCreateOpen, setCreateOpen] = useState(false)
    const [isRoomTypeOpen, setRoomTypeOpen] = useState(false)
    const [isSeatTypeOpen, setSeatTypeOpen] = useState(false)

    // Function: Track which room is being edited or configured.
    // Input: User action on table row buttons.
    // Output: Pre-fills form & enables seat setup mode.
    const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<SelectedRoomData | null>(null)

    // Function: Filters and pagination controls.
    // Input: User text/select changes.
    // Output: Derive filtered + paginated room list.
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [capacityFilter, setCapacityFilter] = useState<string>("all")

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Function: Controlled form state for Create/Edit dialog.
    // Input: OnChange handlers.
    // Output: Payload for create/update APIs.
    const [formData, setFormData] = useState<FormState>({
        name: "",
        roomTypeId: "",
        rows: "",
        columns: "",
        status: "ACTIVE",
    })

    // ===== Utilities =====
    // Function: Map seat type name to visual bucket (UI colors/legend).
    // Input: seatTypeName (string or null/undefined).
    // Output: SeatVisualType discriminant.
    const detectVisualType = useCallback((seatTypeName?: string | null): SeatVisualType => {
        const normalized = (seatTypeName ?? "").toLowerCase()
        if (normalized.includes("vip")) return "vip"
        if (normalized.includes("disable") || normalized.includes("khuyết") || normalized.includes("block")) return "disabled"
        return "standard"
    }, [])

    // Function: Convert API seat matrix (SeatCellDto[][]) to UI matrix (SeatCell[][]).
    // Input: matrixData from fetchSeatMatrix.
    // Output: UI-friendly matrix for SeatSetup with derived 'type' & 'status'.
    const transformSeatMatrix = useCallback(
        (matrixData: (SeatCellDto | null)[][]): SeatCell[][] => {
            return (matrixData ?? []).map((row, rIndex) =>
                (row ?? []).map((cell, cIndex) => {
                    if (!cell) {
                        return {
                            id: null,
                            row: rIndex,
                            column: cIndex,
                            type: "standard",
                            status: "available",
                        } satisfies SeatCell
                    }
                    const visualType = detectVisualType(cell.seatType?.name)
                    const status: SeatVisualStatus =
                        cell.isBlocked === true
                            ? "blocked"
                            : cell.status === "RESERVED"
                                ? "reserved"
                                : cell.status === "OCCUPIED"
                                    ? "occupied"
                                    : "available"

                    return {
                        id: cell.id !== null && cell.id !== undefined ? String(cell.id) : null,
                        row: (cell.rowIndex ?? rIndex + 1) - 1,
                        column: (cell.columnIndex ?? cIndex + 1) - 1,
                        type: visualType,
                        status,
                        seatTypeId: cell.seatType?.id ?? undefined,
                        seatTypeName: cell.seatType?.name ?? undefined,
                    } satisfies SeatCell
                }),
            )
        },
        [detectVisualType],
    )

    // Function: Build payload to persist seat matrix changes.
    // Input: matrix (SeatCell[][]) from SeatSetup save handler.
    // Output: { matrix: ... } payload matching saveSeatMatrix API.
    const buildMatrixPayload = useCallback(
        (matrix: SeatCell[][]) => {
            const typeToId: Record<SeatVisualType, number | undefined> = {
                standard: undefined,
                vip: undefined,
                disabled: undefined,
            }
            seatTypes.forEach((seatType) => {
                const visual = detectVisualType(seatType.name)
                if (!typeToId[visual]) {
                    typeToId[visual] = seatType.id
                }
            })
            const fallbackSeatTypeId =
                typeToId.standard ?? typeToId.vip ?? typeToId.disabled ?? seatTypes[0]?.id ?? 0

            return {
                matrix: matrix.map((row) =>
                    row.map((cell) => {
                        if (!cell) return null
                        const seatTypeId = cell.seatTypeId ?? typeToId[cell.type] ?? fallbackSeatTypeId
                        return {
                            id: cell.id ? Number(cell.id) : null,
                            rowIndex: cell.row + 1,
                            columnIndex: cell.column + 1,
                            seatTypeId,
                            status: cell.status === "blocked" ? "BLOCKED" : cell.status.toUpperCase(),
                            isBlocked: cell.status === "blocked" ? true : undefined,
                        }
                    }),
                ),
            }
        },
        [detectVisualType, seatTypes],
    )

    // ===== Data fetching =====
    // Function: Load and cache room & seat type metadata.
    // Input: None (calls fetchRoomMeta()).
    // Output: Populates roomTypes and seatTypes or shows toast error.
    const loadMeta = useCallback(async () => {
        try {
            const res = await fetchRoomMeta()
            if (res.status === 200 && res.data) {
                setRoomTypes(res.data.roomTypes ?? [])
                setSeatTypes(res.data.seatTypes ?? [])
            } else {
                toast({ title: "Không thể tải metadata", description: res.message || "Vui lòng thử lại" })
            }
        } catch (error) {
            console.error("Failed to fetch room meta", error)
            toast({ title: "Lỗi tải metadata", description: "Không thể tải loại phòng/ghế" })
        }
    }, [toast])

    // Function: Load rooms for list view.
    // Input: Pagination params (fixed: page 0, size 500).
    // Output: rooms[] state mapped to RoomItem shape, with toasts on failure.
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
                toast({ title: "Không thể tải danh sách phòng", description: res.message || "Vui lòng thử lại" })
            }
        } catch (error) {
            console.error("Failed to fetch rooms", error)
            toast({ title: "Lỗi tải phòng", description: "Không thể tải danh sách phòng" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    // Function: Bootstrap data on mount.
    // Input: None (effects call loadMeta & loadRooms).
    // Output: Populates state for initial render.
    useEffect(() => {
        loadMeta()
        loadRooms()
    }, [loadMeta, loadRooms])

    // ===== Derivations =====
    // Function: Compute filtered list based on search & filters.
    // Input: rooms, searchTerm, typeFilter, statusFilter, capacityFilter.
    // Output: Filtered array for pagination.
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

    // Function: Pagination helpers.
    // Input: filteredRooms.length, itemsPerPage, currentPage.
    // Output: totalPages, indices, and current page slice.
    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

    // ===== Helpers =====
    // Function: Reset create/edit form.
    // Input: None.
    // Output: Clears formData & editingRoom.
    const resetForm = () => {
        setFormData({ name: "", roomTypeId: "", rows: "", columns: "", status: "ACTIVE" })
        setEditingRoom(null)
    }

    // ===== Actions: Create/Update =====
    // Function: Validate & submit create/update room.
    // Input: formData state; editingRoom presence.
    // Output: Calls createRoomApi/updateRoomApi, shows toasts, refreshes list.
    const handleSubmit = async () => {
        const rows = Number(formData.rows)
        const columns = Number(formData.columns)
        const roomTypeId = Number(formData.roomTypeId)

        if (!formData.name.trim() || !roomTypeId || !rows || !columns) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên, loại phòng, số hàng và số cột" })
            return
        }

        const payload = {
            name: formData.name.trim(),
            roomTypeId,
            rows,
            columns,
            status: formData.status,
        }

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
            const message = error?.response?.data?.message ?? "Không thể lưu phòng chiếu"
            toast({ title: "Lỗi", description: message })
        } finally {
            setLoading(false)
        }
    }

    // Function: Update room status while preserving other fields.
    // Input: room (RoomItem), desired status.
    // Output: updateRoomApi call to persist status change.
    const updateRoomStatus = async (room: RoomItem, status: "ACTIVE" | "INACTIVE") => {
        // build đủ RoomPayload theo type của updateRoomApi
        const payload = {
            name: room.name,
            roomTypeId: room.roomTypeId ?? 0, // or enforce selection if API disallows 0
            rows: room.rows,
            columns: room.columns,
            status,
        }
        await updateRoomApi(room.id, payload)
    }

    // Function: Deactivate a room.
    // Input: room to deactivate.
    // Output: Persists status, shows toast, refreshes list.
    const deactivateRoom = async (room: RoomItem) => {
        try {
            setLoading(true)
            await updateRoomStatus(room, "INACTIVE")
            toast({ title: "Đã vô hiệu hóa", description: "Phòng chuyển sang không hoạt động" })
            await loadRooms()
        } finally {
            setLoading(false)
        }
    }

    // Function: Activate a room.
    // Input: room to activate.
    // Output: Persists status, shows toast, refreshes list.
    const activateRoom = async (room: RoomItem) => {
        try {
            setLoading(true)
            await updateRoomStatus(room, "ACTIVE")
            toast({ title: "Đã bật lại", description: "Phòng đã hoạt động" })
            await loadRooms()
        } finally {
            setLoading(false)
        }
    }

    // Function: Open edit dialog and preload form values.
    // Input: room selected from table.
    // Output: Shows dialog with formData set.
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

    // ===== Seat setup navigation =====
    // Function: Fetch seat matrix and enter seat setup screen.
    // Input: room selected.
    // Output: Sets selectedRoom with transformed matrix for <SeatSetup/>.
    const handleSelectRoom = async (room: RoomItem) => {
        onSelectRoom(room.id)
        try {
            const res = await fetchSeatMatrix(room.id)
            if (res.status === 200 && res.data) {
                const matrix = transformSeatMatrix(res.data.matrix ?? [])
                setSelectedRoom({ room, matrix })
            } else {
                toast({ title: "Không thể tải sơ đồ ghế", description: res.message || "Vui lòng thử lại" })
            }
        } catch (error) {
            console.error("Failed to fetch seat matrix", error)
            toast({ title: "Lỗi tải ghế", description: "Không thể tải ma trận ghế" })
        }
    }

    // Function: Leave seat setup and return to list view.
    // Input: None.
    // Output: Clears selectedRoom to render main list UI.
    const handleBackFromSeatSetup = () => {
        setSelectedRoom(null)
    }

    // Function: Persist seat grid changes.
    // Input: matrix from SeatSetup onSave.
    // Output: Calls saveSeatMatrix, shows toast, refreshes rooms, exits setup.
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
            const message = error?.response?.data?.message ?? "Không thể lưu ma trận ghế"
            toast({ title: "Lỗi", description: message })
        } finally {
            setLoading(false)
        }
    }

    // ===== Filters =====
    // Function: Centralized filter changes, resets pagination to page 1.
    // Input: type (which filter) and new value.
    // Output: Updates corresponding state and triggers re-compute.
    const handleFilterChange = (type: string, value: string) => {
        setCurrentPage(1)
        if (type === "search") setSearchTerm(value)
        else if (type === "type") setTypeFilter(value)
        else if (type === "status") setStatusFilter(value)
        else if (type === "capacity") setCapacityFilter(value)
    }

    // Function: Clear all filters.
    // Input: None.
    // Output: Resets filters and pagination.
    const clearFilters = () => {
        setSearchTerm("")
        setTypeFilter("all")
        setStatusFilter("all")
        setCapacityFilter("all")
        setCurrentPage(1)
    }

    // ===== Conditional Rendering =====
    // Function: Render seat setup view when a room is selected.
    // Input: selectedRoom presence.
    // Output: Delegates to <SeatSetup/> with proper props.
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

    // Function: Render main management UI when not in seat setup.
    // Input: Current state (filters, lists, dialog flags, etc.).
    // Output: Full page with toolbars, filters, table, pagination, and dialogs.
    return (
        <div className="space-y-6">
            {/* Header & actions */}
            {/* Function: Top toolbar */}
            {/* Input: Click interactions */}
            {/* Output: Opens Type/Ghế managers or Create dialog */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold text-foreground">Quản lý phòng chiếu</h1>
                    <p className="text-muted-foreground">Quản lý phòng chiếu và cấu hình sơ đồ ghế</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRoomTypeOpen(true)}>
                        Quản lý loại phòng
                    </Button>
                    <Button variant="outline" onClick={() => setSeatTypeOpen(true)}>
                        Quản lý loại ghế
                    </Button>
                    <Button onClick={() => setCreateOpen(true)} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm phòng
                    </Button>
                </div>
            </div>

            {/* Filters card */}
            {/* Function: Let users search/filter rooms */}
            {/* Input: searchTerm, type/status/capacity filters */}
            {/* Output: Updates filteredRooms via useMemo */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        Bộ lọc & tìm kiếm
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    className="pl-10 bg-input border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Loại phòng</Label>
                            <Select value={typeFilter} onValueChange={(v) => handleFilterChange("type", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả loại" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {roomTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Trạng thái</Label>
                            <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
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
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Sức chứa" />
                                </SelectTrigger>
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
                            <Button variant="outline" onClick={clearFilters} className="w-full text-foreground hover:bg-muted">
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rooms table card */}
            {/* Function: Display paginated rooms */}
            {/* Input: paginatedRooms */}
            {/* Output: Rows with action buttons */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Danh sách phòng</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredRooms.length > 0
                                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredRooms.length)} trong ${filteredRooms.length} phòng`
                                    : "Không có phòng phù hợp."}
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditDialog(room)}
                                                className="text-foreground hover:bg-muted"
                                                type="button"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>

                                            {/* Function: Toggle status */}
                                            {/* Input: room.status */}
                                            {/* Output: activate/deactivate effects */}
                                            {room.status === "active" ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deactivateRoom(room)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                    type="button"
                                                    title="Vô hiệu hóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => activateRoom(room)}
                                                    className="text-primary hover:bg-primary/10"
                                                    type="button"
                                                    title="Bật lại"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            )}

                                            {/* Function: Open seat setup */}
                                            {/* Input: room */}
                                            {/* Output: Navigate to SeatSetup view */}
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

                    {/* Pagination */}
                    {/* Function: Navigate pages */}
                    {/* Input: currentPage, totalPages */}
                    {/* Output: Updates currentPage and visible rows */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Trang {currentPage} / {totalPages} — Tổng {filteredRooms.length} phòng
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="text-foreground hover:bg-muted"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Trước
                            </Button>
                            <span className="text-sm text-muted-foreground">Trang {currentPage}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="text-foreground hover:bg-muted"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Room dialog */}
            {/* Function: Create or update a room */}
            {/* Input: formData; editingRoom flag */}
            {/* Output: API calls via handleSubmit */}
            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{editingRoom ? "Sửa phòng chiếu" : "Thêm phòng mới"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-foreground">
                                Tên phòng
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                className="bg-input border-border text-foreground"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-foreground">Loại phòng</Label>
                            <Select
                                value={formData.roomTypeId}
                                onValueChange={(value) => setFormData((prev) => ({ ...prev, roomTypeId: value }))}
                            >
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Chọn loại phòng" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {roomTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
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
                                <Input
                                    id="rows"
                                    type="number"
                                    min={1}
                                    value={formData.rows}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, rows: e.target.value }))}
                                    className="bg-input border-border text-foreground"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="columns" className="text-foreground">
                                    Số cột
                                </Label>
                                <Input
                                    id="columns"
                                    type="number"
                                    min={1}
                                    value={formData.columns}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, columns: e.target.value }))}
                                    className="bg-input border-border text-foreground"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-foreground">Trạng thái</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                                    setFormData((prev) => ({ ...prev, status: value }))
                                }
                            >
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                    <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                        <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Lưu
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RoomType manager dialog */}
            {/* Function: Manage room type taxonomy */}
            {/* Input: None (internal to RoomTypeManager) */}
            {/* Output: CRUD for room types (side-effect: affects filters & form options) */}
            <Dialog open={isRoomTypeOpen} onOpenChange={setRoomTypeOpen}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý loại phòng</DialogTitle>
                    </DialogHeader>
                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <RoomTypeManager />
                    </div>
                </DialogContent>
            </Dialog>

            {/* SeatType manager dialog */}
            {/* Function: Manage seat type taxonomy */}
            {/* Input: None (internal to SeatTypeManager) */}
            {/* Output: CRUD for seat types (side-effect: affects buildMatrixPayload mapping) */}
            <Dialog open={isSeatTypeOpen} onOpenChange={setSeatTypeOpen}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg">
                        <DialogTitle className="text-foreground">Quản lý loại ghế</DialogTitle>
                    </DialogHeader>
                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5">
                        <SeatTypeManager />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
