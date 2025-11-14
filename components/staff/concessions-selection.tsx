"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { apiClient } from "@/src/api/interceptor"
import { toast } from "sonner"

interface ConcessionsSelectionProps {
  onAddToCart: (item: {
    type: "ticket" | "concession"
    name: string
    price: number
    quantity: number
    details?: string
  }) => void
  onSyncConcessionsToCart?: (selectedConcessions: Record<string, number>, concessions: any[]) => void
  showtimeId?: number | null
  userId?: number | null
}

export function ConcessionsSelection({ onAddToCart, onSyncConcessionsToCart, showtimeId, userId }: ConcessionsSelectionProps) {
  const [concessions, setConcessions] = useState<any[]>([])
  const [loadingConcessions, setLoadingConcessions] = useState(false)
  const [selectedConcessions, setSelectedConcessions] = useState<Record<string, number>>({})
  const isUpdatingOrderSessionRef = useRef(false)

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

  // Update order-session immediately when selectedConcessions changes (only need userId)
  useEffect(() => {
    const updateOrderSession = async () => {
      // Only need userId to update order-session (showtimeId can be null/0 for staff orders without tickets)
      if (!userId || isUpdatingOrderSessionRef.current) {
        return
      }

      try {
        isUpdatingOrderSessionRef.current = true
        
        // Prepare concession data
        const concessionsData = Object.entries(selectedConcessions)
          .map(([comboId, quantity]) => ({ 
            comboId: parseInt(comboId), 
            quantity 
          }))
          .filter(item => item.quantity > 0)

        // Use showtimeId if available, otherwise use 0 as default for staff orders without tickets
        const finalShowtimeId = showtimeId || 0

        // Call API to update order-session
        // Backend should auto-create order-session if it doesn't exist
        await apiClient.post("/bookings/order-session/concessions", {
          showtimeId: finalShowtimeId,
          userId: userId,
          concessions: concessionsData
        })

        // Success - no need to show toast for every update
        console.log("Order-session updated successfully")
      } catch (error: any) {
        console.error("Error updating order-session:", error)
        
        // If order-session doesn't exist, it might need to be created first
        // But since user said it works without tickets, backend should handle this
        // Just log the error for debugging
        if (error?.response?.data?.errorCode === 'REDIS_KEY_NOT_FOUND' || 
            error?.response?.data?.message?.includes('not found')) {
          console.warn("Order-session not found, backend should auto-create it")
        }
        // Don't show error toast for every update, just log it
      } finally {
        isUpdatingOrderSessionRef.current = false
      }
    }

    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(() => {
      updateOrderSession()
    }, 300) // Wait 300ms after last change

    return () => clearTimeout(timeoutId)
  }, [selectedConcessions, showtimeId, userId])

  const updateConcessionQuantity = (concessionId: string, quantity: number) => {
    const concession = concessions.find(c => c.concessionId.toString() === concessionId)
    const maxQuantity = concession?.unitInStock || 0
    
    // Không cho phép chọn quá số lượng tồn kho
    if (quantity > maxQuantity) {
      toast.warning(`Chỉ còn ${maxQuantity} sản phẩm trong kho`)
      quantity = maxQuantity
    }
    
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
                    
                    {/* Hiển thị số lượng tồn kho */}
                    <div className="mb-3">
                      {item.unitInStock !== undefined && item.unitInStock !== null ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={item.unitInStock > 0 ? "default" : "destructive"}
                            className={item.unitInStock > 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                          >
                            {item.unitInStock > 0 ? `Còn ${item.unitInStock} sản phẩm` : "Hết hàng"}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                    
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
                        <Input
                          type="number"
                          min={0}
                          max={item.unitInStock || 0}
                          value={selectedConcessions[item.concessionId.toString()] || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            const maxQuantity = item.unitInStock || 0
                            if (value < 0) {
                              updateConcessionQuantity(item.concessionId.toString(), 0)
                            } else if (value > maxQuantity) {
                              toast.warning(`Chỉ còn ${maxQuantity} sản phẩm trong kho`)
                              updateConcessionQuantity(item.concessionId.toString(), maxQuantity)
                            } else {
                              updateConcessionQuantity(item.concessionId.toString(), value)
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0
                            if (value < 0 || isNaN(value)) {
                              updateConcessionQuantity(item.concessionId.toString(), 0)
                            }
                          }}
                          className="w-16 h-8 text-center font-semibold p-0"
                          disabled={!item.unitInStock || item.unitInStock === 0}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateConcessionQuantity(item.concessionId.toString(), (selectedConcessions[item.concessionId.toString()] || 0) + 1)}
                          disabled={!item.unitInStock || (selectedConcessions[item.concessionId.toString()] || 0) >= item.unitInStock}
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
