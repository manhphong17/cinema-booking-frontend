"use client"

import { useState, useMemo } from "react"
import "@/styles/staff.css"
import { CinemaNavbar } from "@/components/staff/cinema-navbar"
import { TicketSelection } from "@/components/staff/ticket-selection"
import { ConcessionsSelection } from "@/components/staff/concessions-selection"
import { ETicketScanner } from "@/components/staff/eticket-scanner"
import { RevenueDashboard } from "@/components/staff/revenue-dashboard"
import BookingOrderSummary, { SeatInfo, ConcessionInfo } from "@/components/booking/booking-order-summary"
import { PaymentTab } from "@/components/staff/payment-tab"
import { toast } from "sonner"

interface CartItem {
  id: string
  type: "ticket" | "concession"
  name: string
  price: number
  quantity: number
  details?: string
  showtimeId?: number // Track showtimeId to sync with selectedSeats
  seatTypes?: Record<string, string> // Map seatId to seat type (vip/standard)
}

export default function CinemaManagement() {
  const [activeTab, setActiveTab] = useState("tickets")
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (item: Omit<CartItem, "id">) => {
    const existingItem = cartItems.find((cartItem) => cartItem.name === item.name && cartItem.details === item.details)

    if (existingItem) {
      updateCartQuantity(existingItem.id, existingItem.quantity + item.quantity)
    } else {
      const newItem: CartItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }
      setCartItems((prev) => [...prev, newItem])
    }
  }

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }


  const handlePaymentSuccess = async () => {
    try {
      // TODO: Gọi API tạo booking với dữ liệu từ cartItems
      // const bookingData = {
      //   seats: seats,
      //   concessions: concessions,
      //   total: total,
      //   paymentMethod: "cash" | "vnpay"
      // }
      // await apiClient.post("/bookings/create", bookingData)
      
      // Thông báo thành công với thông tin chi tiết
      toast.success("Thanh toán thành công!", {
        description: `Đã thanh toán ${total.toLocaleString("vi-VN")}đ`,
        duration: 5000,
      })
      
      // Clear cart sau khi thanh toán thành công
      setCartItems([])
      
      // Tự động chuyển về tab chọn vé để bắt đầu đơn mới
      setTimeout(() => {
        // Optional: có thể tự động chuyển tab nếu muốn
        // setActiveTab("tickets")
      }, 2000)
    } catch (error: any) {
      console.error("Payment success error:", error)
      toast.error(error?.message || "Lỗi khi xử lý thanh toán")
    }
  }

  // Convert cartItems to BookingOrderSummary format
  const seats: SeatInfo[] = useMemo(() => {
    return cartItems
      .filter(item => item.type === "ticket")
      .flatMap(item => {
        // Parse seat details from item.details (format: "HH:mm - Room - Ghế: A1, A2, ...")
        const seatsMatch = item.details?.match(/Ghế:\s*(.+)/i)
        if (!seatsMatch) return []
        
        const seatIds = seatsMatch[1].split(",").map(s => s.trim())
        const pricePerSeat = item.price / item.quantity
        
        return seatIds.map((seatId) => {
          // Determine seat type from seatId pattern (typically VIP seats have certain row/position)
          // For now, use a simple heuristic or keep as standard
          // You may need to enhance this based on your seat naming convention
          // Get seat type from item.seatTypes if available, otherwise default to standard
          const seatType = item.seatTypes?.[seatId] || "standard"
          
          return {
            id: seatId,
            type: seatType,
            price: pricePerSeat
          }
        })
      })
  }, [cartItems])

  const concessions: ConcessionInfo[] = useMemo(() => {
    return cartItems
      .filter(item => item.type === "concession")
      .map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price / item.quantity // Price per item
      }))
  }, [cartItems])

  const seatsTotal = useMemo(() => {
    // item.price is already the total price for all seats in this item
    // No need to multiply by quantity
    return cartItems
      .filter(item => item.type === "ticket")
      .reduce((sum, item) => sum + item.price, 0)
  }, [cartItems])

  const concessionsTotal = useMemo(() => {
    // For concessions, price is per item, so multiply by quantity
    return cartItems
      .filter(item => item.type === "concession")
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const total = seatsTotal + concessionsTotal

  // Sync selected concessions to cart (called from ConcessionsSelection)
  const syncConcessionsToCart = (selectedConcessions: Record<string, number>, concessions: any[]) => {
    // Remove all existing concession items
    setCartItems(prev => prev.filter(item => item.type !== "concession"))
    
    // Add new concession items
    Object.entries(selectedConcessions).forEach(([concessionId, quantity]) => {
      if (quantity > 0) {
        const concession = concessions.find(c => String(c.concessionId) === String(concessionId))
        if (concession) {
          const newItem: CartItem = {
            id: `concession-${concessionId}`,
            type: "concession",
            name: concession.name,
            price: concession.price, // Price per item
            quantity: quantity,
            details: concession.description || concession.name
          }
          setCartItems(prev => [...prev, newItem])
        }
      }
    })
  }

  // Sync selected seats to cart (called from TicketSelection)
  const syncTicketsToCart = (showtimeId: number | null, movieName: string | null, showtimeInfo: string | null, selectedSeats: string[], seatPrices: Record<string, number>, seatTypes?: Record<string, string>) => {
    if (!showtimeId || !movieName || !showtimeInfo || selectedSeats.length === 0) {
      // If no seats selected, remove the ticket item for this showtime
      setCartItems(prev => prev.filter(item => 
        !(item.type === "ticket" && item.showtimeId === showtimeId)
      ))
      return
    }

    // Calculate total price from selected seats
    const totalPrice = selectedSeats.reduce((sum, seatId) => {
      return sum + (seatPrices[seatId] || 0)
    }, 0)

    // Find existing ticket item for this showtime
    const existingItem = cartItems.find(item => 
      item.type === "ticket" && item.showtimeId === showtimeId
    )

    const ticketDetails = `${showtimeInfo} - Ghế: ${selectedSeats.join(", ")}`

    if (existingItem) {
      // Update existing item
      updateCartQuantity(existingItem.id, selectedSeats.length)
      setCartItems(prev => prev.map(item => 
        item.id === existingItem.id
          ? { 
              ...item, 
              price: totalPrice, 
              quantity: selectedSeats.length,
              details: ticketDetails,
              seatTypes: seatTypes
            }
          : item
      ))
    } else {
      // Create new item
      const newItem: CartItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: "ticket",
        name: movieName,
        price: totalPrice,
        quantity: selectedSeats.length,
        details: ticketDetails,
        showtimeId: showtimeId,
        seatTypes: seatTypes
      }
      setCartItems(prev => [...prev, newItem])
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "tickets":
        return <TicketSelection onAddToCart={addToCart} onSyncTicketsToCart={syncTicketsToCart} />
      case "concessions":
        return <ConcessionsSelection onAddToCart={addToCart} onSyncConcessionsToCart={syncConcessionsToCart} />
      case "payment":
        return (
          <PaymentTab
            seats={seats}
            seatsTotal={seatsTotal}
            concessions={concessions}
            concessionsTotal={concessionsTotal}
            total={total}
            onPaymentSuccess={handlePaymentSuccess}
            onNavigateToTickets={() => setActiveTab("tickets")}
          />
        )
      case "eticket":
        return <ETicketScanner />
      case "revenue":
        return <RevenueDashboard />
      default:
        return <TicketSelection onAddToCart={addToCart} onSyncTicketsToCart={syncTicketsToCart} />
    }
  }

  return (
    <div className="staff-main-container">
      <CinemaNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý rạp chiếu phim</h1>
          <p className="text-muted-foreground">Hệ thống quản lý bán vé và dịch vụ tại rạp</p>
        </div>
        
        <div className="flex gap-6">
          <div className="flex-1">{renderContent()}</div>

          {activeTab !== "payment" && (
            <div className="shrink-0 w-80 sticky top-8 h-fit">
              <BookingOrderSummary
                seats={seats}
                seatsTotal={seatsTotal}
                concessions={concessions}
                concessionsTotal={concessionsTotal}
                total={total}
                title="Giỏ hàng"
                showSeatTypeStats={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
