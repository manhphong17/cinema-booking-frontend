"use client"

// ===================================================================================
// TỔNG QUAN COMPONENT: SeatSetup
//
// Chức năng:
// - Cung cấp một giao diện tương tác trực quan để thiết lập sơ đồ ghế cho một phòng chiếu cụ thể.
// - Cho phép người dùng:
//   - Click vào từng ghế để thay đổi loại ghế (VIP, Standard, Vô hiệu hóa).
//   - Chọn nhiều ghế (Ctrl/Cmd + Click) và áp dụng một loại ghế hàng loạt.
//   - Thêm/Xóa hàng và cột của ma trận ghế.
//   - Thay đổi loại ghế cho cả một hàng.
//   - Xem trước giao diện sơ đồ ghế từ góc nhìn của khách hàng.
// - Gửi cấu hình ma trận ghế cuối cùng về cho component cha để lưu vào backend.
//
// Đầu vào:
// - `room`: Thông tin về phòng chiếu đang được cấu hình.
// - `initialMatrix`: Ma trận ghế ban đầu được tải từ backend.
// - `seatTypes`: Danh sách các loại ghế hợp lệ (VIP, Standard, etc.).
// - `onBack`: Callback để quay lại màn hình trước.
// - `onSave`: Callback để gửi ma trận đã chỉnh sửa về cho component cha.
//
// Đầu ra:
// - Một giao diện thiết lập ghế hoàn chỉnh.
// - Gọi hàm `onSave` với dữ liệu ma trận mới nhất khi người dùng nhấn "Lưu cấu hình".
// ===================================================================================

import type React from "react"
import { useState, useEffect, useMemo, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Settings, Eye, Users, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateColorFromString } from "@/lib/color"
import { friendlyFromPayload } from "@/src/utils/server-error" // Import friendlyFromPayload

// ===================================================================================
// CÁC ĐỊNH NGHĨA TYPE VÀ HẰNG SỐ
// ===================================================================================

export type SeatStatus = "AVAILABLE" | "BLOCKED"
export type SeatTypeId = number | -1

interface SeatVisualConfig {
    background: string
    text: string
    shadow: string
}

const DEFAULT_SEAT_VISUAL: SeatVisualConfig = {
    background: "linear-gradient(135deg, #9ca3af, #6b7280)",
    text: "#f8fafc",
    shadow: "0 2px 8px rgba(107, 114, 128, 0.35)",
}

const DISABLED_LABEL = "Vô hiệu hóa"
const AUTO_SELECT_VALUE = "cycle"

export interface SeatCell {
    id: number | null
    row: number
    column: number
    seatTypeId: SeatTypeId
    seatTypeName?: string
    status: SeatStatus
}

interface RoomSummary {
    id: number
    name: string
    rows: number
    columns: number
}

interface SeatSetupProps {
    room: RoomSummary
    initialMatrix: SeatCell[][]
    seatTypes: { id: number; name: string }[]
    onBack: () => void
    onSave: (matrix: SeatCell[][]) => void
}

// Chức năng: Tạo một ma trận ghế trống dựa trên số hàng và cột.
// Đầu vào: `rows` (số hàng), `columns` (số cột).
// Đầu ra: Một mảng `SeatCell[][]` với tất cả các ghế đều ở trạng thái "vô hiệu hóa" mặc định.
const createEmptyMatrix = (rows: number, columns: number): SeatCell[][] => {
    return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c): SeatCell => ({
            id: null,
            row: r,
            column: c,
            seatTypeId: -1,
            seatTypeName: DISABLED_LABEL,
            status: "AVAILABLE",
        }))
    )
}

// ===================================================================================
// COMPONENT CHÍNH: SeatSetup
// ===================================================================================
export function SeatSetup({ room, initialMatrix, seatTypes, onBack, onSave }: SeatSetupProps) {
    const { toast } = useToast()

    // -------------------------------------------------------------------------------
    // KHỐI QUẢN LÝ STATE
    // Chức năng: Khai báo tất cả các state cần thiết cho hoạt động của component.
    // -------------------------------------------------------------------------------
    const [seatMatrix, setSeatMatrix] = useState<SeatCell[][]>(
        initialMatrix.length > 0 ? initialMatrix : createEmptyMatrix(room.rows, room.columns)
    )
    const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<SeatTypeId | null>(null)
    const [selectedRow, setSelectedRow] = useState<number | null>(null)
    const [selectedColumn, setSelectedColumn] = useState<number | null>(null)
    const [isRowTypeDialogOpen, setIsRowTypeDialogOpen] = useState(false)
    const [isColTypeDialogOpen, setIsColTypeDialogOpen] = useState(false)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: "addRow" | "addColumn"; index?: number } | null>(null)
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())

    // -------------------------------------------------------------------------------
    // KHỐI DỮ LIỆU PHÁI SINH (DERIVED DATA - useMemo)
    // Chức năng: Tính toán các dữ liệu cần thiết từ state và props. `useMemo` giúp
    // tối ưu hiệu suất bằng cách chỉ tính toán lại khi các dependency thay đổi.
    // -------------------------------------------------------------------------------

    const seatTypeNameById = useMemo(() => new Map(seatTypes.map((s) => [s.id, s.name])), [seatTypes])

    const disabledSeatVisual = useMemo<SeatVisualConfig>(() => {
        const color = generateColorFromString(DISABLED_LABEL)
        const hslParts = color.match(/hsl\((\d+), (\d+)%, (\d+)%\)/)
        const lightness = hslParts ? parseInt(hslParts[3], 10) : 50
        const text = lightness > 60 ? "#0f172a" : "#f8fafc"
        const shadow = `0 2px 8px hsla(${hslParts ? hslParts[1] : '0'}, 70%, 35%, 0.35)`
        return { background: color, text, shadow }
    }, [])

    const seatTypeVisualById = useMemo(() => {
        const map = new Map<number, SeatVisualConfig>()
        seatTypes.forEach((seatType) => {
            const color = generateColorFromString(seatType.name)
            const hslParts = color.match(/hsl\((\d+), (\d+)%, (\d+)%\)/)
            const lightness = hslParts ? parseInt(hslParts[3], 10) : 50
            const text = lightness > 60 ? "#0f172a" : "#f8fafc"
            const shadow = `0 2px 8px hsla(${hslParts ? hslParts[1] : '0'}, 70%, 35%, 0.35)`
            map.set(seatType.id, { background: color, text, shadow })
        })
        return map
    }, [seatTypes])

    const seatTypeCycleOrder = useMemo<SeatTypeId[]>(() => [...seatTypes.map(st => st.id), -1], [seatTypes])

    const fallbackSeatTypeId: SeatTypeId = (seatTypes[0]?.id ?? -1) as SeatTypeId

    // -------------------------------------------------------------------------------
    // KHỐI XỬ LÝ SIDE EFFECT (useEffect)
    // -------------------------------------------------------------------------------

    useEffect(() => {
        if (initialMatrix.length > 0) {
            setSeatMatrix(initialMatrix)
        } else if (room.rows && room.columns) {
            setSeatMatrix(createEmptyMatrix(room.rows, room.columns))
        }
    }, [initialMatrix, room.rows, room.columns])

    useEffect(() => {
        setSeatMatrix((prev) => {
            let changed = false
            const updated = prev.map(row => row.map((seat): SeatCell => {
                if (seat.seatTypeId > 0) {
                    const derivedName = seatTypeNameById.get(seat.seatTypeId)
                    if (derivedName && seat.seatTypeName !== derivedName) {
                        changed = true
                        return { ...seat, seatTypeName: derivedName }
                    }
                }
                return seat
            }))
            return changed ? updated : prev
        })
    }, [seatTypeNameById])

    useEffect(() => {
        if (!seatTypes.length) {
            if (selectedSeatTypeId !== null) setSelectedSeatTypeId(null)
            return
        }
        if (selectedSeatTypeId === null || selectedSeatTypeId === -1) return
        if (!seatTypeNameById.has(selectedSeatTypeId)) {
            setSelectedSeatTypeId(fallbackSeatTypeId)
        }
    }, [seatTypes, seatTypeNameById, selectedSeatTypeId, fallbackSeatTypeId])

    // -------------------------------------------------------------------------------
    // KHỐI CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS)
    // -------------------------------------------------------------------------------

    const getNextSeatTypeIdAfter = (seatTypeId: SeatTypeId): SeatTypeId => {
        const currentIndex = seatTypeCycleOrder.indexOf(seatTypeId)
        const nextIndex = (currentIndex + 1) % seatTypeCycleOrder.length
        return seatTypeCycleOrder[nextIndex]
    }

    const getNextSeatTypeIdForSeat = (seat: SeatCell): SeatTypeId => {
        const currentId = seat.status === "BLOCKED" || seat.seatTypeId === -1 ? -1 : seat.seatTypeId
        return getNextSeatTypeIdAfter(currentId)
    }

    const resolveSeatTypeName = (seatTypeId: SeatTypeId | null | undefined): string => {
        if (seatTypeId === -1) return DISABLED_LABEL
        if (seatTypeId == null) return "Chưa thiết lập"
        return seatTypeNameById.get(seatTypeId) ?? "Chưa thiết lập"
    }

    // -------------------------------------------------------------------------------
    // KHỐI CÁC HÀM XỬ LÝ SỰ KIỆN (ACTION HANDLERS)
    // -------------------------------------------------------------------------------

    const handleSeatClick = (row: number, col: number, event: React.MouseEvent) => {
        if (isPreviewMode) return

        const seatKey = `${row}-${col}`
        const draft = seatMatrix.map(r => [...r])
        const seat = draft[row][col]

        if (event.ctrlKey || event.metaKey) {
            const newSelection = new Set(selectedSeats)
            if (newSelection.has(seatKey)) newSelection.delete(seatKey)
            else newSelection.add(seatKey)
            setSelectedSeats(newSelection)
            return
        }

        const targetSeatTypeId = selectedSeatTypeId === null ? getNextSeatTypeIdForSeat(seat) : selectedSeatTypeId

        draft[row][col] = targetSeatTypeId === -1
            ? { ...seat, seatTypeId: -1, seatTypeName: DISABLED_LABEL, status: "BLOCKED" }
            : { ...seat, seatTypeId: targetSeatTypeId, seatTypeName: seatTypeNameById.get(targetSeatTypeId) ?? "", status: "AVAILABLE" }

        setSeatMatrix(draft)
        toast({ title: "Thay đổi loại ghế", description: `Ghế ${String.fromCharCode(65 + row)}${col + 1} đã chuyển sang ${resolveSeatTypeName(targetSeatTypeId)}` })
    }

    const applySelectedSeatType = () => {
        if (selectedSeats.size === 0) {
            toast({ title: "Chưa chọn ghế", description: "Hãy chọn ghế cần cập nhật" })
            return
        }

        const draft = seatMatrix.map(r => [...r])
        const targetSeatTypeId = selectedSeatTypeId === null ? -1 : selectedSeatTypeId

        selectedSeats.forEach(key => {
            const [r, c] = key.split("-").map(Number)
            if (draft[r]?.[c]) {
                draft[r][c] = targetSeatTypeId === -1
                    ? { ...draft[r][c], seatTypeId: -1, seatTypeName: DISABLED_LABEL, status: "BLOCKED" }
                    : { ...draft[r][c], seatTypeId: targetSeatTypeId, seatTypeName: seatTypeNameById.get(targetSeatTypeId) ?? "", status: "AVAILABLE" }
            }
        })

        setSeatMatrix(draft)
        setSelectedSeats(new Set())
        toast({ title: "Cập nhật thành công", description: `Đã thay đổi ${selectedSeats.size} ghế` })
    }

    const handleRowTypeChangeById = (rowIndex: number, seatTypeId: SeatTypeId) => {
        const draft = seatMatrix.map((row, rIdx) =>
            rIdx !== rowIndex ? row : row.map((seat): SeatCell =>
                seatTypeId === -1
                    ? { ...seat, seatTypeId: -1, seatTypeName: DISABLED_LABEL, status: "BLOCKED" }
                    : { ...seat, seatTypeId, seatTypeName: seatTypeNameById.get(seatTypeId) ?? "", status: "AVAILABLE" }
            )
        )
        setSeatMatrix(draft)
        setIsRowTypeDialogOpen(false)
        toast({ title: "Cập nhật thành công", description: `Đã thay đổi loại ghế hàng ${String.fromCharCode(65 + rowIndex)}` })
    }

    const handleColumnTypeChangeById = (colIndex: number, seatTypeId: SeatTypeId) => {
        const draft = seatMatrix.map(row =>
            row.map((seat, cIdx): SeatCell => {
                if (cIdx === colIndex) {
                    return seatTypeId === -1
                        ? { ...seat, seatTypeId: -1, seatTypeName: DISABLED_LABEL, status: "BLOCKED" }
                        : { ...seat, seatTypeId, seatTypeName: seatTypeNameById.get(seatTypeId) ?? "", status: "AVAILABLE" };
                }
                return seat;
            })
        );
        setSeatMatrix(draft);
        setIsColTypeDialogOpen(false);
        toast({ title: "Cập nhật thành công", description: `Đã thay đổi loại ghế cột ${colIndex + 1}` });
    };

    const confirmAction = (action: typeof pendingAction) => {
        if (!action) return
        const { type, index } = action
        if (type === "addRow") insertRow(index ?? seatMatrix.length - 1)
        else if (type === "addColumn") insertColumn(index ?? (seatMatrix[0]?.length ?? 0) - 1)
        setIsConfirmDialogOpen(false)
        setPendingAction(null)
    }

    const insertRow = (afterRow: number) => {
        const draft = seatMatrix.map(row => [...row])
        const columns = seatMatrix[0]?.length || room.columns
        const sid = selectedSeatTypeId === null ? fallbackSeatTypeId : selectedSeatTypeId
        const newRow: SeatCell[] = Array.from({ length: columns }, (_, col): SeatCell => ({
            id: null,
            row: afterRow + 1,
            column: col,
            seatTypeId: sid,
            seatTypeName: resolveSeatTypeName(sid),
            status: sid === -1 ? "BLOCKED" : "AVAILABLE",
        }))
        draft.splice(afterRow + 1, 0, newRow)
        for (let r = afterRow + 1; r < draft.length; r++) {
            for (let c = 0; c < draft[r].length; c++) {
                draft[r][c] = { ...draft[r][c], row: r }
            }
        }
        setSeatMatrix(draft)
        toast({ title: "Thêm hàng thành công", description: `Đã thêm hàng mới sau hàng ${String.fromCharCode(65 + afterRow)}` })
    }

    const insertColumn = (afterCol: number) => {
        const draft = seatMatrix.map(row => [...row])
        const sid = selectedSeatTypeId === null ? fallbackSeatTypeId : selectedSeatTypeId
        draft.forEach(row => {
            const newSeat: SeatCell = {
                id: null,
                row: row[0].row,
                column: afterCol + 1,
                seatTypeId: sid,
                seatTypeName: resolveSeatTypeName(sid),
                status: sid === -1 ? "BLOCKED" : "AVAILABLE",
            }
            row.splice(afterCol + 1, 0, newSeat)
            for (let c = afterCol + 1; c < row.length; c++) {
                row[c] = { ...row[c], column: c }
            }
        })
        setSeatMatrix(draft)
        toast({ title: "Thêm cột thành công", description: `Đã thêm cột mới sau cột ${afterCol + 1}` })
    }

    const handleSave = () => {
        onSave(seatMatrix)
        toast({ title: "Lưu thành công", description: "Cấu hình ghế đã được lưu" })
    }

    // -------------------------------------------------------------------------------
    // KHỐI RENDER GIAO DIỆN (UI RENDERING)
    // -------------------------------------------------------------------------------

    const getSeatVisual = (seat: SeatCell): { className: string; style?: CSSProperties } => {
        const isSeatDisabled = seat.status === "BLOCKED" || seat.seatTypeId === -1
        if (isPreviewMode) {
            return isSeatDisabled
                ? { className: "hidden" }
                : { className: "", style: seatTypeVisualById.get(seat.seatTypeId) ?? DEFAULT_SEAT_VISUAL }
        }
        if (isSeatDisabled) {
            return { className: "", style: { ...disabledSeatVisual, opacity: 0.65, cursor: "not-allowed" } }
        }
        return { className: "", style: seatTypeVisualById.get(seat.seatTypeId) ?? DEFAULT_SEAT_VISUAL }
    }

    const visibleSeatTypeIds = useMemo(() => {
        if (!isPreviewMode) return seatTypes.map(s => s.id)
        const visibleIds = new Set<number>()
        seatMatrix.forEach(row => row.forEach(seat => {
            if (seat.status !== "BLOCKED" && seat.seatTypeId > 0) {
                visibleIds.add(seat.seatTypeId)
            }
        }))
        return Array.from(visibleIds)
    }, [isPreviewMode, seatMatrix, seatTypes])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} className="text-foreground hover:bg-muted"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Thiết lập ghế - {room.name}</h1>
                        <p className="text-muted-foreground mt-1">Cấu hình bố trí ghế trong phòng chiếu</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)} className="text-foreground hover:bg-muted"><Eye className="w-4 h-4 mr-2" />{isPreviewMode ? "Chế độ chỉnh sửa" : "Xem trước"}</Button>
                    <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Lưu cấu hình</Button>
                </div>
            </div>

            {!isPreviewMode && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-foreground">Loại ghế:</label>
                                <Select value={selectedSeatTypeId === null ? AUTO_SELECT_VALUE : String(selectedSeatTypeId)} onValueChange={value => setSelectedSeatTypeId(value === AUTO_SELECT_VALUE ? null : Number(value))}>
                                    <SelectTrigger className="w-56"><SelectValue placeholder="Chọn loại ghế" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AUTO_SELECT_VALUE}>Xoay vòng theo danh sách</SelectItem>
                                        {seatTypes.map(st => (<SelectItem key={st.id} value={String(st.id)}>{st.name}</SelectItem>))}
                                        <SelectItem value="-1">{DISABLED_LABEL}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Nhấp vào ghế để áp dụng hoặc xoay vòng.<br />
                                    <span className="text-xs">Giữ Ctrl/Cmd + Click để chọn nhiều ghế.</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedSeats.size > 0 && (
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-sm text-foreground">Đã chọn {selectedSeats.size} ghế</span>
                                    <Button size="sm" onClick={applySelectedSeatType} className="bg-primary text-primary-foreground hover:bg-primary/90">Áp dụng</Button>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedSeats(new Set())} className="text-foreground hover:bg-muted">Bỏ chọn</Button>
                                </div>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setPendingAction({ type: "addRow", index: seatMatrix.length - 1 }); setIsConfirmDialogOpen(true) }} className="text-foreground hover:bg-muted"><Plus className="w-4 h-4 mr-1" />Thêm hàng</Button>
                            <Button variant="outline" size="sm" onClick={() => { setPendingAction({ type: "addColumn", index: (seatMatrix[0]?.length ?? 0) - 1 }); setIsConfirmDialogOpen(true) }} className="text-foreground hover:bg-muted"><Plus className="w-4 h-4 mr-1" />Thêm cột</Button>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="p-6">
                <div className="space-y-4">
                    <div className="operator-screen-container">
                        <div className="operator-screen-curve-top" />
                        <div className="operator-screen"><div className="flex items-center justify-center gap-3"><Monitor className="w-6 h-6" /><span>MÀN HÌNH</span><Monitor className="w-6 h-6" /></div></div>
                        <div className="operator-screen-curve-bottom" />
                        <div className="operator-screen-header"><div className="flex items-center justify-center gap-2"><Users className="w-4 h-4" /><span>Khu vực khán giả</span><Users className="w-4 h-4" /></div></div>
                    </div>

                    <div className="flex justify-center w-full">
                        <div className="relative max-w-4xl w-full">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-8" />
                                <div className="flex gap-1">
                                    {seatMatrix[0]?.map((_, colIndex) => (
                                        <div key={`col-${colIndex}`} className="relative group">
                                            <div className="w-8 text-center text-xs font-medium text-muted-foreground">{colIndex + 1}</div>
                                            {!isPreviewMode && (<Button size="icon" variant="ghost" className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground" title={`Thay đổi loại cột ${colIndex + 1}`} onClick={() => { setSelectedColumn(colIndex); setIsColTypeDialogOpen(true); }}><Settings className="w-3 h-3" /></Button>)}
                                        </div>
                                    ))}
                                </div>
                                {!isPreviewMode && (<Button size="sm" variant="ghost" onClick={() => { setPendingAction({ type: "addColumn", index: (seatMatrix[0]?.length ?? 0) - 1 }); setIsConfirmDialogOpen(true) }} className="w-6 h-6 p-0 text-primary hover:text-primary/80 ml-2" title="Thêm cột"><Plus className="w-3 h-3" /></Button>)}
                            </div>

                            <div className="flex justify-center">
                                <div className="relative">
                                    {seatMatrix.map((row, rowIndex) => (
                                        <div key={`row-${rowIndex}`} className="flex items-center gap-2 mb-3 group">
                                            <div className="w-8 text-center text-sm font-medium text-muted-foreground flex-shrink-0">{String.fromCharCode(65 + rowIndex)}</div>
                                            <div className="flex gap-1">
                                                {row.map((seat, colIndex) => {
                                                    const visual = getSeatVisual(seat)
                                                    if (isPreviewMode && visual.className === "hidden") {
                                                        return <div key={`${seat.id}-${rowIndex}-${colIndex}`} className="w-8 h-8" />
                                                    }
                                                    return (
                                                        <div key={`${seat.id}-${rowIndex}-${colIndex}`} className="relative group/seat">
                                                            <button onClick={(e) => handleSeatClick(rowIndex, colIndex, e)} className={`w-8 h-8 rounded text-xs font-medium transition-all duration-200 hover:scale-110 active:scale-95 ${visual.className} ${!isPreviewMode ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/30" : "cursor-default"} ${selectedSeats.has(`${rowIndex}-${colIndex}`) ? "outline outline-2 outline-primary outline-offset-2" : ""}`} style={visual.style} disabled={isPreviewMode} title={`Ghế ${String.fromCharCode(65 + rowIndex)}${colIndex + 1} - ${resolveSeatTypeName(seat.seatTypeId)}`}>
                                                                {colIndex + 1}
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {!isPreviewMode && (
                                                <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedRow(rowIndex); setIsRowTypeDialogOpen(true) }} className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground" title="Thay đổi loại hàng"><Settings className="w-3 h-3" /></Button>
                                                </div>
                                            )}
                                            {!isPreviewMode && (<div className="absolute left-0 -bottom-1 w-full h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-primary/80" onClick={() => insertRow(rowIndex)} title="Chèn hàng" />)}
                                        </div>
                                    ))}
                                    {!isPreviewMode && (
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <div className="w-8" />
                                            <Button size="sm" variant="ghost" onClick={() => { setPendingAction({ type: "addRow", index: seatMatrix.length - 1 }); setIsConfirmDialogOpen(true) }} className="text-primary hover:text-primary/80" title="Thêm hàng"><Plus className="w-4 h-4 mr-1" />Thêm hàng</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        <div className="operator-legend">
                            <div className="flex justify-center gap-8">
                                {seatTypes.filter(st => visibleSeatTypeIds.includes(st.id)).map(st => {
                                    const visual = seatTypeVisualById.get(st.id) ?? DEFAULT_SEAT_VISUAL
                                    return (<div key={st.id} className="operator-legend-item"><div className="operator-legend-color" style={{ background: visual.background, boxShadow: visual.shadow }} /><span className="text-sm text-foreground font-medium">{st.name}</span></div>)
                                })}
                                {!isPreviewMode && (<div className="operator-legend-item"><div className="operator-legend-color" style={{ background: disabledSeatVisual.background, boxShadow: disabledSeatVisual.shadow }} /><span className="text-sm text-foreground font-medium">{DISABLED_LABEL}</span></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Dialog open={isRowTypeDialogOpen} onOpenChange={setIsRowTypeDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Thay đổi loại ghế hàng {selectedRow !== null ? String.fromCharCode(65 + selectedRow) : ""}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {seatTypes.map(st => {
                                const visual = seatTypeVisualById.get(st.id) ?? DEFAULT_SEAT_VISUAL
                                return (<Button key={st.id} variant="outline" onClick={() => selectedRow !== null && handleRowTypeChangeById(selectedRow, st.id)} className="flex flex-col items-center gap-2 p-4"><div className="w-6 h-6 rounded" style={{ background: visual.background, boxShadow: visual.shadow }} /><span>{st.name}</span></Button>)
                            })}
                            <Button variant="outline" onClick={() => selectedRow !== null && handleRowTypeChangeById(selectedRow, -1)} className="flex flex-col items-center gap-2 p-4"><div className="w-6 h-6 rounded" style={{ background: disabledSeatVisual.background, boxShadow: disabledSeatVisual.shadow }} /><span>{DISABLED_LABEL}</span></Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isColTypeDialogOpen} onOpenChange={setIsColTypeDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Thay đổi loại ghế cột {selectedColumn !== null ? selectedColumn + 1 : ""}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {seatTypes.map(st => {
                                const visual = seatTypeVisualById.get(st.id) ?? DEFAULT_SEAT_VISUAL
                                return (<Button key={st.id} variant="outline" onClick={() => selectedColumn !== null && handleColumnTypeChangeById(selectedColumn, st.id)} className="flex flex-col items-center gap-2 p-4"><div className="w-6 h-6 rounded" style={{ background: visual.background, boxShadow: visual.shadow }} /><span>{st.name}</span></Button>)
                            })}
                            <Button variant="outline" onClick={() => selectedColumn !== null && handleColumnTypeChangeById(selectedColumn, -1)} className="flex flex-col items-center gap-2 p-4"><div className="w-6 h-6 rounded" style={{ background: disabledSeatVisual.background, boxShadow: disabledSeatVisual.shadow }} /><span>{DISABLED_LABEL}</span></Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{pendingAction?.type === "addRow" && "Thêm hàng mới"}{pendingAction?.type === "addColumn" && "Thêm cột mới"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-foreground">
                            {pendingAction?.type === "addRow" && `Bạn có chắc chắn muốn thêm hàng mới sau hàng ${String.fromCharCode(65 + (pendingAction.index ?? 0))}?`}
                            {pendingAction?.type === "addColumn" && `Bạn có chắc chắn muốn thêm cột mới sau cột ${(pendingAction.index ?? 0) + 1}?`}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Hủy</Button>
                            <Button onClick={() => confirmAction(pendingAction)} className="bg-primary text-primary-foreground hover:bg-primary/90">Thêm</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
