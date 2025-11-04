"use client"

// Overview
// Function: Interactive seat configuration UI for a cinema room (select seats, change type, add rows, delete seats).
// Output: Rendered seat grid with selection, legend, stats, and action controls; toast feedback for actions.
// Input: roomId (identifier of current room), onBack (navigation callback), initial in-component demo data (seats state).

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Function: Shape for a single seat in the UI model.
// Output: Provides TypeScript safety for seat objects.
// Input: Used by component state and helpers.
interface Seat {
    id: string
    row: string
    number: number
    type: "standard" | "vip"
}

// Function: Props contract for SeatManagement component.
// Output: Ensures parent passes required values.
// Input: roomId for labeling; onBack callback for navigation.
interface SeatManagementProps {
    roomId: string
    onBack: () => void
}

// Function: SeatManagement component renders and manages seat grid interactions.
// Output: Full seat editor UI with controls and toasts.
// Input: Props (roomId, onBack); internal React state; user actions (clicks).
export function SeatManagement({ roomId, onBack }: SeatManagementProps) {
    const { toast } = useToast()

    // Function: Primary seat collection (demo-initialized); source of truth for grid.
    // Output: Current list of seats rendered in the grid.
    // Input: Updated by changeSeatType, deleteSelectedSeats, addRow.
    const [seats, setSeats] = useState<Seat[]>([
        { id: "1", row: "A", number: 1, type: "standard" },
        { id: "2", row: "A", number: 2, type: "standard" },
        { id: "3", row: "A", number: 3, type: "vip" },
        { id: "4", row: "A", number: 4, type: "vip" },
        { id: "5", row: "B", number: 1, type: "standard" },
        { id: "6", row: "B", number: 2, type: "standard" },
        { id: "7", row: "B", number: 3, type: "standard" },
        { id: "8", row: "B", number: 4, type: "standard" },
    ])

    // Function: Track which seats are currently selected by the operator.
    // Output: Array of selected seat ids used to style and mutate seats.
    // Input: Toggled via toggleSeatSelection handler.
    const [selectedSeats, setSelectedSeats] = useState<string[]>([])

    // Function: Derive unique row labels and max seat count per row.
    // Output: rows (sorted labels) and maxSeatsPerRow (computed metric for potential layout logic).
    // Input: Computed from seats state.
    const rows = Array.from(new Set(seats.map((s) => s.row))).sort()
    const maxSeatsPerRow = Math.max(...rows.map((row) => seats.filter((s) => s.row === row).length))

    // Function: Toggle selection for a single seat id.
    // Output: Updates selectedSeats to include or exclude the id.
    // Input: seatId string from clicked seat button.
    const toggleSeatSelection = (seatId: string) => {
        setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
    }

    // Function: Bulk change type for all selected seats.
    // Output: Updates seats state (type field) and clears selection; shows toast feedback.
    // Input: type ("standard" | "vip") chosen from action buttons; uses selectedSeats.
    const changeSeatType = (type: "standard" | "vip") => {
        if (selectedSeats.length === 0) {
            toast({ title: "Chưa chọn ghế", description: "Vui lòng chọn ghế để thay đổi loại", variant: "destructive" })
            return
        }
        setSeats(seats.map((seat) => (selectedSeats.includes(seat.id) ? { ...seat, type } : seat)))
        toast({
            title: "Cập nhật thành công",
            description: `Đã đổi ${selectedSeats.length} ghế sang ${type === "standard" ? "Standard" : "VIP"}`,
        })
        setSelectedSeats([])
    }

    // Function: Delete all selected seats from the grid.
    // Output: seats state without selected items; selection cleared; success toast.
    // Input: selectedSeats array to filter from seats.
    const deleteSelectedSeats = () => {
        if (selectedSeats.length === 0) {
            toast({ title: "Chưa chọn ghế", description: "Vui lòng chọn ghế để xóa", variant: "destructive" })
            return
        }
        setSeats(seats.filter((seat) => !selectedSeats.includes(seat.id)))
        toast({ title: "Xóa thành công", description: `Đã xóa ${selectedSeats.length} ghế` })
        setSelectedSeats([])
    }

    // Function: Append a new row with 8 standard seats; label follows alphabet A, B, C, ...
    // Output: seats state extended with a new row; success toast.
    // Input: Depends on current rows length to compute nextRow; uses Date.now() for unique ids.
    const addRow = () => {
        const nextRow = String.fromCharCode(65 + rows.length)
        const newSeats: Seat[] = Array.from({ length: 8 }, (_, i) => ({
            id: `${Date.now()}-${i}`,
            row: nextRow,
            number: i + 1,
            type: "standard",
        }))
        setSeats([...seats, ...newSeats])
        toast({ title: "Thêm thành công", description: `Đã thêm hàng ${nextRow}` })
    }

    // Function: Quick metrics for the sidebar statistics.
    // Output: Counts for standard and vip seats.
    // Input: Computed from current seats state.
    const standardCount = seats.filter((s) => s.type === "standard").length
    const vipCount = seats.filter((s) => s.type === "vip").length

    // Function: Render the seat editor layout (header, grid, legend, stats, actions).
    // Output: JSX tree for the whole page; interactive buttons and badges.
    // Input: All state & handlers defined above; props roomId/onBack.
    return (
        <div className="space-y-6">
            {/* Header: Back navigation and room info */}
            {/* Function: Provide context and a way to return to previous view. */}
            {/* Output: Back button triggers onBack; titles show current room. */}
            {/* Input: onBack prop; roomId for labeling. */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="text-foreground hover:bg-muted">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý Ghế ngồi</h1>
                    <p className="text-muted-foreground mt-1">Phòng {roomId} - Cấu hình sơ đồ ghế</p>
                </div>
            </div>

            {/* Main grid: seat map + sidebar */}
            {/* Function: Two-column layout with seat canvas and controls. */}
            {/* Output: Left—interactive seat grid; Right—stats and actions. */}
            {/* Input: seats, selectedSeats, handlers (toggle, change type, add row, delete). */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Card className="bg-card border-border p-6">
                        {/* Screen banner */}
                        {/* Function: Visual reference for seat orientation. */}
                        {/* Output: Muted label "MÀN HÌNH" centered above grid. */}
                        {/* Input: None. */}
                        <div className="mb-6 text-center">
                            <div className="inline-block bg-muted px-8 py-2 rounded text-muted-foreground font-medium">MÀN HÌNH</div>
                        </div>

                        {/* Seat grid */}
                        {/* Function: Render each row with its seats; allow selection. */}
                        {/* Output: Buttons styled by type and selection, showing seat numbers. */}
                        {/* Input: rows (labels), seats filtered per row, toggleSeatSelection. */}
                        <div className="space-y-3">
                            {rows.map((row) => (
                                <div key={row} className="flex items-center gap-2">
                                    <div className="w-8 text-center font-medium text-foreground">{row}</div>
                                    <div className="flex gap-2 flex-1 justify-center">
                                        {seats
                                            .filter((seat) => seat.row === row)
                                            .sort((a, b) => a.number - b.number)
                                            .map((seat) => (
                                                <button
                                                    key={seat.id}
                                                    onClick={() => toggleSeatSelection(seat.id)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-lg border-2 operator-transition-all flex items-center justify-center text-xs font-medium",
                                                        seat.type === "standard" && "operator-bg-standard-seat operator-border-standard-seat text-white",
                                                        seat.type === "vip" && "operator-bg-vip-seat operator-border-vip-seat text-white",
                                                        selectedSeats.includes(seat.id) &&
                                                        "ring-2 ring-operator-primary ring-offset-2 ring-offset-operator-background scale-110",
                                                    )}
                                                >
                                                    {seat.number}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        {/* Function: Explain color coding for seat types. */}
                        {/* Output: Two labeled color swatches (Standard, VIP). */}
                        {/* Input: Styling utility classes only. */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded operator-bg-standard-seat"></div>
                                <span className="operator-text-foreground">Standard</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded operator-bg-vip-seat"></div>
                                <span className="operator-text-foreground">VIP</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: stats & actions */}
                {/* Function: Show live counts and provide seat operations. */}
                {/* Output: Two cards—Statistics and Actions. */}
                {/* Input: seats, selectedSeats; action handlers. */}
                <div className="space-y-4">
                    {/* Statistics card */}
                    {/* Function: Display totals and selection count. */}
                    {/* Output: Badges with numbers. */}
                    {/* Input: seats.length, standardCount, vipCount, selectedSeats.length. */}
                    <Card className="bg-card border-border p-4">
                        <h3 className="font-semibold text-foreground mb-3">Thống kê</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tổng ghế:</span>
                                <Badge variant="outline" className="border-border text-foreground">
                                    {seats.length}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Standard:</span>
                                <Badge className="bg-standard-seat text-white">{standardCount}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">VIP:</span>
                                <Badge className="bg-vip-seat text-white">{vipCount}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Đã chọn:</span>
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                    {selectedSeats.length}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Actions card */}
                    {/* Function: Trigger mutations (add row, convert type, delete). */}
                    {/* Output: Buttons that call handlers with toasts. */}
                    {/* Input: Handlers addRow, changeSeatType, deleteSelectedSeats. */}
                    <Card className="bg-card border-border p-4">
                        <h3 className="font-semibold text-foreground mb-3">Thao tác</h3>
                        <div className="space-y-2">
                            <Button onClick={addRow} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm hàng ghế
                            </Button>
                            <Button
                                onClick={() => changeSeatType("standard")}
                                variant="outline"
                                className="w-full operator-border-standard-seat operator-text-standard-seat operator-hover-standard-seat"
                            >
                                Đổi sang Standard
                            </Button>
                            <Button
                                onClick={() => changeSeatType("vip")}
                                variant="outline"
                                className="w-full operator-border-vip-seat operator-text-vip-seat operator-hover-vip-seat"
                            >
                                Đổi sang VIP
                            </Button>
                            <Button
                                onClick={deleteSelectedSeats}
                                variant="outline"
                                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa ghế đã chọn
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
