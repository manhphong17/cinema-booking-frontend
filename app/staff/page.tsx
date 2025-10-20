"use client"

import { useState } from "react"
import "@/styles/staff.css"
import { CinemaNavbar } from "@/components/staff/cinema-navbar"
import { ShoppingCart } from "@/components/staff/shopping-cart"
import { TicketSelection } from "@/components/staff/ticket-selection"
import { ConcessionsSelection } from "@/components/staff/concessions-selection"
import { ETicketScanner } from "@/components/staff/eticket-scanner"
import { RevenueDashboard } from "@/components/staff/revenue-dashboard"

interface CartItem {
  id: string
  type: "ticket" | "concession"
  name: string
  price: number
  quantity: number
  details?: string
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

  const handleCheckout = () => {
    // Handle checkout logic
    alert(
      `Thanh toán thành công! Tổng: ${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString("vi-VN")}đ`,
    )
    setCartItems([])
  }

  const renderContent = () => {
    switch (activeTab) {
      case "tickets":
        return <TicketSelection onAddToCart={addToCart} />
      case "concessions":
        return <ConcessionsSelection onAddToCart={addToCart} />
      case "eticket":
        return <ETicketScanner />
      case "revenue":
        return <RevenueDashboard />
      default:
        return <TicketSelection onAddToCart={addToCart} />
    }
  }

  return (
    <div className="staff-main-container">
      <CinemaNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          <div className="flex-1">{renderContent()}</div>

          <div className="shrink-0">
            <ShoppingCart
              items={cartItems}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
