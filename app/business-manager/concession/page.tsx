"use client"

import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Plus, Search, Edit, Trash2, Package, Power, ChevronLeft, ChevronRight } from "lucide-react"

type ProductType = "ALL" | "DRINK" | "SNACK" | "COMBO"
type StockStatus = "ALL" | "IN_STOCK" | "SOLD_OUT"
type TimeFilter = "week" | "month"

interface Product {
    id: string
    name: string
    price: number
    description: string
    quantity: number
    type: ProductType
    image: string
    isActive: boolean
}

const mockProducts: Product[] = [
    {
        id: "P001",
        name: "Bắp Rang Bơ Lớn",
        price: 80000,
        description: "Bắp rang bơ thơm ngon, size lớn",
        quantity: 150,
        type: "SNACK",
        image: "/bowl-of-popcorn.png",
        isActive: true,
    },
    {
        id: "P002",
        name: "Coca Cola",
        price: 35000,
        description: "Nước ngọt Coca Cola 500ml",
        quantity: 200,
        type: "DRINK",
        image: "/classic-coca-cola.png",
        isActive: true,
    },
    {
        id: "P003",
        name: "Combo Couple",
        price: 150000,
        description: "2 bắp lớn + 2 nước ngọt",
        quantity: 80,
        type: "COMBO",
        image: "/combo-food.jpg",
        isActive: true,
    },
    {
        id: "P004",
        name: "Pepsi",
        price: 35000,
        description: "Nước ngọt Pepsi 500ml",
        quantity: 0,
        type: "DRINK",
        image: "/refreshing-pepsi.png",
        isActive: false,
    },
    {
        id: "P005",
        name: "Nachos Phô Mai",
        price: 65000,
        description: "Nachos giòn với sốt phô mai",
        quantity: 120,
        type: "SNACK",
        image: "/plate-of-loaded-nachos.png",
        isActive: true,
    },
    {
        id: "P006",
        name: "Combo Family",
        price: 250000,
        description: "3 bắp lớn + 4 nước ngọt",
        quantity: 50,
        type: "COMBO",
        image: "/family-combo.jpg",
        isActive: true,
    },
]

const bestSellerData = {
    week: [
        { name: "Bắp Rang Bơ Lớn", value: 450, color: "#2563eb" },
        { name: "Combo Couple", value: 320, color: "#3b82f6" },
        { name: "Coca Cola", value: 280, color: "#60a5fa" },
    ],
    month: [
        { name: "Combo Couple", value: 1850, color: "#2563eb" },
        { name: "Bắp Rang Bơ Lớn", value: 1620, color: "#3b82f6" },
        { name: "Combo Family", value: 980, color: "#60a5fa" },
    ],
}

export default function ConcessionPage() {
    const [products, setProducts] = useState<Product[]>(mockProducts)
    const [typeFilter, setTypeFilter] = useState<ProductType>("ALL")
    const [stockFilter, setStockFilter] = useState<StockStatus>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("week")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        quantity: "",
        description: "",
        type: "DRINK" as ProductType,
        image: "",
    })

    const bestSellers = bestSellerData[timeFilter]
    const topProduct = bestSellers[0]

    const filteredProducts = products.filter((product) => {
        const matchesType = typeFilter === "ALL" || product.type === typeFilter
        const matchesStock =
            stockFilter === "ALL" ||
            (stockFilter === "IN_STOCK" && product.quantity > 0) ||
            (stockFilter === "SOLD_OUT" && product.quantity === 0)
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesStock && matchesSearch
    })

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

    const handleAddProduct = () => {
        const product: Product = {
            id: `P${String(products.length + 1).padStart(3, "0")}`,
            name: newProduct.name,
            price: Number(newProduct.price),
            description: newProduct.description,
            quantity: Number(newProduct.quantity),
            type: newProduct.type,
            image: newProduct.image || "/diverse-products-still-life.png",
            isActive: true,
        }
        setProducts([...products, product])
        setIsAddDialogOpen(false)
        setNewProduct({
            name: "",
            price: "",
            quantity: "",
            description: "",
            type: "DRINK",
            image: "",
        })
    }

    const handleEditProduct = () => {
        if (!selectedProduct) return
        setProducts(products.map((p) => (p.id === selectedProduct.id ? selectedProduct : p)))
        setIsEditDialogOpen(false)
        setSelectedProduct(null)
    }

    const handleDeleteProduct = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            setProducts(products.filter((p) => p.id !== id))
        }
    }

    const handleToggleActive = (id: string) => {
        setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)))
    }

    const handleAddStock = (id: string) => {
        const amount = prompt("Nhập số lượng cần thêm:")
        if (amount && !isNaN(Number(amount))) {
            setProducts(products.map((p) => (p.id === id ? { ...p, quantity: p.quantity + Number(amount) } : p)))
        }
    }

    return (
        <BusinessManagerLayout activeSection="concession">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Bắp Nước</h1>
                    <p className="text-gray-600 mt-2">Quản lý sản phẩm concession và theo dõi hiệu suất bán hàng</p>
                </div>

                {/* Best Seller Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Product Highlight */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Sản phẩm bán chạy nhất</CardTitle>
                            <CardDescription className="text-gray-700">
                                Top 1 trong {timeFilter === "week" ? "tuần" : "tháng"} này
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                                    <Package className="w-10 h-10 text-blue-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900">{topProduct.name}</h3>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{topProduct.value} đơn</p>
                                    <p className="text-sm text-gray-600 mt-1">Số lượng đã bán</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card className="bg-white border-blue-100 shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-gray-900">Top 3 Sản phẩm</CardTitle>
                                    <CardDescription className="text-gray-600">Phân bổ doanh số theo sản phẩm</CardDescription>
                                </div>
                                <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                                    <SelectTrigger className="w-32 border-blue-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="week">Tuần</SelectItem>
                                        <SelectItem value="month">Tháng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={bestSellers}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {bestSellers.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar */}
                <Card className="bg-white border-blue-100 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Select value={typeFilter} onValueChange={(value: ProductType) => setTypeFilter(value)}>
                                <SelectTrigger className="w-full md:w-48 border-blue-200">
                                    <SelectValue placeholder="Loại sản phẩm" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="DRINK">Drink</SelectItem>
                                    <SelectItem value="SNACK">Snack</SelectItem>
                                    <SelectItem value="COMBO">Combo</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={stockFilter} onValueChange={(value: StockStatus) => setStockFilter(value)}>
                                <SelectTrigger className="w-full md:w-48 border-blue-200">
                                    <SelectValue placeholder="Tình trạng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                                    <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 border-blue-200"
                                />
                            </div>

                            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4" />
                                Thêm
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Danh sách sản phẩm</CardTitle>
                        <CardDescription className="text-gray-600">Quản lý tất cả sản phẩm concession</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Ảnh</TableHead>
                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead>Giá bán</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead>Số lượng</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono font-medium text-gray-900">{product.id}</TableCell>
                                        <TableCell>
                                            <img
                                                src={product.image || "/placeholder.svg"}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                                        <TableCell className="text-gray-900">{product.price.toLocaleString()}đ</TableCell>
                                        <TableCell className="text-gray-600 max-w-xs truncate">{product.description}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={product.quantity > 0 ? "default" : "destructive"}
                                                className={product.quantity > 0 ? "bg-blue-600" : ""}
                                            >
                                                {product.quantity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.isActive ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đang bán</Badge>
                                            ) : (
                                                <Badge variant="secondary">Tạm ngưng</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedProduct(product)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleAddStock(product.id)}
                                                >
                                                    <Package className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={
                                                        product.isActive
                                                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    }
                                                    onClick={() => handleToggleActive(product.id)}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-600">
                                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProducts.length)} trong tổng số{" "}
                                {filteredProducts.length} sản phẩm
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="border-blue-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Trước
                                </Button>
                                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="border-blue-200"
                                >
                                    Sau
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Product Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
                            <DialogDescription>Nhập thông tin sản phẩm concession mới</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên sản phẩm</Label>
                                <Input
                                    id="name"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="Nhập tên sản phẩm"
                                    className="border-blue-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Giá bán (VNĐ)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        placeholder="0"
                                        className="border-blue-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Số lượng</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={newProduct.quantity}
                                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                        placeholder="0"
                                        className="border-blue-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Nhập mô tả sản phẩm"
                                    className="border-blue-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Loại sản phẩm</Label>
                                <Select
                                    value={newProduct.type}
                                    onValueChange={(value: ProductType) => setNewProduct({ ...newProduct, type: value })}
                                >
                                    <SelectTrigger className="border-blue-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRINK">DRINK</SelectItem>
                                        <SelectItem value="SNACK">SNACK</SelectItem>
                                        <SelectItem value="COMBO">COMBO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">URL Ảnh</Label>
                                <Input
                                    id="image"
                                    value={newProduct.image}
                                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                    placeholder="Nhập URL ảnh hoặc để trống"
                                    className="border-blue-200"
                                />
                                {newProduct.image && (
                                    <div className="mt-2">
                                        <img
                                            src={newProduct.image || "/placeholder.svg"}
                                            alt="Preview"
                                            className="w-24 h-24 rounded-lg object-cover border border-blue-200 shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-blue-200">
                                Hủy
                            </Button>
                            <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                                Thêm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Product Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
                            <DialogDescription>Cập nhật thông tin sản phẩm</DialogDescription>
                        </DialogHeader>
                        {selectedProduct && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Tên sản phẩm</Label>
                                    <Input
                                        id="edit-name"
                                        value={selectedProduct.name}
                                        onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                                        className="border-blue-200"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-price">Giá bán (VNĐ)</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            value={selectedProduct.price}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                                            className="border-blue-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-quantity">Số lượng</Label>
                                        <Input
                                            id="edit-quantity"
                                            type="number"
                                            value={selectedProduct.quantity}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, quantity: Number(e.target.value) })}
                                            className="border-blue-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Mô tả</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={selectedProduct.description}
                                        onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                                        className="border-blue-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Loại sản phẩm</Label>
                                    <Select
                                        value={selectedProduct.type}
                                        onValueChange={(value: ProductType) => setSelectedProduct({ ...selectedProduct, type: value })}
                                    >
                                        <SelectTrigger className="border-blue-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRINK">DRINK</SelectItem>
                                            <SelectItem value="SNACK">SNACK</SelectItem>
                                            <SelectItem value="COMBO">COMBO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-image">URL Ảnh</Label>
                                    <Input
                                        id="edit-image"
                                        value={selectedProduct.image}
                                        onChange={(e) => setSelectedProduct({ ...selectedProduct, image: e.target.value })}
                                        className="border-blue-200"
                                    />
                                    {selectedProduct.image && (
                                        <div className="mt-2">
                                            <img
                                                src={selectedProduct.image || "/placeholder.svg"}
                                                alt="Preview"
                                                className="w-24 h-24 rounded-lg object-cover border border-blue-200 shadow-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-blue-200">
                                Hủy
                            </Button>
                            <Button onClick={handleEditProduct} className="bg-blue-600 hover:bg-blue-700">
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </BusinessManagerLayout>
    )
}
