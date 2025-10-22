"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Settings, Eye, Users, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SeatVisualType = "standard" | "vip" | "disabled"
type SeatVisualStatus = "available" | "occupied" | "reserved" | "blocked"

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
        status: "available"
      }
    }
  }
  return matrix
}

export function SeatSetup({ room, initialMatrix, seatTypes, onBack, onSave }: SeatSetupProps) {
  const { toast } = useToast()
  const [seatMatrix, setSeatMatrix] = useState<SeatCell[][]>(initialMatrix.length ? initialMatrix : createEmptyMatrix(room.rows, room.columns))
  const visualTypeToSeatTypeId = useMemo(() => {
    const mapping: Record<SeatVisualType, number | undefined> = { standard: undefined, vip: undefined, disabled: undefined }
    seatTypes.forEach((type) => {
      const normalized = type.name.toLowerCase()
      if (normalized.includes('vip')) mapping.vip = mapping.vip ?? type.id
      else if (normalized.includes('disable') || normalized.includes('khuyết') || normalized.includes('block')) mapping.disabled = mapping.disabled ?? type.id
      else mapping.standard = mapping.standard ?? type.id
    })
    return mapping
  }, [seatTypes])

  const fallbackSeatTypeId = visualTypeToSeatTypeId.standard ?? visualTypeToSeatTypeId.vip ?? visualTypeToSeatTypeId.disabled ?? seatTypes[0]?.id ?? 0

  const [selectedSeatType, setSelectedSeatType] = useState<SeatVisualType>("standard")
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [isRowTypeDialogOpen, setIsRowTypeDialogOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'addRow' | 'addColumn' | 'removeRow' | 'removeColumn'
    index?: number
  } | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (initialMatrix.length) {
      setSeatMatrix(initialMatrix)
    } else if (room.rows && room.columns) {
      setSeatMatrix(createEmptyMatrix(room.rows, room.columns))
    }
  }, [initialMatrix, room.rows, room.columns])

  const handleSeatClick = (row: number, col: number, event: React.MouseEvent) => {
    if (isPreviewMode) return

    const seatId = `${row}-${col}`
    const newMatrix = seatMatrix.map((r) => [...r])
    const seat = newMatrix[row][col]

    if (event.ctrlKey || event.metaKey) {
      const newSelectedSeats = new Set(selectedSeats)
      if (newSelectedSeats.has(seatId)) {
        newSelectedSeats.delete(seatId)
      } else {
        newSelectedSeats.add(seatId)
      }
      setSelectedSeats(newSelectedSeats)
      return
    }

    const currentType = seat.type
    let newType: SeatVisualType
    switch (currentType) {
      case "standard":
        newType = "vip"
        break
      case "vip":
        newType = "disabled"
        break
      case "disabled":
      default:
        newType = "standard"
        break
    }

    const seatTypeId = visualTypeToSeatTypeId[newType] ?? fallbackSeatTypeId
    newMatrix[row][col] = {
      ...seat,
      type: newType,
      seatTypeId: seatTypeId ?? seat.seatTypeId,
      status: seat.status === "blocked" ? "available" : seat.status,
    }
    setSeatMatrix(newMatrix)

    const seatLabel = `${String.fromCharCode(65 + row)}${col + 1}`
    const typeLabels: Record<SeatVisualType, string> = {
      standard: "Standard",
      vip: "VIP",
      disabled: "Vô hiệu hóa",
    }

    toast({
      title: "Thay đổi loại ghế",
      description: `Ghế ${seatLabel} đã được đổi thành ${typeLabels[newType]}`
    })
  }

  const applySelectedSeatType = () => {
    if (selectedSeats.size === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất một ghế để thay đổi loại"
      })
      return
    }

    const targetSeatTypeId = visualTypeToSeatTypeId[selectedSeatType] ?? fallbackSeatTypeId
    const newMatrix = seatMatrix.map((row) => [...row])
    let changedCount = 0

    selectedSeats.forEach((seatId) => {
      const [rowStr, colStr] = seatId.split("-")
      const row = Number(rowStr)
      const col = Number(colStr)
      const seat = newMatrix[row]?.[col]
      if (seat) {
        newMatrix[row][col] = {
          ...seat,
          type: selectedSeatType,
          seatTypeId: targetSeatTypeId ?? seat.seatTypeId,
          status: seat.status === "blocked" ? "available" : seat.status,
        }
        changedCount++
      }
    })

    setSeatMatrix(newMatrix)
    setSelectedSeats(new Set())

    const typeLabels: Record<SeatVisualType, string> = {
      standard: "Standard",
      vip: "VIP",
      disabled: "Vô hiệu hóa",
    }

    toast({
      title: "Cập nhật thành công",
      description: `Đã thay đổi ${changedCount} ghế thành ${typeLabels[selectedSeatType]}`
    })
  }

  const handleRowTypeChange = (rowIndex: number, newType: SeatVisualType) => {
    const targetSeatTypeId = visualTypeToSeatTypeId[newType] ?? fallbackSeatTypeId
    const newMatrix = seatMatrix.map((row, rIdx) => {
      if (rIdx !== rowIndex) return [...row]
      return row.map((seat) => ({
        ...seat,
        type: newType,
        seatTypeId: targetSeatTypeId ?? seat.seatTypeId,
        status: seat.status === "blocked" ? "available" : seat.status,
      }))
    })
    setSeatMatrix(newMatrix)
    setIsRowTypeDialogOpen(false)
    toast({
      title: "Cập nhật thành công",
      description: `Đã thay đổi loại ghế hàng ${rowIndex + 1} thành ${newType}`
    })
  }

  const confirmAction = (action: typeof pendingAction) => {
    if (!action) return
    
    switch (action.type) {
      case 'addRow':
        insertRow(action.index ?? seatMatrix.length - 1)
        break
      case 'addColumn':
        insertColumn(action.index ?? seatMatrix[0]?.length - 1)
        break
      case 'removeRow':
        removeRow(action.index!)
        break
      case 'removeColumn':
        removeColumn(action.index!)
        break
    }
    
    setIsConfirmDialogOpen(false)
    setPendingAction(null)
  }

  const insertRow = (afterRow: number) => {
    const newMatrix = seatMatrix.map((row) => [...row])
    const columns = seatMatrix[0]?.length || room.columns
    const newRow: SeatCell[] = []
    for (let col = 0; col < columns; col++) {
      newRow[col] = {
        id: null,
        row: afterRow + 1,
        column: col,
        type: "standard",
        status: "available",
        seatTypeId: visualTypeToSeatTypeId.standard ?? fallbackSeatTypeId,
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
    toast({
      title: "Thêm hàng thành công",
      description: `Đã thêm hàng mới sau hàng ${String.fromCharCode(65 + afterRow)}`
    })
  }

  const insertColumn = (afterCol: number) => {
    const newMatrix = seatMatrix.map((row) => [...row])
    for (let row = 0; row < newMatrix.length; row++) {
      const newSeat: SeatCell = {
        id: null,
        row,
        column: afterCol + 1,
        type: "standard",
        status: "available",
        seatTypeId: visualTypeToSeatTypeId.standard ?? fallbackSeatTypeId,
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
    toast({
      title: "Thêm cột thành công",
      description: `Đã thêm cột mới sau cột ${afterCol + 1}`
    })
  }

  const removeRow = (rowIndex: number) => {
    if (seatMatrix.length <= 1) {
      toast({
        title: "Không thể xóa",
        description: "Phải có ít nhất 1 hàng ghế"
      })
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
    toast({
      title: "Xóa hàng thành công",
      description: `Đã xóa hàng ${String.fromCharCode(65 + rowIndex)}`
    })
  }

  const removeColumn = (colIndex: number) => {
    if (seatMatrix[0]?.length <= 1) {
      toast({
        title: "Không thể xóa",
        description: "Phải có ít nhất 1 cột ghế"
      })
      return
    }

    const newMatrix = seatMatrix.map((row) => {
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
    toast({
      title: "Xóa cột thành công",
      description: `Đã xóa cột ${colIndex + 1}`
    })
  }

  const handleSave = () => {
    onSave(seatMatrix)
    toast({
      title: "Lưu thành công",
      description: "Cấu hình ghế đã được lưu"
    })
  }

  const getSeatColor = (seat: SeatCell) => {
    if (isPreviewMode) {
      if (seat.status === "occupied") return "operator-seat-occupied"
      if (seat.status === "reserved") return "operator-seat-reserved"
      if (seat.status === "blocked") return "operator-seat-disabled"
      return "operator-seat-available"
    }

    switch (seat.type) {
      case "vip":
        return "operator-seat-vip"
      case "disabled":
        return "operator-seat-disabled"
      default:
        return "operator-seat-standard"
    }
  }

  const getSeatTextColor = (seat: SeatCell) => {
    if (isPreviewMode) {
      if (seat.status === "occupied" || seat.status === "reserved") return "text-white"
      if (seat.status === "blocked") return "text-gray-600"
      return "text-white"
    }

    switch (seat.type) {
      case "vip":
        return "text-yellow-900"
      case "disabled":
        return "text-gray-600"
      default:
        return "text-white"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thiết lập ghế - {room.name}</h1>
            <p className="text-muted-foreground mt-1">Cấu hình bố trí ghế trong phòng chiếu</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="text-foreground hover:bg-muted"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? "Chế độ chỉnh sửa" : "Xem trước"}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
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
                <Select value={selectedSeatType} onValueChange={(value: SeatVisualType) => setSelectedSeatType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="disabled">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Nhấp vào ghế để thay đổi loại: Standard → VIP → Vô hiệu hóa → Standard
                  <br />
                  <span className="text-xs">Giữ Ctrl + Click để chọn nhiều ghế</span>
                </span>
              </div>
            </div>
            
            {/* Multi-select and Add Buttons */}
            <div className="flex items-center gap-2">
              {selectedSeats.size > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-foreground">
                    Đã chọn {selectedSeats.size} ghế
                  </span>
                  <Button
                    size="sm"
                    onClick={applySelectedSeatType}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Áp dụng loại đã chọn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSeats(new Set())}
                    className="text-foreground hover:bg-muted"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingAction({ type: 'addRow', index: seatMatrix.length - 1 })
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
                  setPendingAction({ type: 'addColumn', index: seatMatrix[0]?.length - 1 || 0 })
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
                <div className="flex gap-1">
                  {seatMatrix[0]?.map((_, colIndex) => (
                    <div key={colIndex} className="w-8 text-center text-xs font-medium text-muted-foreground">
                      {colIndex + 1}
                    </div>
                  ))}
                </div>
                {!isPreviewMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPendingAction({ type: 'addColumn', index: seatMatrix[0]?.length - 1 || 0 })
                      setIsConfirmDialogOpen(true)
                    }}
                    className="w-6 h-6 p-0 text-primary hover:text-primary/80 ml-2"
                    title="Thêm cột"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
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
                        {row.map((seat, colIndex) => (
                          <div key={seat.id} className="relative group/seat">
                            <button
                              onClick={(e) => handleSeatClick(rowIndex, colIndex, e)}
                              className={`w-8 h-8 rounded text-xs font-medium transition-all duration-200 hover:scale-110 active:scale-95 ${getSeatColor(seat)} ${getSeatTextColor(seat)} ${
                                !isPreviewMode ? 'cursor-pointer ring-2 ring-transparent hover:ring-primary/30' : 'cursor-default'
                              } ${
                                selectedSeats.has(`${rowIndex}-${colIndex}`) ? 'ring-2 ring-primary ring-offset-2' : ''
                              }`}
                              disabled={isPreviewMode}
                              title={`Ghế ${String.fromCharCode(65 + rowIndex)}${colIndex + 1} - ${seat.type === 'standard' ? 'Standard' : seat.type === 'vip' ? 'VIP' : 'Vô hiệu hóa'}${selectedSeats.has(`${rowIndex}-${colIndex}`) ? ' (Đã chọn)' : ''}`}
                            >
                              {colIndex + 1}
                            </button>
                            
                            {/* Insert column indicator */}
                            {!isPreviewMode && (
                              <div
                                className="absolute top-1/2 -right-1 w-2 h-2 bg-primary opacity-0 group-hover/seat:opacity-100 transition-opacity cursor-pointer hover:bg-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  insertColumn(colIndex)
                                }}
                                title="Chèn cột"
                              />
                            )}
                          </div>
                        ))}
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
                              setPendingAction({ type: 'removeRow', index: rowIndex })
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
                          setPendingAction({ type: 'addRow', index: seatMatrix.length - 1 })
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
                {isPreviewMode ? (
                  <>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-available"></div>
                      <span className="text-sm text-foreground font-medium">Có sẵn</span>
                    </div>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-reserved"></div>
                      <span className="text-sm text-foreground font-medium">Đã đặt</span>
                    </div>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-occupied"></div>
                      <span className="text-sm text-foreground font-medium">Đã bán</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-standard"></div>
                      <span className="text-sm text-foreground font-medium">Standard</span>
                    </div>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-vip"></div>
                      <span className="text-sm text-foreground font-medium">VIP</span>
                    </div>
                    <div className="operator-legend-item">
                      <div className="operator-legend-color operator-seat-disabled"></div>
                      <span className="text-sm text-foreground font-medium">Vô hiệu hóa</span>
                    </div>
                  </>
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
            <DialogTitle>Thay đổi loại ghế hàng {selectedRow !== null ? String.fromCharCode(65 + selectedRow) : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => selectedRow !== null && handleRowTypeChange(selectedRow, "standard")}
                className="flex flex-col items-center gap-2 p-4"
              >
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span>Standard</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedRow !== null && handleRowTypeChange(selectedRow, "vip")}
                className="flex flex-col items-center gap-2 p-4"
              >
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span>VIP</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedRow !== null && handleRowTypeChange(selectedRow, "disabled")}
                className="flex flex-col items-center gap-2 p-4"
              >
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <span>Vô hiệu hóa</span>
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
              {pendingAction?.type === 'addRow' && 'Thêm hàng mới'}
              {pendingAction?.type === 'addColumn' && 'Thêm cột mới'}
              {pendingAction?.type === 'removeRow' && 'Xóa hàng'}
              {pendingAction?.type === 'removeColumn' && 'Xóa cột'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground">
              {pendingAction?.type === 'addRow' && `Bạn có chắc chắn muốn thêm hàng mới sau hàng ${String.fromCharCode(65 + (pendingAction.index || 0))}?`}
              {pendingAction?.type === 'addColumn' && `Bạn có chắc chắn muốn thêm cột mới sau cột ${(pendingAction.index || 0) + 1}?`}
              {pendingAction?.type === 'removeRow' && `Bạn có chắc chắn muốn xóa hàng ${String.fromCharCode(65 + (pendingAction.index || 0))}?`}
              {pendingAction?.type === 'removeColumn' && `Bạn có chắc chắn muốn xóa cột ${(pendingAction.index || 0) + 1}?`}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={() => confirmAction(pendingAction)}
                className={pendingAction?.type?.includes('remove') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
              >
                {pendingAction?.type?.includes('remove') ? 'Xóa' : 'Thêm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}