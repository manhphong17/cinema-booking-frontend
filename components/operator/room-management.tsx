"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {ChevronLeft, ChevronRight, Filter, Pencil, Plus, Search, Settings, Trash2} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import {SeatSetup} from "./seat-setup"

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

export function RoomManagement({onSelectRoom}: RoomManagementProps) {
    const {toast} = useToast()
    const [rooms, setRooms] = useState<Room[]>([
        // Phòng Standard (10 phòng)
        {
            id: "1",
            name: "Phòng 1",
            type: "Standard",
            capacity: 100,
            status: "active",
            rows: 10,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "2",
            name: "Phòng 2",
            type: "Standard",
            capacity: 80,
            status: "active",
            rows: 8,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "3",
            name: "Phòng 3",
            type: "Standard",
            capacity: 120,
            status: "active",
            rows: 12,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "4",
            name: "Phòng 4",
            type: "Standard",
            capacity: 90,
            status: "inactive",
            rows: 9,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "5",
            name: "Phòng 5",
            type: "Standard",
            capacity: 110,
            status: "active",
            rows: 11,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "6",
            name: "Phòng 6",
            type: "Standard",
            capacity: 70,
            status: "active",
            rows: 7,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "7",
            name: "Phòng 7",
            type: "Standard",
            capacity: 130,
            status: "active",
            rows: 13,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "8",
            name: "Phòng 8",
            type: "Standard",
            capacity: 85,
            status: "inactive",
            rows: 8,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "9",
            name: "Phòng 9",
            type: "Standard",
            capacity: 95,
            status: "active",
            rows: 9,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "10",
            name: "Phòng 10",
            type: "Standard",
            capacity: 105,
            status: "active",
            rows: 10,
            columns: 10,
            seatMatrix: []
        },

        // Phòng VIP (8 phòng)
        {id: "11", name: "VIP 1", type: "VIP", capacity: 40, status: "active", rows: 4, columns: 10, seatMatrix: []},
        {id: "12", name: "VIP 2", type: "VIP", capacity: 50, status: "active", rows: 5, columns: 10, seatMatrix: []},
        {id: "13", name: "VIP 3", type: "VIP", capacity: 45, status: "inactive", rows: 4, columns: 10, seatMatrix: []},
        {id: "14", name: "VIP 4", type: "VIP", capacity: 35, status: "active", rows: 3, columns: 10, seatMatrix: []},
        {id: "15", name: "VIP 5", type: "VIP", capacity: 55, status: "active", rows: 5, columns: 10, seatMatrix: []},
        {id: "16", name: "VIP 6", type: "VIP", capacity: 60, status: "active", rows: 6, columns: 10, seatMatrix: []},
        {id: "17", name: "VIP 7", type: "VIP", capacity: 42, status: "inactive", rows: 4, columns: 10, seatMatrix: []},
        {id: "18", name: "VIP 8", type: "VIP", capacity: 48, status: "active", rows: 4, columns: 10, seatMatrix: []},

        // Phòng IMAX (8 phòng)
        {
            id: "19",
            name: "IMAX 1",
            type: "IMAX",
            capacity: 200,
            status: "active",
            rows: 20,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "20",
            name: "IMAX 2",
            type: "IMAX",
            capacity: 180,
            status: "active",
            rows: 18,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "21",
            name: "IMAX 3",
            type: "IMAX",
            capacity: 220,
            status: "inactive",
            rows: 22,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "22",
            name: "IMAX 4",
            type: "IMAX",
            capacity: 190,
            status: "active",
            rows: 19,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "23",
            name: "IMAX 5",
            type: "IMAX",
            capacity: 210,
            status: "active",
            rows: 21,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "24",
            name: "IMAX 6",
            type: "IMAX",
            capacity: 170,
            status: "active",
            rows: 17,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "25",
            name: "IMAX 7",
            type: "IMAX",
            capacity: 230,
            status: "inactive",
            rows: 23,
            columns: 10,
            seatMatrix: []
        },
        {
            id: "26",
            name: "IMAX 8",
            type: "IMAX",
            capacity: 195,
            status: "active",
            rows: 19,
            columns: 10,
            seatMatrix: []
        },

        // Phòng 4DX (7 phòng)
        {id: "27", name: "4DX 1", type: "4DX", capacity: 60, status: "active", rows: 6, columns: 10, seatMatrix: []},
        {id: "28", name: "4DX 2", type: "4DX", capacity: 70, status: "active", rows: 7, columns: 10, seatMatrix: []},
        {id: "29", name: "4DX 3", type: "4DX", capacity: 65, status: "inactive", rows: 6, columns: 10, seatMatrix: []},
        {id: "30", name: "4DX 4", type: "4DX", capacity: 75, status: "active", rows: 7, columns: 10, seatMatrix: []},
        {id: "31", name: "4DX 5", type: "4DX", capacity: 55, status: "active", rows: 5, columns: 10, seatMatrix: []},
        {id: "32", name: "4DX 6", type: "4DX", capacity: 80, status: "active", rows: 8, columns: 10, seatMatrix: []},
        {id: "33", name: "4DX 7", type: "4DX", capacity: 68, status: "inactive", rows: 6, columns: 10, seatMatrix: []},
    ])

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [capacityFilter, setCapacityFilter] = useState<string>("all")

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        capacity: "",
        rows: "",
        columns: "",
        status: "active" as "active" | "inactive",
    })

    const generateSeatMatrix = (rows: number, columns: number): Seat[][] => {
        const matrix: Seat[][] = []
        for (let row = 0; row < rows; row++) {
            matrix[row] = []
            for (let col = 0; col < columns; col++) {
                matrix[row][col] = {
                    id: `${row}-${col}`,
                    row,
                    column: col,
                    type: "standard",
                    status: "available"
                }
            }
        }
        return matrix
    }

    const handleSubmit = () => {
        const rows = Number(formData.rows)
        const columns = Number(formData.columns)
        const capacity = rows * columns

        if (editingRoom) {
            setRooms(
                rooms.map((r) =>
                    r.id === editingRoom.id ? {
                        ...editingRoom,
                        ...formData,
                        capacity,
                        rows,
                        columns,
                        seatMatrix: generateSeatMatrix(rows, columns)
                    } : r,
                ),
            )
            toast({title: "Cập nhật thành công", description: "Phòng chiếu đã được cập nhật"})
        } else {
            const newRoom: Room = {
                id: Date.now().toString(),
                ...formData,
                capacity,
                rows,
                columns,
                seatMatrix: generateSeatMatrix(rows, columns)
            }
            setRooms([...rooms, newRoom])
            toast({title: "Thêm thành công", description: "Phòng chiếu mới đã được thêm"})
        }
        setIsDialogOpen(false)
        resetForm()
    }

    const handleDelete = (id: string) => {
        setRooms(rooms.filter((r) => r.id !== id))
        toast({title: "Xóa thành công", description: "Phòng chiếu đã được xóa"})
    }

    const resetForm = () => {
        setFormData({name: "", type: "", capacity: "", rows: "", columns: "", status: "active"})
        setEditingRoom(null)
    }

    const openEditDialog = (room: Room) => {
        setEditingRoom(room)
        setFormData({
            name: room.name,
            type: room.type,
            capacity: room.capacity.toString(),
            rows: room.rows.toString(),
            columns: room.columns.toString(),
            status: room.status,
        })
        setIsDialogOpen(true)
    }

    const handleSelectRoom = (room: Room) => {
        setSelectedRoom(room)
    }

    const handleSaveSeatConfig = (updatedRoom: Room) => {
        setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r))
        setSelectedRoom(null)
    }

    const handleBackFromSeatSetup = () => {
        setSelectedRoom(null)
    }

    // Filter and search logic
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === "all" || room.type === typeFilter
        const matchesStatus = statusFilter === "all" || room.status === statusFilter
        const matchesCapacity = capacityFilter === "all" ||
            (capacityFilter === "small" && room.capacity < 50) ||
            (capacityFilter === "medium" && room.capacity >= 50 && room.capacity < 100) ||
            (capacityFilter === "large" && room.capacity >= 100)

        return matchesSearch && matchesType && matchesStatus && matchesCapacity
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

    // Reset pagination when filters change
    const handleFilterChange = (filterType: string, value: string) => {
        setCurrentPage(1)
        switch (filterType) {
            case 'search':
                setSearchTerm(value)
                break
            case 'type':
                setTypeFilter(value)
                break
            case 'status':
                setStatusFilter(value)
                break
            case 'capacity':
                setCapacityFilter(value)
                break
        }
    }

    const clearFilters = () => {
        setSearchTerm("")
        setTypeFilter("all")
        setStatusFilter("all")
        setCapacityFilter("all")
        setCurrentPage(1)
    }

    if (selectedRoom) {
        return (
            <SeatSetup
                room={selectedRoom}
                onBack={handleBackFromSeatSetup}
                onSave={handleSaveSeatConfig}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý Phòng chiếu</h1>
                    <p className="text-muted-foreground mt-1">Quản lý phòng chiếu và cấu hình ghế ngồi</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2"/>
                            Thêm phòng mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card text-card-foreground border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">
                                {editingRoom ? "Sửa phòng chiếu" : "Thêm phòng mới"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-foreground">
                                    Tên phòng
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="bg-input border-border text-foreground"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="text-foreground">
                                    Loại phòng
                                </Label>
                                <Select value={formData.type}
                                        onValueChange={(value) => setFormData({...formData, type: value})}>
                                    <SelectTrigger className="bg-input border-border text-foreground">
                                        <SelectValue placeholder="Chọn loại phòng"/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                        <SelectItem value="IMAX">IMAX</SelectItem>
                                        <SelectItem value="4DX">4DX</SelectItem>
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
                                        min="1"
                                        max="20"
                                        value={formData.rows}
                                        onChange={(e) => setFormData({...formData, rows: e.target.value})}
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
                                        min="1"
                                        max="20"
                                        value={formData.columns}
                                        onChange={(e) => setFormData({...formData, columns: e.target.value})}
                                        className="bg-input border-border text-foreground"
                                    />
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
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "active" | "inactive") => setFormData({
                                        ...formData,
                                        status: value
                                    })}
                                >
                                    <SelectTrigger className="bg-input border-border text-foreground">
                                        <SelectValue/>
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
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false)
                                    resetForm()
                                }}
                                className="border-border text-foreground hover:bg-muted"
                            >
                                Hủy
                            </Button>
                            <Button onClick={handleSubmit}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Lưu
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Filter Section */}
            <Card className="bg-card border-border p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-primary"/>
                        <h2 className="text-lg font-semibold text-foreground">Tìm kiếm và Lọc</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search by name */}
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm font-medium text-foreground">
                                Tìm kiếm theo tên
                            </Label>
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <Input
                                    id="search"
                                    placeholder="Nhập tên phòng..."
                                    value={searchTerm}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-10 bg-input border-border text-foreground"
                                />
                            </div>
                        </div>

                        {/* Filter by type */}
                        <div className="space-y-2">
                            <Label htmlFor="type-filter" className="text-sm font-medium text-foreground">
                                Loại phòng
                            </Label>
                            <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả loại"/>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                    <SelectItem value="IMAX">IMAX</SelectItem>
                                    <SelectItem value="4DX">4DX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter by status */}
                        <div className="space-y-2">
                            <Label htmlFor="status-filter" className="text-sm font-medium text-foreground">
                                Trạng thái
                            </Label>
                            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả trạng thái"/>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter by capacity */}
                        <div className="space-y-2">
                            <Label htmlFor="capacity-filter" className="text-sm font-medium text-foreground">
                                Sức chứa
                            </Label>
                            <Select value={capacityFilter}
                                    onValueChange={(value) => handleFilterChange('capacity', value)}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Tất cả sức chứa"/>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả sức chứa</SelectItem>
                                    <SelectItem value="small">Nhỏ (&lt; 50 ghế)</SelectItem>
                                    <SelectItem value="medium">Vừa (50-99 ghế)</SelectItem>
                                    <SelectItem value="large">Lớn (≥ 100 ghế)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear filters button */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground opacity-0">Clear</Label>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="w-full text-foreground hover:bg-muted"
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>

                    {/* Results summary */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredRooms.length)} trong {filteredRooms.length} phòng
            </span>
                        {filteredRooms.length !== rooms.length && (
                            <span className="text-primary">
                {rooms.length - filteredRooms.length} phòng đã được lọc
              </span>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="bg-card border-border p-6">
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
                        {paginatedRooms.map((room) => (
                            <TableRow key={room.id} className="border-border hover:bg-muted/30">
                                <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                                <TableCell className="text-foreground">{room.type}</TableCell>
                                <TableCell className="text-foreground">{room.rows} x {room.columns}</TableCell>
                                <TableCell className="text-foreground">{room.capacity} ghế</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={room.status === "active" ? "default" : "secondary"}
                                        className={
                                            room.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }
                                    >
                                        {room.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditDialog(room)}
                                            className="text-foreground hover:bg-muted"
                                        >
                                            <Pencil className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(room.id)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSelectRoom(room)}
                                            className="text-primary hover:bg-primary/10"
                                        >
                                            <Settings className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
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
                            >
                                <ChevronLeft className="w-4 h-4 mr-1"/>
                                Trước
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    let pageNumber
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i
                                    } else {
                                        pageNumber = currentPage - 2 + i
                                    }

                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={currentPage === pageNumber ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={
                                                currentPage === pageNumber
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                    : "text-foreground hover:bg-muted"
                                            }
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
                            >
                                Sau
                                <ChevronRight className="w-4 h-4 ml-1"/>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
