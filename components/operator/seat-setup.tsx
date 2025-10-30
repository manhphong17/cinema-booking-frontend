"use client"

import { useState, useEffect, useMemo, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Settings, Eye, Users, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SeatVisualType = "standard" | "vip" | "disabled"
type SeatVisualStatus = "available" | "occupied" | "reserved" | "blocked"
type SeatTypeId = number | -1

interface SeatVisualConfig {
    background: string
    text: string
    shadow: string
}

const GOLDEN_ANGLE = 137.508
const DEFAULT_SEAT_VISUAL: SeatVisualConfig = {
    background: "linear-gradient(135deg, #0284c7, #0369a1)",
    text: "#f8fafc",
    shadow: "0 2px 8px rgba(3, 105, 161, 0.35)",
}

const DISABLED_SEAT_VISUAL: SeatVisualConfig = {
    background: "linear-gradient(135deg, #d1d5db, #9ca3af)",
    text: "#1f2937",
    shadow: "0 2px 6px rgba(107, 114, 128, 0.35)",
}

const DISABLED_LABEL = "Vô hiệu hóa"
const AUTO_SELECT_VALUE = "cycle"

interface SeatCell {
    id: string | null
    row: number
    column: number
    type: SeatVisualType
    status: SeatVisualStatus
    seatTypeId?: number
    seatTypeName?: string
}

interface RoomSummary {
    id: number
    name: string
    roomTypeName?: string
    capacity: number
    status: "active" | "inactive"
    rows: number
    columns: number
}

interface SeatSetupProps {
    room: RoomSummary
    initialMatrix: SeatCell[][]
    seatTypes: { id: number; name: string; description?: string | null }[]
    onBack: () => void
    onSave: (matrix: SeatCell[][]) => void
}

const createEmptyMatrix = (rows: number, columns: number): SeatCell[][] => {
    const matrix: SeatCell[][] = []
    for (let row = 0; row < rows; row++) {
        matrix[row] = []
        for (let col = 0; col < columns; col++) {
            matrix[row][col] = {
                id: null,
                row,
                column: col,
                type: "standard",
                status: "available",
            }
        }
    }
    return matrix
}

export function SeatSetup({ room, initialMatrix, seatTypes, onBack, onSave }: SeatSetupProps) {
    const { toast } = useToast()
    const [seatMatrix, setSeatMatrix] = useState<SeatCell[][]>(
        initialMatrix.length ? initialMatrix : createEmptyMatrix(room.rows, room.columns)
    )

    const visualTypeToSeatTypeId = useMemo(() => {
        const mapping: Record<SeatVisualType, number | undefined> = { standard: undefined, vip: undefined, disabled: undefined }
        seatTypes.forEach((type) => {
            const normalized = type.name.toLowerCase()
            if (normalized.includes("vip")) mapping.vip = mapping.vip ?? type.id
            else if (normalized.includes("disable") || normalized.includes("khuyết") || normalized.includes("block")) mapping.disabled = mapping.disabled ?? type.id
            else mapping.standard = mapping.standard ?? type.id
        })
        return mapping
    }, [seatTypes])

    const fallbackSeatTypeId: SeatTypeId =
        (visualTypeToSeatTypeId.standard ??
            visualTypeToSeatTypeId.vip ??
            visualTypeToSeatTypeId.disabled ??
            seatTypes[0]?.id ??
            -1) as SeatTypeId

    const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<SeatTypeId | null>(null)
    const [selectedRow, setSelectedRow] = useState<number | null>(null)
    const [isRowTypeDialogOpen, setIsRowTypeDialogOpen] = useState(false)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{
        type: "addRow" | "addColumn" | "removeRow" | "removeColumn"
        index?: number
    } | null>(null)
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())

    const seatTypeNameById = useMemo(() => {
        const m = new Map<number, string>()
        seatTypes.forEach((s) => m.set(s.id, s.name))
        return m
    }, [seatTypes])

    const seatTypeVisualById = useMemo(() => {
        const map = new Map<number, SeatVisualConfig>()
        seatTypes.forEach((seatType, index) => {
            const hue = Math.round((index * GOLDEN_ANGLE) % 360)
            const saturation = 75
            const baseLightness = 45
            const highlightLightness = Math.min(baseLightness + 15, 78)
            const primary = `hsl(${hue} ${saturation}% ${highlightLightness}%)`
            const secondary = `hsl(${hue} ${Math.max(saturation - 12, 55)}% ${baseLightness}%)`
            const background = `linear-gradient(135deg, ${primary}, ${secondary})`
            const averageLightness = (baseLightness + highlightLightness) / 2
            const text = averageLightness > 62 ? "#0f172a" : "#f8fafc"
            const shadow = `0 2px 8px hsla(${hue}, 70%, 35%, 0.35)`
            map.set(seatType.id, { background, text, shadow })
        })
        return map
    }, [seatTypes])

    const seatTypeCycleOrder = useMemo<SeatTypeId[]>(() => {
        const ids = seatTypes.map<SeatTypeId>((seatType) => seatType.id)
        if (!ids.includes(-1)) ids.push(-1)
        return ids.length ? ids : [-1]
    }, [seatTypes])

    const detectVisualType = (name?: string): SeatVisualType => {
        const n = (name || "").toLowerCase()
        if (n.includes("vip")) return "vip"
        if (n.includes("disable") || n.includes("khuyết") || n.includes("block")) return "disabled"
        return "standard"
    }

    const getNextSeatTypeIdAfter = (seatTypeId: SeatTypeId): SeatTypeId => {
        if (!seatTypeCycleOrder.length) return -1
        const currentIndex = seatTypeCycleOrder.indexOf(seatTypeId)
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % seatTypeCycleOrder.length
        return seatTypeCycleOrder[nextIndex]
    }

    const getNextSeatTypeIdForSeat = (seat: SeatCell): SeatTypeId => {
        const currentId = seat.status === "blocked" || seat.type === "disabled" ? -1 : seat.seatTypeId ?? -1
        return getNextSeatTypeIdAfter(currentId)
    }

    const resolveSeatTypeName = (seatTypeId: SeatTypeId | null | undefined) => {
        if (seatTypeId === -1) return DISABLED_LABEL
        if (seatTypeId == null) return "Chưa thiết lập"
        return seatTypeNameById.get(seatTypeId) ?? "Chưa thiết lập"
    }

    useEffect(() => {
        if (initialMatrix.length) {
            setSeatMatrix(initialMatrix)
        } else if (room.rows && room.columns) {
            setSeatMatrix(createEmptyMatrix(room.rows, room.columns))
        }
    }, [initialMatrix, room.rows, room.columns])

    useEffect(() => {
        setSeatMatrix((prev) => {
            let changed = false
            const updated = prev.map((row) =>
                row.map((seat): SeatCell => {
                    if (seat.seatTypeId != null) {
                        const derivedName = seatTypeNameById.get(seat.seatTypeId)
                        if (derivedName && seat.seatTypeName !== derivedName) {
                            changed = true
                            return { ...seat, seatTypeName: derivedName }
                        }
                    }
                    return seat
                })
            )
            return changed ? updated : prev
        })
    }, [seatTypeNameById])

    useEffect(() => {
        if (!seatTypes.length) {
            if (selectedSeatTypeId !== null) setSelectedSeatTypeId(null)
            return
        }
        if (selectedSeatTypeId === null || selectedSeatTypeId === -1) return
        if (seatTypeNameById.has(selectedSeatTypeId)) return
        const fallbackId: SeatTypeId =
            (visualTypeToSeatTypeId.standard ??
                visualTypeToSeatTypeId.vip ??
                visualTypeToSeatTypeId.disabled ??
                seatTypes[0]?.id ??
                -1) as SeatTypeId
        setSelectedSeatTypeId(fallbackId)
    }, [seatTypes, seatTypeNameById, visualTypeToSeatTypeId, selectedSeatTypeId])

    const handleSeatClick = (row: number, col: number, event: React.MouseEvent) => {
        if (isPreviewMode) return

        const seatId = `${row}-${col}`
        const newMatrix: SeatCell[][] = seatMatrix.map((r) => [...r])
        const seat = newMatrix[row][col]

        if (event.ctrlKey || event.metaKey) {
            const set = new Set(selectedSeats)
            if (set.has(seatId)) set.delete(seatId)
            else set.add(seatId)
            setSelectedSeats(set)
            return
        }

        const targetSeatTypeId: SeatTypeId = selectedSeatTypeId == null ? getNextSeatTypeIdForSeat(seat) : selectedSeatTypeId

        let updatedSeat: SeatCell
        if (targetSeatTypeId === -1) {
            updatedSeat = {
                ...seat,
                type: "disabled",
                status: "blocked",
                seatTypeId: undefined,
                seatTypeName: DISABLED_LABEL,
            }
        } else {
            const resolvedId = targetSeatTypeId as number
            const name = seatTypeNameById.get(resolvedId) ?? ""
            const vtype = detectVisualType(name)
            updatedSeat = {
                ...seat,
                type: vtype,
                status: seat.status === "blocked" ? "available" : seat.status,
                seatTypeId: resolvedId,
                seatTypeName: name,
            }
        }

        newMatrix[row][col] = updatedSeat
        setSeatMatrix(newMatrix)

        const label = `${String.fromCharCode(65 + row)}${col + 1}`
        const targetLabel = resolveSeatTypeName(targetSeatTypeId)
        toast({ title: "Thay đổi loại ghế", description: `Ghế ${label} đã chuyển sang ${targetLabel}` })
    }

    const applySelectedSeatType = () => {
        if (selectedSeats.size === 0) {
            toast({ title: "Chưa chọn ghế", description: "Hãy chọn ghế cần cập nhật" })
            return
        }

        const newMatrix: SeatCell[][] = seatMatrix.map((r) => [...r])
        let changed = 0

        selectedSeats.forEach((id) => {
            const [r, c] = id.split("-").map(Number)
            const seat = newMatrix[r]?.[c]
            if (!seat) return

            const targetSeatTypeId: SeatTypeId = selectedSeatTypeId == null ? getNextSeatTypeIdForSeat(seat) : selectedSeatTypeId

            let updatedSeat: SeatCell
            if (targetSeatTypeId === -1) {
                updatedSeat = { ...seat, type: "disabled", status: "blocked", seatTypeId: undefined, seatTypeName: DISABLED_LABEL }
            } else {
                const resolvedId = targetSeatTypeId as number
                const name = seatTypeNameById.get(resolvedId) ?? ""
                const vtype = detectVisualType(name)
                updatedSeat = {
                    ...seat,
                    type: vtype,
                    status: seat.status === "blocked" ? "available" : seat.status,
                    seatTypeId: resolvedId,
                    seatTypeName: name,
                }
            }

            newMatrix[r][c] = updatedSeat
            changed++
        })

        setSeatMatrix(newMatrix)
        setSelectedSeats(new Set())
        toast({ title: "Cập nhật thành công", description: `Đã thay đổi ${changed} ghế` })
    }

    const handleRowTypeChangeById = (rowIndex: number, seatTypeId: SeatTypeId) => {
        const newMatrix: SeatCell[][] = seatMatrix.map((row, rIdx) => {
            if (rIdx !== rowIndex) return [...row]
            return row.map((seat): SeatCell => {
                if (seatTypeId === -1) {
                    return { ...seat, type: "disabled", status: "blocked", seatTypeId: undefined, seatTypeName: DISABLED_LABEL }
                }
                const resolvedId = seatTypeId as number
                const name = seatTypeNameById.get(resolvedId) ?? ""
                const vtype = detectVisualType(name)
                return {
                    ...seat,
                    type: vtype,
                    status: seat.status === "blocked" ? "available" : seat.status,
                    seatTypeId: resolvedId,
                    seatTypeName: name,
                }
            })
        })
        setSeatMatrix(newMatrix)
        setIsRowTypeDialogOpen(false)
        toast({ title: "Cập nhật thành công", description: `Đã thay đổi loại ghế hàng ${rowIndex + 1}` })
    }

    const confirmAction = (action: typeof pendingAction) => {
        if (!action) return
        switch (action.type) {
            case "addRow":
                insertRow(action.index ?? seatMatrix.length - 1)
                break
            case "addColumn":
                insertColumn(action.index ?? seatMatrix[0]?.length - 1)
                break
            case "removeRow":
                removeRow(action.index!)
                break
            case "removeColumn":
                removeColumn(action.index!)
                break
        }
        setIsConfirmDialogOpen(false)
        setPendingAction(null)
    }

    const insertRow = (afterRow: number) => {
        const newMatrix: SeatCell[][] = seatMatrix.map((row) => [...row])
        const columns = seatMatrix[0]?.length || room.columns
        const newRow: SeatCell[] = []
        const sid: SeatTypeId =
            selectedSeatTypeId == null || selectedSeatTypeId === -1 ? (visualTypeToSeatTypeId.standard ?? fallbackSeatTypeId) : selectedSeatTypeId
        const resolvedRowSeatTypeId = sid === -1 ? undefined : sid
        const sname = resolvedRowSeatTypeId === undefined ? DISABLED_LABEL : seatTypeNameById.get(resolvedRowSeatTypeId) ?? ""
        const vtype: SeatVisualType = resolvedRowSeatTypeId === undefined ? "disabled" : detectVisualType(sname)
        for (let col = 0; col < columns; col++) {
            newRow[col] = {
                id: null,
                row: afterRow + 1,
                column: col,
                type: vtype,
                status: vtype === "disabled" ? "blocked" : "available",
                seatTypeId: resolvedRowSeatTypeId,
                seatTypeName: sname,
            }
        }
        newMatrix.splice(afterRow + 1, 0, newRow)

        for (let row = afterRow + 1; row < newMatrix.length; row++) {
            for (let col = 0; col < newMatrix[row].length; col++) {
                newMatrix[row][col] = {
                    ...newMatrix[row][col],
                    row,
                    id: newMatrix[row][col].id ? `${row}-${col}` : null,
                }
            }
        }
        setSeatMatrix(newMatrix)
        toast({ title: "Thêm hàng thành công", description: `Đã thêm hàng mới sau hàng ${String.fromCharCode(65 + afterRow)}` })
    }

    const insertColumn = (afterCol: number) => {
        const newMatrix: SeatCell[][] = seatMatrix.map((row) => [...row])
        const sid: SeatTypeId =
            selectedSeatTypeId == null || selectedSeatTypeId === -1 ? (visualTypeToSeatTypeId.standard ?? fallbackSeatTypeId) : selectedSeatTypeId
        const resolvedColumnSeatTypeId = sid === -1 ? undefined : sid
        const sname = resolvedColumnSeatTypeId === undefined ? DISABLED_LABEL : seatTypeNameById.get(resolvedColumnSeatTypeId) ?? ""
        const vtype: SeatVisualType = resolvedColumnSeatTypeId === undefined ? "disabled" : detectVisualType(sname)
        for (let row = 0; row < newMatrix.length; row++) {
            const newSeat: SeatCell = {
                id: null,
                row,
                column: afterCol + 1,
                type: vtype,
                status: vtype === "disabled" ? "blocked" : "available",
                seatTypeId: resolvedColumnSeatTypeId,
                seatTypeName: sname,
            }
            newMatrix[row].splice(afterCol + 1, 0, newSeat)
            for (let col = afterCol + 1; col < newMatrix[row].length; col++) {
                newMatrix[row][col] = {
                    ...newMatrix[row][col],
                    column: col,
                    id: newMatrix[row][col].id ? `${newMatrix[row][col].row}-${col}` : null,
                }
            }
        }
        setSeatMatrix(newMatrix)
        toast({ title: "Thêm cột thành công", description: `Đã thêm cột mới sau cột ${afterCol + 1}` })
    }

    const removeRow = (rowIndex: number) => {
        if (seatMatrix.length <= 1) {
            toast({ title: "Không thể xóa", description: "Phải có ít nhất 1 hàng ghế" })
            return
        }
        const newMatrix = seatMatrix.filter((_, index) => index !== rowIndex)
        for (let row = 0; row < newMatrix.length; row++) {
            for (let col = 0; col < newMatrix[row].length; col++) {
                newMatrix[row][col] = {
                    ...newMatrix[row][col],
                    row,
                    id: newMatrix[row][col].id ? `${row}-${col}` : null,
                }
            }
        }
        setSeatMatrix(newMatrix)
        toast({ title: "Xóa hàng thành công", description: `Đã xóa hàng ${String.fromCharCode(65 + rowIndex)}` })
    }

    const removeColumn = (colIndex: number) => {
        if (seatMatrix[0]?.length <= 1) {
            toast({ title: "Không thể xóa", description: "Phải có ít nhất 1 cột ghế" })
            return
        }
        const newMatrix: SeatCell[][] = seatMatrix.map((row) => {
            const newRow = row.filter((_, index) => index !== colIndex)
            for (let col = 0; col < newRow.length; col++) {
                newRow[col] = {
                    ...newRow[col],
                    column: col,
                    id: newRow[col].id ? `${newRow[col].row}-${col}` : null,
                }
            }
            return newRow
        })
        setSeatMatrix(newMatrix)
        toast({ title: "Xóa cột thành công", description: `Đã xóa cột ${colIndex + 1}` })
    }

    const handleSave = () => {
        onSave(seatMatrix)
        toast({ title: "Lưu thành công", description: "Cấu hình ghế đã được lưu" })
    }

    // CHANGED: Preview shows by seat type, hides disabled seats
    const getSeatVisual = (seat: SeatCell): { className: string; textClass: string; style?: CSSProperties } => {
        if (isPreviewMode) {
            if (seat.status === "blocked" || seat.type === "disabled") {
                return { className: "hidden", textClass: "" } // hide disabled in preview
            }
            const key = seat.seatTypeId
            const visual = typeof key === "number" ? seatTypeVisualById.get(key) ?? DEFAULT_SEAT_VISUAL : DEFAULT_SEAT_VISUAL
            return { className: "", textClass: "", style: { background: visual.background, color: visual.text, boxShadow: visual.shadow } }
        }

        if (seat.status === "blocked" || seat.type === "disabled") {
            return {
                className: "",
                textClass: "",
                style: {
                    background: DISABLED_SEAT_VISUAL.background,
                    color: DISABLED_SEAT_VISUAL.text,
                    boxShadow: DISABLED_SEAT_VISUAL.shadow,
                    opacity: 0.65,
                    cursor: "not-allowed",
                },
            }
        }

        const key = seat.seatTypeId
        const visual = typeof key === "number" ? seatTypeVisualById.get(key) ?? DEFAULT_SEAT_VISUAL : DEFAULT_SEAT_VISUAL
        return { className: "", textClass: "", style: { background: visual.background, color: visual.text, boxShadow: visual.shadow } }
    }

    // CHANGED: compute visible seat types for preview legend
    const visibleSeatTypeIds = useMemo(() => {
        if (!isPreviewMode) return seatTypes.map((s) => s.id)
        const set = new Set<number>()
        seatMatrix.forEach((r) =>
            r.forEach((seat) => {
                if (seat.status !== "blocked" && seat.type !== "disabled" && typeof seat.seatTypeId === "number") set.add(seat.seatTypeId)
            })
        )
        return Array.from(set)
    }, [isPreviewMode, seatMatrix, seatTypes])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} className="text-foreground hover:bg-muted">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Thiết lập ghế - {room.name}</h1>
                        <p className="text-muted-foreground mt-1">Cấu hình bố trí ghế trong phòng chiếu</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)} className="text-foreground hover:bg-muted">
                        <Eye className="w-4 h-4 mr-2" />
                        {isPreviewMode ? "Chế độ chỉnh sửa" : "Xem trước"}
                    </Button>
                    <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Lưu cấu hình
                    </Button>
                </div>
            </div>

            {/* Controls */}
            {!isPreviewMode && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-foreground">Loại ghế:</label>
                                <Select
                                    value={selectedSeatTypeId == null ? AUTO_SELECT_VALUE : selectedSeatTypeId.toString()}
                                    onValueChange={(value) => {
                                        if (value === AUTO_SELECT_VALUE) {
                                            setSelectedSeatTypeId(null)
                                            return
                                        }
                                        const next = Number(value)
                                        if (Number.isNaN(next)) return
                                        setSelectedSeatTypeId(next)
                                    }}
                                >
                                    <SelectTrigger className="w-56">
                                        <SelectValue placeholder="Chọn loại ghế" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AUTO_SELECT_VALUE}>Xoay vòng theo danh sách</SelectItem>
                                        {seatTypes.map((st) => (
                                            <SelectItem key={st.id} value={st.id.toString()}>
                                                {st.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="-1">{DISABLED_LABEL}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Nhấp vào ghế để áp dụng loại ghế đã chọn hoặc xoay vòng khi chọn “Xoay vòng theo danh sách”.
                  <br />
                  <span className="text-xs">Giữ Ctrl + Click để chọn nhiều ghế</span>
                </span>
                            </div>
                        </div>

                        {/* Multi-select and Add Buttons */}
                        <div className="flex items-center gap-2">
                            {selectedSeats.size > 0 && (
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-sm text-foreground">Đã chọn {selectedSeats.size} ghế</span>
                                    <Button size="sm" onClick={applySelectedSeatType} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        Áp dụng loại đã chọn
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedSeats(new Set())} className="text-foreground hover:bg-muted">
                                        Bỏ chọn
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPendingAction({ type: "addRow", index: seatMatrix.length - 1 })
                                    setIsConfirmDialogOpen(true)
                                }}
                                className="text-foreground hover:bg-muted"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Thêm hàng
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPendingAction({ type: "addColumn", index: seatMatrix[0]?.length - 1 || 0 })
                                    setIsConfirmDialogOpen(true)
                                }}
                                className="text-foreground hover:bg-muted"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Thêm cột
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Seat Matrix */}
            <Card className="p-6">
                <div className="space-y-4">
                    {/* Screen */}
                    <div className="operator-screen-container">
                        <div className="operator-screen-curve-top"></div>
                        <div className="operator-screen">
                            <div className="flex items-center justify-center gap-3">
                                <Monitor className="w-6 h-6" />
                                <span>MÀN HÌNH</span>
                                <Monitor className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="operator-screen-curve-bottom"></div>
                        <div className="operator-screen-header">
                            <div className="flex items-center justify-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Khu vực khán giả</span>
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Seat Grid */}
                    <div className="flex justify-center w-full">
                        <div className="relative max-w-4xl w-full">
                            {/* Column numbers */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-8"></div>

                                {/* CHANGED: mỗi cột là một group có nút xóa riêng */}
                                <div className="flex gap-1">
                                    {seatMatrix[0]?.map((_, colIndex) => (
                                        <div key={colIndex} className="relative group">
                                            <div className="w-8 text-center text-xs font-medium text-muted-foreground">
                                                {colIndex + 1}
                                            </div>

                                            {/* ADDED: nút xóa cột hiện khi hover đúng cột */}
                                            {!isPreviewMode && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                                                    title={`Xóa cột ${colIndex + 1}`}
                                                    onClick={() => {
                                                        if ((seatMatrix[0]?.length ?? 0) <= 1) {
                                                            toast({ title: "Không thể xóa", description: "Phải có ít nhất 1 cột ghế" })
                                                            return
                                                        }
                                                        setPendingAction({ type: "removeColumn", index: colIndex }) // ADDED: xóa đúng cột
                                                        setIsConfirmDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Giữ nút thêm cột tổng */}
                                {!isPreviewMode && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setPendingAction({ type: "addColumn", index: seatMatrix[0]?.length - 1 || 0 })
                                                setIsConfirmDialogOpen(true)
                                            }}
                                            className="w-6 h-6 p-0 text-primary hover:text-primary/80 ml-2"
                                            title="Thêm cột"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </>
                                )}
                            </div>



                            {/* Seat Matrix Container */}
                            <div className="flex justify-center">
                                <div className="relative">
                                    {seatMatrix.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex items-center gap-2 mb-3 group">
                                            {/* Row number */}
                                            <div className="w-8 text-center text-sm font-medium text-muted-foreground flex-shrink-0">
                                                {String.fromCharCode(65 + rowIndex)}
                                            </div>

                                            {/* Seats */}
                                            <div className="flex gap-1">
                                                {row.map((seat, colIndex) => {
                                                    const seatKey = seat.id ?? `${rowIndex}-${colIndex}`
                                                    const seatVisual = getSeatVisual(seat)
                                                    const selectionKey = `${rowIndex}-${colIndex}`
                                                    const isSelected = selectedSeats.has(selectionKey)
                                                    const seatLabel = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
                                                    const seatTypeLabel = resolveSeatTypeName(
                                                        seat.status === "blocked" || seat.type === "disabled" ? -1 : seat.seatTypeId
                                                    )

                                                    // CHANGED: in preview, hide disabled seats but keep grid spacing
                                                    if (isPreviewMode && seatVisual.className === "hidden") {
                                                        return <div key={seatKey} className="w-8 h-8" />
                                                    }

                                                    return (
                                                        <div key={seatKey} className="relative group/seat">
                                                            <button
                                                                onClick={(e) => handleSeatClick(rowIndex, colIndex, e)}
                                                                className={`w-8 h-8 rounded text-xs font-medium transition-all duration-200 hover:scale-110 active:scale-95 ${seatVisual.className} ${
                                                                    !isPreviewMode ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/30" : "cursor-default"
                                                                } ${isSelected ? "outline outline-2 outline-primary outline-offset-2" : ""}`}
                                                                style={seatVisual.style}
                                                                disabled={isPreviewMode}
                                                                title={`Ghế ${seatLabel} - ${seatTypeLabel}${isSelected ? " (Đã chọn)" : ""}`}
                                                            >
                                                                {colIndex + 1}
                                                            </button>

                                                            {/*/!* Insert column indicator *!/*/}
                                                            {/*{!isPreviewMode && (*/}
                                                            {/*    <div*/}
                                                            {/*        className="absolute top-1/2 -right-1 w-2 h-2 bg-primary opacity-0 group-hover/seat:opacity-100 transition-opacity cursor-pointer hover:bg-primary/80"*/}
                                                            {/*        onClick={(e) => {*/}
                                                            {/*            e.stopPropagation()*/}
                                                            {/*            insertColumn(colIndex)*/}
                                                            {/*        }}*/}
                                                            {/*        title="Chèn cột"*/}
                                                            {/*    />*/}
                                                            {/*)}*/}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Row controls */}
                                            {!isPreviewMode && (
                                                <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedRow(rowIndex)
                                                            setIsRowTypeDialogOpen(true)
                                                        }}
                                                        className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                                                        title="Thay đổi loại hàng"
                                                    >
                                                        <Settings className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setPendingAction({ type: "removeRow", index: rowIndex })
                                                            setIsConfirmDialogOpen(true)
                                                        }}
                                                        className="w-6 h-6 p-0 text-destructive hover:text-destructive/80"
                                                        title="Xóa hàng"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Insert row indicator */}
                                            {!isPreviewMode && (
                                                <div
                                                    className="absolute left-0 -bottom-1 w-full h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-primary/80"
                                                    onClick={() => insertRow(rowIndex)}
                                                    title="Chèn hàng"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {/* Add row button */}
                                    {!isPreviewMode && (
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <div className="w-8"></div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setPendingAction({ type: "addRow", index: seatMatrix.length - 1 })
                                                    setIsConfirmDialogOpen(true)
                                                }}
                                                className="text-primary hover:text-primary/80"
                                                title="Thêm hàng"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Thêm hàng
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center mt-8">
                        <div className="operator-legend">
                            <div className="flex justify-center gap-8">
                                {seatTypes
                                    .filter((st) => visibleSeatTypeIds.includes(st.id))
                                    .map((st) => {
                                        const visual = seatTypeVisualById.get(st.id) ?? DEFAULT_SEAT_VISUAL
                                        return (
                                            <div key={st.id} className="operator-legend-item">
                                                <div className="operator-legend-color" style={{ background: visual.background, boxShadow: visual.shadow }} />
                                                <span className="text-sm text-foreground font-medium">{st.name}</span>
                                            </div>
                                        )
                                    })}
                                {!isPreviewMode && (
                                    <div className="operator-legend-item">
                                        <div
                                            className="operator-legend-color"
                                            style={{ background: DISABLED_SEAT_VISUAL.background, boxShadow: DISABLED_SEAT_VISUAL.shadow }}
                                        />
                                        <span className="text-sm text-foreground font-medium">{DISABLED_LABEL}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Row Type Dialog */}
            <Dialog open={isRowTypeDialogOpen} onOpenChange={setIsRowTypeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thay đổi loại ghế hàng {selectedRow !== null ? String.fromCharCode(65 + selectedRow) : ""}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {seatTypes.map((st) => {
                                const visual = seatTypeVisualById.get(st.id) ?? DEFAULT_SEAT_VISUAL
                                return (
                                    <Button
                                        key={st.id}
                                        variant="outline"
                                        onClick={() => selectedRow !== null && handleRowTypeChangeById(selectedRow, st.id)}
                                        className="flex flex-col items-center gap-2 p-4"
                                    >
                                        <div className="w-6 h-6 rounded" style={{ background: visual.background, boxShadow: visual.shadow }} />
                                        <span>{st.name}</span>
                                    </Button>
                                )
                            })}
                            <Button
                                variant="outline"
                                onClick={() => selectedRow !== null && handleRowTypeChangeById(selectedRow, -1)}
                                className="flex flex-col items-center gap-2 p-4"
                            >
                                <div className="w-6 h-6 rounded" style={{ background: DISABLED_SEAT_VISUAL.background, boxShadow: DISABLED_SEAT_VISUAL.shadow }} />
                                <span>{DISABLED_LABEL}</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingAction?.type === "addRow" && "Thêm hàng mới"}
                            {pendingAction?.type === "addColumn" && "Thêm cột mới"}
                            {pendingAction?.type === "removeRow" && "Xóa hàng"}
                            {pendingAction?.type === "removeColumn" && "Xóa cột"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-foreground">
                            {pendingAction?.type === "addRow" && `Bạn có chắc chắn muốn thêm hàng mới sau hàng ${String.fromCharCode(65 + (pendingAction.index || 0))}?`}
                            {pendingAction?.type === "addColumn" && `Bạn có chắc chắn muốn thêm cột mới sau cột ${(pendingAction.index || 0) + 1}?`}
                            {pendingAction?.type === "removeRow" && `Bạn có chắc chắn muốn xóa hàng ${String.fromCharCode(65 + (pendingAction.index || 0))}?`}
                            {pendingAction?.type === "removeColumn" && `Bạn có chắc chắn muốn xóa cột ${(pendingAction.index || 0) + 1}?`}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={() => confirmAction(pendingAction)}
                                className={
                                    pendingAction?.type?.includes("remove")
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }
                            >
                                {pendingAction?.type?.includes("remove") ? "Xóa" : "Thêm"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
