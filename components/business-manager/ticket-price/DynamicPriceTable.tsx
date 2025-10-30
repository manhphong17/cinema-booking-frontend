    "use client"

    import { useState } from "react"
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
    import { Edit, Check } from "lucide-react"
    import { EditPriceDialog } from "./EditPriceDialog"
    import apiClient from "@/src/api/interceptor"
    import { toast } from "sonner"

    interface RoomType {
        id: number
        name: string
    }

    interface SeatType {
        id: number
        name: string
    }

    interface TicketPrice {
        roomTypeId: number;
        seatTypeId: number;
        normalDayPrice: number;
        weekendPrice: number;
    }


    interface DynamicPriceTableProps {
        roomTypes: RoomType[]
        seatTypes: SeatType[]
        prices: TicketPrice[]
        onPricesChange: (prices: TicketPrice[]) => void
    }

    export function DynamicPriceTable({ roomTypes, seatTypes, prices, onPricesChange }: DynamicPriceTableProps) {
        const [editingCell, setEditingCell] = useState<string | null>(null)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
        const [selectedPrice, setSelectedPrice] = useState<TicketPrice | null>(null)
        const [priceType, setPriceType] = useState<"normalDayPrice" | "weekendPrice">("normalDayPrice")
        const dayTypes = [
            { key: "normalDayPrice" as const, label: "Ngày Thường" },
            { key: "weekendPrice" as const, label: "Cuối Tuần (T7, CN) / Ngày Lễ" },
        ];

        // Helper để format giá tiền
        const fmt = (v: number | undefined) => {
            if (!v && v !== 0) return "-";
            return v.toLocaleString("vi-VN") + "đ";
        };

        const getPrice = (
            roomTypeId: number,
            seatTypeId: number,
            type: "normalDayPrice" | "weekendPrice"
        ) => {
            const price = prices.find((p) => p.roomTypeId === roomTypeId && p.seatTypeId === seatTypeId)
            return price ? price[type] : undefined
        }


        const handleEditClick = (roomTypeId: number, seatTypeId: number, type: "normalDayPrice" | "weekendPrice") => {
            const price = prices.find((p) => p.roomTypeId === roomTypeId && p.seatTypeId === seatTypeId)
            setSelectedPrice(price || { roomTypeId, seatTypeId, normalDayPrice: 0, weekendPrice: 0 })
            setPriceType(type)
            setIsDialogOpen(true)
        }

        const handleSavePrice = async (newPrice: number) => {
            if (!selectedPrice) return;

            try {
                // Xác định loại ngày
                const dayType = priceType === "normalDayPrice" ? "NORMAL" : "HOLIDAY";

                // Gửi request lên BE
                const payload = {
                    seatTypeId: selectedPrice.seatTypeId,
                    roomTypeId: selectedPrice.roomTypeId,
                    dayType,
                    price: newPrice,
                };

                const res = await apiClient.post("/ticket-prices", payload);
                const saved = res.data.data; // BE trả về TicketPrice

                toast.success("Cập nhật giá vé thành công!");

                // Cập nhật FE local state
                const updatedPrices = [...prices];
                const existingIndex = updatedPrices.findIndex(
                    (p) =>
                        p.roomTypeId === saved.roomType.id &&
                        p.seatTypeId === saved.seatType.id
                );

                if (existingIndex >= 0) {
                    // Update giá cũ
                    updatedPrices[existingIndex] = {
                        ...updatedPrices[existingIndex],
                        [priceType]: newPrice,
                    };
                } else {
                    // Nếu chưa có → thêm mới
                    updatedPrices.push({
                        roomTypeId: saved.roomType.id,
                        seatTypeId: saved.seatType.id,
                        normalDayPrice: dayType === "NORMAL" ? newPrice : 0,
                        weekendPrice: dayType === "HOLIDAY" ? newPrice : 0,
                    });
                }

                onPricesChange(updatedPrices);
            } catch (err) {
                console.error("Lỗi cập nhật giá vé:", err);
                toast.error("Không thể cập nhật giá vé!");
            } finally {
                setIsDialogOpen(false);
                setSelectedPrice(null);
            }
        };


        return (
            <>
                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Bảng giá vé</CardTitle>
                        <CardDescription className="text-gray-600">
                            Quản lý giá vé theo loại phòng, loại ghế và ngày chiếu.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                {/* ===== HEADER ===== */}
                                <TableHeader>
                                    <TableRow>
                                        <TableHead  className="w-44 border border-gray-300 bg-gray-50">Loại Phòng</TableHead>
                                        {roomTypes.map((room) => (
                                            <TableHead
                                                key={room.id}
                                                colSpan={seatTypes.length}
                                                className="text-center border border-gray-300 bg-gray-50"
                                            >
                                                {room.name}
                                            </TableHead>
                                        ))}
                                    </TableRow>

                                    <TableRow>
                                        <TableHead className="border border-gray-300 bg-gray-50">Loại Ghế</TableHead>
                                        {roomTypes.flatMap((room) =>
                                            seatTypes.map((seat) => (
                                                <TableHead
                                                    key={`${room.id}-${seat.id}`}
                                                    className="text-center text-sm border border-gray-300 bg-gray-50"
                                                >
                                                    {seat.name}
                                                </TableHead>
                                            ))
                                        )}
                                    </TableRow>
                                </TableHeader>

                                {/* ===== BODY ===== */}
                                <TableBody>
                                    {dayTypes.map((d) => (
                                        <TableRow key={d.key}>
                                            <TableCell className="font-semibold text-gray-900 border border-gray-300 bg-gray-50">
                                                {d.label}
                                            </TableCell>

                                            {roomTypes.flatMap((room) =>
                                                    seatTypes.map((seat) => (
                                                        <TableCell
                                                            key={`${room.id}-${seat.id}-${d.key}`}
                                                            className="align-middle text-center border border-gray-300"
                                                        >
                                                            <div className="flex items-center justify-between gap-2 group">
                                                                <span className="text-gray-900 font-medium tabular-nums">
                                                                    {fmt(getPrice(room.id, seat.id, d.key))}
                                                                </span>

                                                                <button
                                                                    onClick={() =>
                                                                        handleEditClick(room.id, seat.id, d.key)
                                                                    }
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded"
                                                                    aria-label="Sửa giá"
                                                                >
                                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    ))
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>


                    </CardContent>
                </Card>

                <EditPriceDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    currentPrice={selectedPrice ? selectedPrice[priceType] : 0}
                    onSave={handleSavePrice}
                    priceType={priceType}
                />
            </>
        )
    }
