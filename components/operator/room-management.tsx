"use client"

// ===================================================================================
// TỔNG QUAN COMPONENT: RoomManagement
//
// Chức năng:
// - Là giao diện chính để người vận hành (operator) quản lý toàn bộ phòng chiếu.
// - Hiển thị danh sách phòng chiếu với bộ lọc, tìm kiếm và phân trang.
// - Cho phép thực hiện các thao tác CRUD (Thêm, Sửa, Kích hoạt/Vô hiệu hóa) cho phòng chiếu.
// - Đóng vai trò là điểm khởi đầu để điều hướng đến giao diện "Thiết lập ghế" (SeatSetup).
// - Mở các dialog để quản lý các thực thể liên quan như "Loại phòng" và "Loại ghế".
//
// Đầu vào:
// - `onSelectRoom`: Một callback prop để thông báo cho component cha khi một phòng được chọn.
// - Tương tác của người dùng (nhập liệu vào form, click nút, chọn bộ lọc).
// - Dữ liệu từ các API (rooms, seats, room-types).
//
// Đầu ra:
// - Một giao diện người dùng hoàn chỉnh, có tính tương tác cao.
// - Các lệnh gọi API để cập nhật dữ liệu trên backend.
// ===================================================================================

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
import { SeatSetup, type SeatCell } from "./seat-setup"
import {
    fetchRooms, fetchRoomMeta, createRoom as createRoomApi,
    updateRoom as updateRoomApi,
    type RoomDto, type RoomTypeDto, type SeatTypeDto,
} from "@/app/api/room/rooms"
import { fetchSeatMatrix, saveSeatMatrix, type SeatCellDto } from "@/app/api/room/seats"
import { friendlyFromPayload } from "@/src/utils/server-error" // Import friendlyFromPayload

// Chức năng: Tải động (lazy-load) các component quản lý con.
// Lý do: Tối ưu hiệu suất. Các component này chỉ được tải về trình duyệt khi người dùng
//       mở dialog tương ứng, giúp giảm kích thước gói JavaScript ban đầu.
// Đầu vào: Đường dẫn đến component.
// Đầu ra: Component được tải về phía client, với một placeholder "Đang tải..." hiển thị trong khi chờ.
const RoomTypeManager = dynamic(
    () => import("@/components/operator/roomType-managerment").then((m) => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại phòng…</div> },
)
const SeatTypeManager = dynamic(
    () => import("@/components/operator/seatType-managerment").then((m) => m.default),
    { ssr: false, loading: () => <div className="p-6 text-muted-foreground">Đang tải Loại ghế…</div> },
)

// ===================================================================================
// CÁC ĐỊNH NGHĨA TYPE CỤC BỘ (VIEW MODELS)
// Chức năng: Định nghĩa cấu trúc dữ liệu chỉ được sử dụng trong giao diện của component này.
// ===================================================================================

// Chức năng: Định nghĩa cấu trúc dữ liệu cho một phòng chiếu khi hiển thị trong bảng danh sách.
// Nó là một phiên bản đã được "làm phẳng" và thân thiện với UI của `RoomDto` từ API.
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

// Chức năng: Định nghĩa props cho component RoomManagement.
interface RoomManagementProps {
    onSelectRoom: (roomId: number) => void
}

// Chức năng: Gom nhóm dữ liệu cần thiết khi chuyển sang màn hình thiết lập ghế.
interface SelectedRoomData {
    room: RoomItem
    matrix: SeatCell[][]
}

// Chức năng: Định nghĩa cấu trúc cho state của form Thêm/Sửa phòng chiếu.
interface FormState {
    name: string
    roomTypeId: string
    rows: string
    columns: string
    status: "ACTIVE" | "INACTIVE"
}

// ===================================================================================
// COMPONENT CHÍNH: RoomManagement
// ===================================================================================
export function RoomManagement({ onSelectRoom }: RoomManagementProps) {
    const { toast } = useToast()

    // -------------------------------------------------------------------------------
    // KHỐI QUẢN LÝ STATE
    // Chức năng: Khai báo tất cả các state cần thiết cho hoạt động của component.
    // -------------------------------------------------------------------------------
    const [rooms, setRooms] = useState<RoomItem[]>([]) // Danh sách phòng chiếu hiển thị trên bảng.
    const [roomTypes, setRoomTypes] = useState<RoomTypeDto[]>([]) // Danh sách loại phòng, dùng cho bộ lọc và form.
    const [seatTypes, setSeatTypes] = useState<SeatTypeDto[]>([]) // Danh sách loại ghế, truyền cho SeatSetup và build payload.
    const [loading, setLoading] = useState(false) // Cờ (flag) cho biết có thao tác bất đồng bộ (API call) đang chạy.
    const [isCreateOpen, setCreateOpen] = useState(false) // Cờ điều khiển việc đóng/mở dialog Thêm/Sửa phòng.
    const [isRoomTypeOpen, setRoomTypeOpen] = useState(false) // Cờ điều khiển dialog quản lý Loại phòng.
    const [isSeatTypeOpen, setSeatTypeOpen] = useState(false) // Cờ điều khiển dialog quản lý Loại ghế.
    const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null) // Lưu thông tin phòng đang được sửa.
    const [selectedRoom, setSelectedRoom] = useState<SelectedRoomData | null>(null) // Lưu phòng đang được thiết lập ghế, kích hoạt chế độ SeatSetup.
    const [searchTerm, setSearchTerm] = useState("") // State cho ô tìm kiếm.
    const [typeFilter, setTypeFilter] = useState<string>("all") // State cho bộ lọc Loại phòng.
    const [statusFilter, setStatusFilter] = useState<string>("all") // State cho bộ lọc Trạng thái.
    const [capacityFilter, setCapacityFilter] = useState<string>("all") // State cho bộ lọc Sức chứa.
    const [currentPage, setCurrentPage] = useState(1) // Trang hiện tại của bảng danh sách.
    const [itemsPerPage] = useState(10) // Số mục trên mỗi trang.
    const [formData, setFormData] = useState<FormState>({ // State cho các trường trong form Thêm/Sửa.
        name: "",
        roomTypeId: "",
        rows: "",
        columns: "",
        status: "ACTIVE",
    })

    // -------------------------------------------------------------------------------
    // KHỐI CÁC HÀM TIỆN ÍCH VÀ CHUYỂN ĐỔI DỮ LIỆU (useCallback)
    // Chức năng: Xử lý việc chuyển đổi dữ liệu giữa định dạng của API (backend)
    // và định dạng của UI (frontend). `useCallback` được dùng để tối ưu,
    // tránh việc tạo lại hàm một cách không cần thiết sau mỗi lần render.
    // -------------------------------------------------------------------------------

    // Chức năng: Chuyển đổi ma trận ghế từ định dạng DTO của backend sang định dạng `SeatCell` của frontend.
    // Đầu vào: `matrixData` - Mảng 2 chiều từ API `fetchSeatMatrix`.
    // Đầu ra: Mảng 2 chiều `SeatCell[][]` mà component `SeatSetup` có thể hiểu và hiển thị.
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

    // Chức năng: Chuyển đổi ma trận ghế từ định dạng `SeatCell` của UI sang payload mà API lưu trữ của backend yêu cầu.
    // Đầu vào: `matrix` - Mảng `SeatCell[][]` từ sự kiện `onSave` của `SeatSetup`.
    // Đầu ra: Một object payload hợp lệ cho API `saveSeatMatrix`.
    const buildMatrixPayload = useCallback(
        (matrix: SeatCell[][]) => {
            const fallbackSeatTypeId = seatTypes[0]?.id;
            return {
                matrix: matrix.map((row) =>
                    row.map((cell) => {
                        if (!cell) return null;
                        if (cell.seatTypeId === -1) {
                            if (fallbackSeatTypeId === undefined) return null; // Trường hợp an toàn nếu không có loại ghế nào
                            return {
                                id: cell.id ? Number(cell.id) : null,
                                rowIndex: cell.row + 1,
                                columnIndex: cell.column + 1,
                                seatTypeId: fallbackSeatTypeId, // Dùng một ID hợp lệ làm placeholder
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
        [seatTypes], // Phụ thuộc vào `seatTypes` để có `fallbackSeatTypeId`
    )

    // -------------------------------------------------------------------------------
    // KHỐI LẤY DỮ LIỆU TỪ SERVER (DATA FETCHING)
    // -------------------------------------------------------------------------------

    // Chức năng: Tải các dữ liệu "meta" như loại phòng và loại ghế.
    // Đầu vào: Không có.
    // Đầu ra: Cập nhật state `roomTypes` và `seatTypes`, hoặc hiển thị toast báo lỗi.
    const loadMeta = useCallback(async () => {
        try {
            const res = await fetchRoomMeta()
            if (res.status === 200 && res.data) {
                setRoomTypes(res.data.roomTypes ?? [])
                setSeatTypes(res.data.seatTypes ?? [])
            } else {
                toast({ title: "Không thể tải metadata", description: friendlyFromPayload(res, "Vui lòng thử lại") })
            }
        } catch (error: any) {
            console.error("Failed to fetch room meta", error)
            toast({ title: "Lỗi tải metadata", description: friendlyFromPayload(error?.response?.data, "Không thể tải loại phòng/ghế") })
        }
    }, [toast])

    // Chức năng: Tải danh sách các phòng chiếu.
    // Đầu vào: Tham số phân trang (hiện đang hardcode để lấy tất cả).
    // Đầu ra: Cập nhật state `rooms` với dữ liệu đã được chuyển đổi sang `RoomItem`, hoặc báo lỗi.
    const loadRooms = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchRooms({ page: 0, size: 500 }) // Lấy tối đa 500 phòng
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

    // Chức năng: Effect để tải dữ liệu lần đầu khi component được mount.
    // Đầu vào: `loadMeta`, `loadRooms`.
    // Đầu ra: Chạy 2 hàm trên để lấy dữ liệu ban đầu.
    useEffect(() => {
        loadMeta()
        loadRooms()
    }, [loadMeta, loadRooms])

    // -------------------------------------------------------------------------------
    // KHỐI DỮ LIỆU PHÁI SINH (DERIVED DATA - useMemo)
    // -------------------------------------------------------------------------------

    // Chức năng: Lọc danh sách phòng chiếu dựa trên các state filter.
    // `useMemo` giúp việc lọc chỉ chạy lại khi các giá trị phụ thuộc thay đổi, tối ưu hiệu suất.
    // Đầu vào: `rooms`, `searchTerm`, `typeFilter`, `statusFilter`, `capacityFilter`.
    // Đầu ra: Mảng `filteredRooms` đã được lọc.
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

    // Chức năng: Tính toán các giá trị cho việc phân trang.
    // Đầu vào: `filteredRooms`, `itemsPerPage`, `currentPage`.
    // Đầu ra: `totalPages`, `paginatedRooms` (mảng chứa các phòng của trang hiện tại).
    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

    // -------------------------------------------------------------------------------
    // KHỐI CÁC HÀM XỬ LÝ SỰ KIỆN (ACTION HANDLERS)
    // -------------------------------------------------------------------------------

    // Chức năng: Reset form về trạng thái ban đầu.
    const resetForm = () => {
        setFormData({ name: "", roomTypeId: "", rows: "", columns: "", status: "ACTIVE" })
        setEditingRoom(null)
    }

    // Chức năng: Xử lý việc submit form Thêm/Sửa phòng.
    // Đầu vào: State `formData` và `editingRoom`.
    // Đầu ra: Gọi API `createRoomApi` hoặc `updateRoomApi`, hiển thị toast, tải lại danh sách.
    const handleSubmit = async () => {
        const rows = Number(formData.rows)
        const columns = Number(formData.columns)
        const roomTypeId = Number(formData.roomTypeId)
        if (!formData.name.trim() || !roomTypeId || !rows || !columns) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên, loại phòng, số hàng và số cột" })
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

    // Chức năng: Cập nhật trạng thái của phòng (helper function).
    const updateRoomStatus = async (room: RoomItem, status: "ACTIVE" | "INACTIVE") => {
        const payload = { name: room.name, roomTypeId: room.roomTypeId ?? 0, rows: room.rows, columns: room.columns, status }
        await updateRoomApi(room.id, payload)
    }

    // Chức năng: Vô hiệu hóa một phòng.
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

    // Chức năng: Kích hoạt lại một phòng.
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

    // Chức năng: Mở dialog sửa và điền thông tin của phòng đã chọn vào form.
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

    // Chức năng: Xử lý khi người dùng nhấn nút "Thiết lập ghế".
    // Đầu vào: `room` được chọn từ bảng.
    // Đầu ra: Gọi API lấy ma trận ghế, chuyển đổi dữ liệu và cập nhật `selectedRoom` để chuyển sang màn hình `SeatSetup`.
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

    // Chức năng: Xử lý khi người dùng nhấn nút "Quay lại" từ màn hình `SeatSetup`.
    // Đầu ra: Reset `selectedRoom` về `null` để quay lại màn hình danh sách.
    const handleBackFromSeatSetup = () => {
        setSelectedRoom(null)
    }

    // Chức năng: Xử lý khi người dùng nhấn "Lưu cấu hình" từ `SeatSetup`.
    // Đầu vào: `matrix` - Dữ liệu ma trận ghế mới nhất từ `SeatSetup`.
    // Đầu ra: Gọi API `saveSeatMatrix`, hiển thị toast, và quay về màn hình danh sách.
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

    // Chức năng: Xử lý thay đổi các bộ lọc và reset phân trang về trang 1.
    const handleFilterChange = (type: string, value: string) => {
        setCurrentPage(1)
        if (type === "search") setSearchTerm(value)
        else if (type === "type") setTypeFilter(value)
        else if (type === "status") setStatusFilter(value)
        else if (type === "capacity") setCapacityFilter(value)
    }

    // Chức năng: Xóa tất cả các bộ lọc.
    const clearFilters = () => {
        setSearchTerm("")
        setTypeFilter("all")
        setStatusFilter("all")
        setCapacityFilter("all")
        setCurrentPage(1)
    }

    // Chức năng: Xử lý việc đóng mở dialog quản lý loại phòng và tải lại dữ liệu khi cần.
    // Đầu vào: `open` - boolean cho biết dialog đang mở hay đóng.
    // Đầu ra: Cập nhật state `isRoomTypeOpen` và gọi `loadMeta` nếu dialog vừa được đóng.
    const handleRoomTypeDialogChange = (open: boolean) => {
        setRoomTypeOpen(open);
        if (!open) {
            loadMeta();
        }
    }

    // Chức năng: Xử lý việc đóng mở dialog quản lý loại ghế và tải lại dữ liệu khi cần.
    // Đầu vào: `open` - boolean cho biết dialog đang mở hay đóng.
    // Đầu ra: Cập nhật state `isSeatTypeOpen` và gọi `loadMeta` nếu dialog vừa được đóng.
    const handleSeatTypeDialogChange = (open: boolean) => {
        setSeatTypeOpen(open);
        if (!open) {
            loadMeta();
        }
    }

    // -------------------------------------------------------------------------------
    // KHỐI RENDER GIAO DIỆN (UI RENDERING)
    // -------------------------------------------------------------------------------

    // Chức năng: Render có điều kiện. Nếu có một phòng đang được chọn để thiết lập ghế,
    // thì render component `SeatSetup`.
    // Đầu vào: State `selectedRoom`.
    // Đầu ra: Giao diện `SeatSetup`.
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

    // Chức năng: Render giao diện chính (danh sách phòng, bộ lọc, dialogs) khi không ở chế độ `SeatSetup`.
    // Đầu vào: Toàn bộ state của component.
    // Đầu ra: Giao diện quản lý phòng chiếu hoàn chỉnh.
    return (
        <div className="space-y-6">
            {/* Header và các nút hành động chính */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold text-foreground">Quản lý phòng chiếu</h1>
                    <p className="text-muted-foreground">Quản lý phòng chiếu và cấu hình sơ đồ ghế</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRoomTypeOpen(true)}>Quản lý loại phòng</Button>
                    <Button variant="outline" onClick={() => setSeatTypeOpen(true)}>Quản lý loại ghế</Button>
                    <Button onClick={() => setCreateOpen(true)} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm phòng
                    </Button>
                </div>
            </div>

            {/* Card chứa các bộ lọc */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2 text-muted-foreground"><Filter className="w-4 h-4" />Bộ lọc & tìm kiếm</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Các input và select cho bộ lọc */}
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

            {/* Card chứa bảng danh sách phòng chiếu */}
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

                    {/* Phân trang */}
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

            {/* Dialog Thêm/Sửa phòng chiếu */}
            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 sm:max-w-lg">
                    <DialogHeader><DialogTitle className="text-foreground">{editingRoom ? "Sửa phòng chiếu" : "Thêm phòng mới"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        {/* Các trường input của form */}
                        <div className="grid gap-2"><Label htmlFor="name" className="text-foreground">Tên phòng</Label><Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                        <div className="grid gap-2"><Label className="text-foreground">Loại phòng</Label><Select value={formData.roomTypeId} onValueChange={(value) => setFormData((prev) => ({ ...prev, roomTypeId: value }))}><SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger><SelectContent className="bg-popover border-border">{roomTypes.map((type) => (<SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>))}</SelectContent></Select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label htmlFor="rows" className="text-foreground">Số hàng</Label><Input id="rows" type="number" min={1} value={formData.rows} onChange={(e) => setFormData((prev) => ({ ...prev, rows: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                            <div className="grid gap-2"><Label htmlFor="columns" className="text-foreground">Số cột</Label><Input id="columns" type="number" min={1} value={formData.columns} onChange={(e) => setFormData((prev) => ({ ...prev, columns: e.target.value }))} className="bg-input border-border text-foreground" /></div>
                        </div>
                        <div className="grid gap-2"><Label className="text-foreground">Trạng thái</Label><Select value={formData.status} onValueChange={(value: "ACTIVE" | "INACTIVE") => setFormData((prev) => ({ ...prev, status: value }))}><SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="ACTIVE">Hoạt động</SelectItem><SelectItem value="INACTIVE">Không hoạt động</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetForm() }} className="border-border text-foreground hover:bg-muted">Hủy</Button>
                        <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">Lưu</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog Quản lý Loại phòng */}
            <Dialog open={isRoomTypeOpen} onOpenChange={handleRoomTypeDialogChange}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg"><DialogTitle className="text-foreground">Quản lý loại phòng</DialogTitle></DialogHeader>
                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5"><RoomTypeManager /></div>
                </DialogContent>
            </Dialog>

            {/* Dialog Quản lý Loại ghế */}
            <Dialog open={isSeatTypeOpen} onOpenChange={handleSeatTypeDialogChange}>
                <DialogContent className="bg-card text-card-foreground border border-border/60 w-[85vw] max-w-[85vw] h-[92vh] p-0 rounded-lg shadow-xl sm:max-w-none">
                    <DialogHeader className="sticky top-0 z-10 bg-card px-5 py-3 border-b border-border/60 rounded-t-lg"><DialogTitle className="text-foreground">Quản lý loại ghế</DialogTitle></DialogHeader>
                    <div className="h-[calc(92vh-56px)] overflow-y-auto overflow-x-hidden p-5"><SeatTypeManager /></div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
