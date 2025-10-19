"use client"


import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import {useEffect, useState} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip  } from "recharts"
import {Plus, Search, Edit, Trash2, Package, Power, ChevronLeft, ChevronRight, XCircle, PlayCircle} from "lucide-react"
import axios from "axios";
import {toast} from "sonner";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

type ProductType = "ALL" | "DRINK" | "SNACK" | "COMBO"
type StockStatus = "ALL" | "IN_STOCK" | "SOLD_OUT"
type ProductStatus = "ALL" | "ACTIVE" | "INACTIVE"
type TimeFilter = "week" | "month"

interface Product {
    id: number
    name: string
    price: number
    description: string
    image: string
    quantity: number
    type: ProductType  // Thêm dòng này để fix lỗi type
    stockStatus: "IN_STOCK" | "SOLD_OUT"
    concessionStatus: "ACTIVE" | "INACTIVE" | "DELETED"
}

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

//  Custom Tooltip cho biểu đồ, dùng Tooltip của shadcn
const CustomChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0];
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="p-2 bg-white rounded-lg shadow-sm border text-sm text-gray-800">
                        <strong>{item.name}</strong>: {item.value} đơn
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-600 text-white text-sm rounded-md px-3 py-1">
                    {`${item.name}: ${item.value} đơn`}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


export default function ConcessionPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [typeFilter, setTypeFilter] = useState<ProductType>("ALL")
    const [stockFilter, setStockFilter] = useState<StockStatus>("ALL")
    const [statusFilter, setStatusFilter] = useState<ProductStatus>("ALL")
    const itemsPerPage = 10
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        const delayDebounce = setTimeout(() => { // Đặt timeout 500ms để debounce (tránh spam API khi user gõ nhanh)
            fetchConcessions(currentPage - 1, itemsPerPage, {
                stockStatus: stockFilter !== "ALL" ? stockFilter : undefined,
                concessionType: typeFilter !== "ALL" ? typeFilter : undefined,
                concessionStatus: statusFilter !== "ALL" ? statusFilter : undefined,
                keyword: searchKeyword.trim() || undefined,
            });
        }, 500); // 500ms = 0.5 giây delay sau khi user ngừng gõ
        return () => clearTimeout(delayDebounce);
    }, [currentPage, typeFilter, stockFilter, statusFilter,searchKeyword]);

    const [searchQuery, setSearchQuery] = useState("")
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("week")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [newProduct, setNewProduct] = useState<{
        name: string
        price: string
        quantity: string
        description: string
        type: ProductType
        image: File | string
    }>({
        name: "",
        price: "",
        quantity: "",
        description: "",
        type: "DRINK",
        image: "",
    })

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
    const bestSellers = bestSellerData[timeFilter] ?? []
    const topProduct = bestSellers[0]

    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [stockAmount, setStockAmount] = useState("")
    const openAddStockDialog = (id: number) => {
        setSelectedProductId(id)
        setIsAddStockDialogOpen(true)
    }

    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [toggleProduct, setToggleProduct] = useState<Product | null>(null)
    const openToggleDialog = (product: Product) => {
        setToggleProduct(product)
        setIsToggleDialogOpen(true)
    }

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const openDeleteDialog = (id: number) => {
        setSelectedProductId(id);
        setIsDeleteDialogOpen(true);
    };
    const closeDeleteDialog = () => {
        setSelectedProductId(null);
        setIsDeleteDialogOpen(false);
    };


//  Hàm xử lý ảnh (local / base64 / URL)
    const processImage = async (imageInput: string | File): Promise<File | null> => {
        let file: File | null = null;

        try {
            if (imageInput instanceof File) {
                //  Ảnh chọn từ máy
                file = imageInput;
            }
            else if (typeof imageInput === "string") {
                if (imageInput.startsWith("data:image")) {
                    //  Ảnh kéo từ Internet (base64)
                    const [meta, data] = imageInput.split(",");
                    const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
                    const bin = atob(data);
                    const arr = Uint8Array.from(bin, (c) => c.charCodeAt(0));
                    file = new File([arr], "image-base64.jpg", { type: mime });
                }
                else if (imageInput.startsWith("http")) {
                    //  Ảnh nhập từ URL
                    const res = await fetch(imageInput);
                    if (!res.ok) {
                        toast.error("Không thể tải ảnh: liên kết không hợp lệ hoặc bị chặn.");
                        return null;
                    }

                    const blob = await res.blob();
                    if (!blob.type.startsWith("image/")) {
                        toast.error("Đường dẫn ảnh không hợp lệ hoặc không phải là file ảnh!");
                        return null;
                    }

                    const fileName = imageInput.split("/").pop() || "image-url.jpg";
                    file = new File([blob], fileName, { type: blob.type });
                }
            }

            return file;
        } catch (error) {
            console.error("Lỗi khi xử lý ảnh:", error);
            // toast.error("Không thể tải ảnh, vui lòng thử lại hoặc chọn ảnh khác!");
            return null;
        }
    };


    const handleAddProduct = async () => {
        try {
            //  Validate trước khi gửi
            if (!newProduct.name.trim()) return toast.error("Tên sản phẩm không được để trống!");
            if (+newProduct.price <= 0) return toast.error("Giá bán phải lớn hơn 0!");
            if (+newProduct.quantity <= 0) return toast.error("Số lượng phải lớn hơn 0!");
            if (!newProduct.image) return toast.error("Vui lòng chọn hoặc nhập ảnh!");

            const formData = new FormData();
            formData.append("name", newProduct.name);
            formData.append("price", newProduct.price);
            formData.append("description", newProduct.description);
            formData.append("concessionType", newProduct.type);
            formData.append("unitInStock", newProduct.quantity);

            //  Gọi hàm xử lý ảnh
            const file = await processImage(newProduct.image);
            if (!file) return; // nếu lỗi thì dừng

            formData.append("file", file);

            // Gửi request
            const res = await axios.post(`${BACKEND_BASE_URL}/concession`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Thêm sản phẩm thành công!");
            console.log("✅ Thêm sản phẩm:", res.data);

            //  Làm mới list + reset form
            await fetchConcessions(currentPage - 1, itemsPerPage);
            setNewProduct({
                name: "",
                price: "",
                quantity: "",
                description: "",
                type: "DRINK",
                image: "",
            });

            setIsAddDialogOpen(false);

        } catch (error: any) {
            console.error(" Lỗi khi thêm sản phẩm:", error);
            toast.error(error.response?.data?.message || "Không thể thêm sản phẩm. Vui lòng thử lại!");
        }
    };

    const fetchConcessions = async (
        page = 0,
        size = 10,
        filters?: { stockStatus?: string; concessionType?: string; concessionStatus?: string ; keyword?: string}
    ) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                ...(filters?.stockStatus && { stockStatus: filters.stockStatus }),
                ...(filters?.concessionType && { concessionType: filters.concessionType }),
                ...(filters?.concessionStatus && { concessionStatus: filters.concessionStatus }),
                ...(filters?.keyword && { keyword: filters.keyword }),
            });

            const res = await axios.get(`${BACKEND_BASE_URL}/concession?${params}`);

            if (res.data.status !== 200) {
                toast.error(res.data.message || "Không thể tải danh sách sản phẩm.");
                setProducts([]);
                return;
            }

            const pageData = res.data.data; // <-- Page object từ BE

            const formatted = pageData.content.map((item: any) => ({
                id: item.concessionId,
                name: item.name,
                price: item.price,
                description: item.description || "",
                quantity: item.unitInStock,
                type: item.concessionType,
                stockStatus: item.stockStatus,
                concessionStatus: item.concessionStatus,
                image: item.urlImage?.startsWith("http")
                    ? item.urlImage
                    : `${BACKEND_BASE_URL}${item.urlImage}`,
            }));

            setProducts(formatted);
            setTotalPages(pageData.totalPages);
            setTotalItems(pageData.totalElements);

            console.log("Concessions loaded:", formatted);
        } catch (error: any) {
            console.error("Lỗi khi gọi API concession:", error);
            toast.error("Không thể tải danh sách sản phẩm từ server.");
        }
    };


    const handleEditProduct = async () => {
        if (!selectedProduct) return toast.error("Không có sản phẩm nào được chọn!");

        try {
            //  Validate nhanh
            if (!selectedProduct.name.trim()) return toast.error("Tên sản phẩm không được để trống!");
            if (selectedProduct.quantity < 0) return toast.error("Số lượng không hợp lệ!");

            //  Chuẩn bị formData (vì có thể có ảnh)
            const formData = new FormData();
            formData.append("name", selectedProduct.name);
            formData.append("price", selectedProduct.price.toString());
            formData.append("description", selectedProduct.description || "");
            formData.append("concessionType", selectedProduct.type);
            formData.append("unitInStock", selectedProduct.quantity.toString());

            //  Gọi hàm xử lý ảnh
            const file = await processImage(selectedProduct.image);
            if (file) formData.append("file", file);

            //  Gửi request API
            const res = await axios.put(
                `${BACKEND_BASE_URL}/concession/${selectedProduct.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            //  Thành công
            toast.success("Cập nhật sản phẩm thành công!");
            console.log("Đã cập nhật:", res.data);

            //  Refresh lại danh sách sản phẩm
            await fetchConcessions(currentPage - 1, itemsPerPage);

            //  Đóng dialog & clear selection
            setIsEditDialogOpen(false);
            setSelectedProduct(null);

        } catch (error: any) {
            console.error("Lỗi khi cập nhật sản phẩm:", error);
            toast.error(error.response?.data?.message || "Không thể cập nhật sản phẩm. Vui lòng thử lại!");
        }
    };


    const handleAddStock = async () => {
        if (!selectedProductId) return toast.error("Không có sản phẩm nào được chọn!")

        const amount = Number(stockAmount)
        if (isNaN(amount) || amount < 1 || amount > 999) {
            return toast.error("Số lượng phải là số nguyên từ 1 đến 999!");
        }
        try {
            const res = await axios.put(
                `${BACKEND_BASE_URL}/concession/${selectedProductId}/stock`,
                null,
                { params: { quantityToAdd: amount } }
            )

            toast.success("Cập nhật số lượng thành công!")

            // Reload danh sách (gọi lại fetchConcessions)
            await fetchConcessions(currentPage - 1, itemsPerPage)
            setIsAddStockDialogOpen(false)
            setStockAmount("")
        } catch (error: any) {
            console.error(" Lỗi khi thêm hàng:", error)
            toast.error(error.response?.data?.message || "Không thể thêm số lượng hàng!")
        }
    }

    const handleDeleteProduct = async (id: number) => {
        try {
            //  Gọi API xóa
            const res = await axios.delete(`${BACKEND_BASE_URL}/concession/${id}`);

            if (res.data.status !== 200) {
                toast.error(res.data.message || "Không thể xóa sản phẩm!");
                return;
            }

            toast.success("Xóa sản phẩm thành công!");

            //  Xóa khỏi danh sách hiện tại
            setProducts(products.filter((p) => p.id !== id));

            //  Hoặc: gọi lại API để đồng bộ danh sách (nếu phân trang)
            // await fetchConcessions(currentPage - 1, itemsPerPage);
        } catch (error: any) {
            console.error(" Lỗi khi xóa sản phẩm:", error);
            toast.error(error.response?.data?.message || "Không thể xóa sản phẩm!");
        }
    };


    const handleToggleStatus = async () => {
        if (!toggleProduct) return toast.error("Không có sản phẩm nào được chọn!")

        const newStatus = toggleProduct.concessionStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"

        try {
            const res = await axios.put(
                `${BACKEND_BASE_URL}/concession/${toggleProduct.id}/status`,
                null,
                { params: { status: newStatus } }
            )

            toast.success(
                newStatus === "ACTIVE" ? "Đã mở bán lại sản phẩm!" : "Đã ngừng kinh doanh sản phẩm!"
            )

            await fetchConcessions(currentPage - 1, itemsPerPage)
            setIsToggleDialogOpen(false)
        } catch (error: any) {
            console.error(" Lỗi khi thay đổi trạng thái:", error)
            toast.error(error.response?.data?.message || "Không thể thay đổi trạng thái sản phẩm!")
        }
    }




    // @ts-ignore
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
                                        <RechartsTooltip content={<CustomChartTooltip />} />

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
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="IN_STOCK">Còn hàng</SelectItem>
                                    <SelectItem value="SOLD_OUT">Hết hàng</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE" | "DELETED")}>
                                <SelectTrigger className="w-full md:w-48 border-blue-200">
                                    <SelectValue placeholder="Trạng thái hoạt động" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="ACTIVE">Đang kinh doanh</SelectItem>
                                    <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
                                </SelectContent>
                            </Select>


                            <div className="relative w-full max-w-md">
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            fetchConcessions(currentPage - 1, itemsPerPage, {
                                                stockStatus: stockFilter !== "ALL" ? stockFilter : undefined,
                                                concessionType: typeFilter !== "ALL" ? typeFilter : undefined,
                                                concessionStatus: statusFilter !== "ALL" ? statusFilter : undefined,
                                                keyword: searchKeyword.trim() || undefined,
                                            })
                                        }
                                    }}
                                    className="pl-8 border-blue-200"
                                />
                                <Search
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-blue-600"
                                    size={18}
                                    onClick={() =>
                                        fetchConcessions(currentPage - 1, itemsPerPage, {
                                            stockStatus: stockFilter !== "ALL" ? stockFilter : undefined,
                                            concessionType: typeFilter !== "ALL" ? typeFilter : undefined,
                                            concessionStatus: statusFilter !== "ALL" ? statusFilter : undefined,
                                            keyword: searchKeyword.trim() || undefined,
                                        })
                                    }
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

                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead>Loại sản phẩm</TableHead>
                                    <TableHead>Giá bán</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead>Ảnh</TableHead>
                                    <TableHead>Số lượng</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className={
                                            product.concessionStatus === "INACTIVE"
                                                ? "bg-gray-100 border-l-4 border-gray-400"
                                                : ""
                                        }
                                    >
                                        <TableCell className="font-mono font-medium text-gray-900">{product.id}</TableCell>
                                        <TableCell className="font-medium text-gray-900">
                                            {product.name}
                                            {/* Thêm Badge rõ ràng cho INACTIVE */}
                                            {product.concessionStatus === "INACTIVE" && (
                                                <Badge variant="destructive" className="ml-2 text-xs">
                                                    Ngưng bán
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {product.type === "DRINK" && "Đồ uống"}
                                            {product.type === "SNACK" && "Snack"}
                                            {product.type === "COMBO" && "Combo"}
                                        </TableCell>
                                        <TableCell className="text-gray-900">{product.price.toLocaleString()}đ</TableCell>
                                        <TableCell className="text-gray-600 max-w-xs truncate">{product.description}</TableCell>

                                        <TableCell>
                                            <img
                                                src={product.image || "/placeholder.svg"}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                            />
                                        </TableCell>

                                        {/* Số lượng tồn kho */}
                                        <TableCell>
                                            {product.quantity}
                                        </TableCell>

                                        {/* Trạng thái hàng*/}
                                        <TableCell>
                                            {product.stockStatus === "IN_STOCK" ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    Còn hàng
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Hết hàng</Badge>
                                            ) }
                                        </TableCell>

                                        {/* Thao tác */}

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <TooltipProvider>
                                                    {/* Nút Chỉnh sửa */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    setSelectedProduct(product)
                                                                    setIsEditDialogOpen(true)
                                                                }}
                                                                disabled={product.concessionStatus === "INACTIVE"}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Chỉnh sửa</TooltipContent>
                                                    </Tooltip>

                                                    {/* Nút Xóa */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() =>  openDeleteDialog(product.id)}
                                                                disabled={product.concessionStatus === "INACTIVE"}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Xóa</TooltipContent>
                                                    </Tooltip>

                                                    {/* Nút Thêm hàng */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => openAddStockDialog(product.id)}
                                                                disabled={product.concessionStatus === "INACTIVE"}
                                                            >
                                                                <Package className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">Thêm hàng</TooltipContent>
                                                    </Tooltip>

                                                    {/* Nút Bật/Tắt kinh doanh */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={
                                                                    product.concessionStatus === "ACTIVE"
                                                                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                }
                                                                onClick={() => openToggleDialog(product)}
                                                            >
                                                                {product.concessionStatus === "ACTIVE" ? (
                                                                    <XCircle className="w-4 h-4" /> // ngừng bán
                                                                ) : (
                                                                    <PlayCircle className="w-4 h-4" /> // bật lại
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            {product.concessionStatus === "ACTIVE" ? "Ngừng kinh doanh" : "Mở bán lại"}
                                                        </TooltipContent>
                                                    </Tooltip>

                                                </TooltipProvider>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>

                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-600">
                                Trang {currentPage} / {totalPages} — Tổng: {totalItems} sản phẩm
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
                                <Label htmlFor="image">Ảnh sản phẩm</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setNewProduct({ ...newProduct, image: file });
                                        }
                                    }}
                                    className="border-blue-200"
                                />

                                <Input
                                    type="text"
                                    placeholder="Hoặc dán URL ảnh từ Internet"
                                    onBlur={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                    className="border-blue-200"
                                />

                                {newProduct.image && (
                                    <div className="mt-2">
                                        <img
                                            src={
                                                newProduct.image instanceof File
                                                    ? URL.createObjectURL(newProduct.image)
                                                    : newProduct.image
                                            }
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
                                    <Label htmlFor="image">Ảnh sản phẩm</Label>

                                    {/* upload file mới */}
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedProduct({ ...selectedProduct, image: file });
                                            }
                                        }}
                                        className="border-blue-200"
                                    />

                                    {/* dán URL ảnh */}
                                    <Input
                                        type="text"
                                        placeholder="Hoặc dán URL ảnh từ Internet"
                                        value={
                                            selectedProduct.image instanceof File
                                                ? ""
                                                : selectedProduct.image || ""
                                        }
                                        onChange={(e) =>
                                            setSelectedProduct({ ...selectedProduct, image: e.target.value })
                                        }
                                        className="border-blue-200"
                                    />

                                    {/* hiển thị preview ảnh */}
                                    {selectedProduct.image && (
                                        <div className="mt-2">
                                            <img
                                                src={
                                                    selectedProduct.image instanceof File
                                                        ? URL.createObjectURL(selectedProduct.image)
                                                        : selectedProduct.image
                                                }
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

                {/* Add Stock Dialog */}
                <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Thêm số lượng hàng</DialogTitle>
                            <DialogDescription>Nhập số lượng hàng bạn muốn thêm vào kho</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 mt-4">
                            <Label htmlFor="add-stock">Số lượng cần thêm</Label>
                            <Input
                                id="add-stock"
                                type="number"
                                min="1"
                                placeholder="Nhập số lượng..."
                                value={stockAmount}
                                onChange={(e) => setStockAmount(e.target.value)}
                                className="border-blue-200"
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddStockDialogOpen(false)} className="border-blue-200">
                                Hủy
                            </Button>
                            <Button onClick={handleAddStock} className="bg-blue-600 hover:bg-blue-700">
                                Xác nhận
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Concession Status Dialog */}
                <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
                    <DialogContent className="dialog-content sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {toggleProduct?.concessionStatus === "ACTIVE"
                                    ? "Ngừng kinh doanh sản phẩm"
                                    : "Bật lại kinh doanh sản phẩm"}
                            </DialogTitle>
                            <DialogDescription>
                                {toggleProduct?.concessionStatus === "ACTIVE"
                                    ? "Bạn có chắc muốn ngừng kinh doanh sản phẩm này không?"
                                    : "Bạn có chắc muốn bật lại kinh doanh sản phẩm này không?"}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsToggleDialogOpen(false)} className="border-blue-200">
                                Hủy
                            </Button>
                            <Button
                                onClick={handleToggleStatus}
                                className={`${
                                    toggleProduct?.concessionStatus === "ACTIVE"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                Xác nhận
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Concession Delete Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xoá sản phẩm</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách không?
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={closeDeleteDialog}>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => {
                                    if (selectedProductId) handleDeleteProduct(selectedProductId);
                                    closeDeleteDialog();
                                }}
                            >
                                Xác nhận
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>


            </div>


        </BusinessManagerLayout>
    )
}