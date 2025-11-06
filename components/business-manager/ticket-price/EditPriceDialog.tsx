"use client"

import {useEffect, useState} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditPriceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentPrice: number
    onSave: (price: number) => void
    priceType: "normalDayPrice" | "weekendPrice"
}

export function EditPriceDialog({ open, onOpenChange, currentPrice, onSave, priceType }: EditPriceDialogProps) {
    const [price, setPrice] = useState("")

    useEffect(() => {
        if (currentPrice !== null && currentPrice !== undefined) {
            setPrice(currentPrice.toString())
        }
    }, [currentPrice])

    const handleSave = () => {
        const numPrice = Number(price)
        if (!isNaN(numPrice) && numPrice >= 0) {
            onSave(numPrice)
            setPrice("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa giá vé</DialogTitle>
                    <DialogDescription>
                        {priceType === "normalDayPrice" ? "Giá vé ngày thường" : "Giá vé cuối tuần / ngày lễ"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Giá vé (VNĐ)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Nhập giá vé"
                            className="border-blue-200"
                            min="0"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-blue-200">
                        Hủy
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        Lưu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

