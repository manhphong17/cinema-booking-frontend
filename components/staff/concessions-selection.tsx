"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Minus, ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string
  description: string
  available: boolean
}

interface ConcessionsSelectionProps {
  onAddToCart: (item: {
    type: "ticket" | "concession"
    name: string
    price: number
    quantity: number
    details?: string
  }) => void
}

const products: Product[] = [
  {
    id: "1",
    name: "Bắp rang bơ lớn",
    price: 85000,
    category: "Bắp rang",
    image: "/images/concessions/large-popcorn.jpg",
    description: "Bắp rang bơ thơm ngon, size lớn",
    available: true,
  },
  {
    id: "2",
    name: "Bắp rang bơ vừa",
    price: 65000,
    category: "Bắp rang",
    image: "/images/concessions/medium-popcorn.jpg",
    description: "Bắp rang bơ thơm ngon, size vừa",
    available: true,
  },
  {
    id: "3",
    name: "Bắp rang bơ nhỏ",
    price: 45000,
    category: "Bắp rang",
    image: "/images/concessions/small-popcorn.jpg",
    description: "Bắp rang bơ thơm ngon, size nhỏ",
    available: true,
  },
  {
    id: "4",
    name: "Coca Cola lớn",
    price: 55000,
    category: "Nước uống",
    image: "/images/concessions/large-coke.jpg",
    description: "Coca Cola size lớn, 700ml",
    available: true,
  },
  {
    id: "5",
    name: "Coca Cola vừa",
    price: 45000,
    category: "Nước uống",
    image: "/images/concessions/medium-coke.jpg",
    description: "Coca Cola size vừa, 500ml",
    available: true,
  },
  {
    id: "6",
    name: "Pepsi lớn",
    price: 55000,
    category: "Nước uống",
    image: "/images/concessions/large-pepsi.jpg",
    description: "Pepsi size lớn, 700ml",
    available: true,
  },
  {
    id: "7",
    name: "Nước suối",
    price: 25000,
    category: "Nước uống",
    image: "/images/concessions/water-bottle.jpg",
    description: "Nước suối tinh khiết 500ml",
    available: true,
  },
  {
    id: "8",
    name: "Combo Couple",
    price: 180000,
    category: "Combo",
    image: "/images/concessions/couple-combo.jpg",
    description: "2 bắp lớn + 2 nước ngọt lớn",
    available: true,
  },
  {
    id: "9",
    name: "Combo Family",
    price: 320000,
    category: "Combo",
    image: "/images/concessions/family-combo.jpg",
    description: "4 bắp vừa + 4 nước ngọt + kẹo",
    available: true,
  },
  {
    id: "10",
    name: "Kẹo gấu Haribo",
    price: 35000,
    category: "Snack",
    image: "/images/concessions/gummy-bears.jpg",
    description: "Kẹo dẻo hình gấu nhiều vị",
    available: true,
  },
  {
    id: "11",
    name: "Chocolate M&M's",
    price: 40000,
    category: "Snack",
    image: "/images/concessions/mms-chocolate.jpg",
    description: "Chocolate M&M's nhiều màu sắc",
    available: true,
  },
  {
    id: "12",
    name: "Nachos phô mai",
    price: 75000,
    category: "Snack",
    image: "/images/concessions/cheese-nachos.jpg",
    description: "Bánh tortilla giòn với sốt phô mai",
    available: false,
  },
]

const categories = ["Tất cả", "Bắp rang", "Nước uống", "Combo", "Snack"]

export function ConcessionsSelection({ onAddToCart }: ConcessionsSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const filteredProducts = products.filter(
    (product) => selectedCategory === "Tất cả" || product.category === selectedCategory,
  )

  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }))
  }

  const addToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1
    onAddToCart({
      type: "concession",
      name: product.name,
      price: product.price,
      quantity,
      details: product.description,
    })
    // Reset quantity after adding to cart
    setQuantities((prev) => ({ ...prev, [product.id]: 0 }))
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Chọn bắp nước & combo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className={`${!product.available ? "opacity-50" : ""}`}>
            <CardContent className="p-4">
              <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                  <p className="text-lg font-bold text-primary">{product.price.toLocaleString("vi-VN")}đ</p>
                </div>

                {product.available ? (
                  <div className="space-y-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 0) - 1)}
                        disabled={!quantities[product.id]}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <Input
                        type="number"
                        min="0"
                        value={quantities[product.id] || 0}
                        onChange={(e) => updateQuantity(product.id, Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(product.id, (quantities[product.id] || 0) + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={!quantities[product.id]}
                      className="w-full"
                      size="sm"
                    >
                      Thêm vào giỏ
                      {quantities[product.id] > 0 && (
                        <span className="ml-2">
                          ({(product.price * quantities[product.id]).toLocaleString("vi-VN")}đ)
                        </span>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Badge variant="destructive" className="text-xs">
                      Hết hàng
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Không có sản phẩm nào trong danh mục này</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
