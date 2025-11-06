"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { apiClient } from "@/src/api/interceptor"

interface ConcessionsSelectionProps {
  onAddToCart: (item: {
    type: "ticket" | "concession"
    name: string
    price: number
    quantity: number
    details?: string
  }) => void
  onSyncConcessionsToCart?: (selectedConcessions: Record<string, number>, concessions: any[]) => void
}

export function ConcessionsSelection({ onAddToCart, onSyncConcessionsToCart }: ConcessionsSelectionProps) {
  const [concessions, setConcessions] = useState<any[]>([])
  const [loadingConcessions, setLoadingConcessions] = useState(false)
  const [selectedConcessions, setSelectedConcessions] = useState<Record<string, number>>({})

  // Fetch concessions from API
  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        setLoadingConcessions(true)
        const res = await apiClient.get("/concession", {
          params: {
            page: 0,
            size: 100,
            stockStatus: "IN_STOCK",
            concessionStatus: "ACTIVE",
          },
        })
        const list = res.data?.data?.content || []
        setConcessions(list)
      } catch (error) {
        console.error("Lỗi khi lấy concessions:", error)
      } finally {
        setLoadingConcessions(false)
      }
    }

    fetchConcessions()
  }, [])

  // Auto-sync selected concessions to cart whenever selectedConcessions changes
  useEffect(() => {
    if (onSyncConcessionsToCart) {
      onSyncConcessionsToCart(selectedConcessions, concessions)
    }
  }, [selectedConcessions, concessions, onSyncConcessionsToCart])

  const updateConcessionQuantity = (concessionId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedConcessions }
      delete newSelected[concessionId]
      setSelectedConcessions(newSelected)
    } else {
      setSelectedConcessions(prev => ({ ...prev, [concessionId]: quantity }))
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border-2 border-primary/30 bg-white hover:shadow-primary/20 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border-b-2 border-primary/40">
          <CardTitle className="flex items-center gap-2 text-primary">
            <ShoppingCart className="h-5 w-5" />
            Chọn sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingConcessions ? (
              <p className="text-center text-muted-foreground col-span-full">Đang tải danh sách sản phẩm...</p>
            ) : concessions.length === 0 ? (
              <p className="text-center text-muted-foreground col-span-full">Không có sản phẩm khả dụng</p>
            ) : (
              concessions.map((item) => (
                <Card key={item.concessionId} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={item.urlImage || "/placeholder.svg"}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary text-white">
                        {item.price.toLocaleString('vi-VN')} VNĐ
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description || "Không có mô tả"}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateConcessionQuantity(item.concessionId.toString(), (selectedConcessions[item.concessionId.toString()] || 0) - 1)}
                          disabled={!selectedConcessions[item.concessionId.toString()]}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {selectedConcessions[item.concessionId.toString()] || 0}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateConcessionQuantity(item.concessionId.toString(), (selectedConcessions[item.concessionId.toString()] || 0) + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Tổng</div>
                        <div className="font-semibold">
                          {((selectedConcessions[item.concessionId.toString()] || 0) * item.price).toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
