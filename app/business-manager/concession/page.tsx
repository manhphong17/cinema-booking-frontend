"use client"

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
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
import {toast} from "sonner";
import apiClient from "../../../src/api/interceptor";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// ===============================
// 2️⃣ TYPE DEFINITIONS
// ===============================
type StockStatus = "ALL" | "IN_STOCK" | "SOLD_OUT"
type ProductStatus = "ALL" | "ACTIVE" | "INACTIVE"
type TimeFilter = "week" | "month"

interface ConcessionType {
    id: number
    name: string
    status: string
}
interface Product {
    id: number
    name: string
    price: number
    description: string
    image: string | File
    quantity: number
    concessionTypeId: number
    stockStatus: "IN_STOCK" | "SOLD_OUT"
    concessionStatus: "ACTIVE" | "INACTIVE" | "DELETED"
}

// ===============================
// 3️⃣ MOCK DATA & CUSTOM TOOLTIP
// ===============================
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

// ===============================
// 4️⃣ COMPONENT CHÍNH
// ===============================

export default function ConcessionPage() {
    // =======================================
    // 🟢 STATE CHÍNH & FILTER
    // =======================================
    const [products, setProducts] = useState<Product[]>([])
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [concessionTypeFilter, setConcessionTypeFilter] = useState<string>("ALL");
    const [concessionTypes, setConcessionTypes] = useState<ConcessionType[]>([]);

    // Bộ lọc & tìm kiếm
    const [stockFilter, setStockFilter] = useState<StockStatus>("ALL")
    const [statusFilter, setStatusFilter] = useState<ProductStatus>("ALL")
    const [searchKeyword, setSearchKeyword] = useState("")
        // Bộ lọc thống kê
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("week")

    // =======================================
    // 🟢 DIALOG STATE (popup)
    // =======================================
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false)
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
    const [isDeleteTypeDialogOpen, setIsDeleteTypeDialogOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);


    // =======================================
    // 🟢 PRODUCT SELECTION / FORM DATA
    // =======================================
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [toggleProduct, setToggleProduct] = useState<Product | null>(null)
    const [stockAmount, setStockAmount] = useState("")
    // Form thêm mới
    const [newProduct, setNewProduct] = useState<{
        name: string;
        price: string;
        quantity: string;
        description: string;
        concessionTypeId: number | null; // ✅ chỉ lưu id
        image: File | string;
    }>({
        name: "",
        price: "",
        quantity: "",
        description: "",
        concessionTypeId: null,
        image: "",
    });

    // =======================================
    // 🟢 BIỂU ĐỒ TOP SẢN PHẨM BÁN CHẠY (mock)
    // =======================================
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

    // =======================================
    // 🟢  useEffect — GỌI API KHI FILTER THAY ĐỔI
    // =======================================
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchConcessions(currentPage - 1, itemsPerPage, {
                stockStatus: stockFilter !== "ALL" ? stockFilter : undefined,
                concessionType: concessionTypeFilter !== "ALL" ? concessionTypeFilter : undefined,
                concessionStatus: statusFilter !== "ALL" ? statusFilter : undefined,
                keyword: searchKeyword.trim() || undefined,
            });
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [currentPage, concessionTypeFilter, stockFilter, statusFilter, searchKeyword]);


    // useEffect(() => {
    //     const loadAll = async () => {
    //         await fetchConcessions(currentPage - 1, itemsPerPage)
    //     }
    //     loadAll()
    // }, [])

    useEffect(() => {
        const loadAll = async () => {
            const cached = sessionStorage.getItem("concessionTypes");

            if (cached) {
                // ⚡ Dùng cache để render nhanh UI
                setConcessionTypes(JSON.parse(cached));
            } else {
                // 🐢 Không có cache → gọi API
                await fetchConcessionTypes();
            }
            // Dù có cache vẫn nên làm mới dữ liệu ngầm
            fetchConcessionTypes();
            await fetchConcessions(currentPage - 1, itemsPerPage);
        };

        loadAll();
    }, []);

    // =======================================
    // 🟢  HÀM MỞ / ĐÓNG DIALOG
    // =======================================
    const openAddStockDialog = (id: number) => {
        setSelectedProductId(id)
        setIsAddStockDialogOpen(true)
    }
    const openToggleDialog = (product: Product) => {
        setToggleProduct(product)
        setIsToggleDialogOpen(true)
    }
    const openDeleteDialog = (id: number) => {
        setSelectedProductId(id)
        setIsDeleteDialogOpen(true)
    }
    const closeDeleteDialog = () => {
        setSelectedProductId(null)
        setIsDeleteDialogOpen(false)
    }

    // =======================================
    // 🟢 Helper
    // =======================================
    const processImage = async (imageInput: string | File): Promise<File | null> => {
        try {
            if (imageInput instanceof File) return imageInput

            if (typeof imageInput === "string") {
                if (imageInput.startsWith("data:image")) {
                    // base64
                    const [meta, data] = imageInput.split(",")
                    const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg"
                    const bin = atob(data)
                    const arr = Uint8Array.from(bin, (c) => c.charCodeAt(0))
                    return new File([arr], "image-base64.jpg", { type: mime })
                }

                if (imageInput.startsWith("http")) {
                    // ảnh từ URL
                    const res = await fetch(imageInput)
                    if (!res.ok) {
                        toast.error("Không thể tải ảnh từ liên kết.")
                        return null
                    }
                    const blob = await res.blob()
                    if (!blob.type.startsWith("image/")) {
                        toast.error("Liên kết không phải file ảnh!")
                        return null
                    }
                    const fileName = imageInput.split("/").pop() || "image-url.jpg"
                    return new File([blob], fileName, { type: blob.type })
                }
            }
            return null
        } catch (err) {
            console.error("Lỗi khi xử lý ảnh:", err)
            return null
        }
    }

    // =======================================
    // 🟢 FETCH API: LẤY DANH SÁCH
    // =======================================
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
                ...(filters?.concessionType && { concessionTypeId: filters.concessionType }),
                ...(filters?.concessionStatus && { concessionStatus: filters.concessionStatus }),
                ...(filters?.keyword && { keyword: filters.keyword }),
            });

            const res = await apiClient.get("/concession", { params })

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
                concessionTypeId: item.concessionType?.id ?? 0,                stockStatus: item.stockStatus,
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

    const fetchConcessionTypes = async () => {
        try {
            const res = await apiClient.get("/concession/types");
            if (res.data.status !== 200) {
                toast.error("Không thể tải loại sản phẩm!");
                return;
            }

            const list = res.data.data;
            setConcessionTypes(list); //  cập nhật state để rerender
            sessionStorage.setItem("concessionTypes", JSON.stringify(list));
            console.log("Concession Types loaded:", list);
        } catch (error: any) {
            toast.error("Lỗi khi tải danh sách loại sản phẩm.");
        }
    };

    // =======================================
    // 🟢 CRUD: THÊM / SỬA / XOÁ / CẬP NHẬT / ĐỔI TRẠNG THÁI
    // =======================================
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
            formData.append("concessionTypeId", String(newProduct.concessionTypeId));
            formData.append("unitInStock", newProduct.quantity);

            //  Gọi hàm xử lý ảnh
            const file = await processImage(newProduct.image);
            if (!file) return; // nếu lỗi thì dừng

            formData.append("file", file);

            // Gửi request
            const res = await apiClient.post("/concession", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            toast.success("Thêm sản phẩm thành công!");
            console.log("✅ Thêm sản phẩm:", res.data);

            //  Làm mới list + reset form
            await fetchConcessions(currentPage - 1, itemsPerPage);
            setNewProduct({
                name: "",
                price: "",
                quantity: "",
                description: "",
                concessionTypeId: null,
                image: "",
            });
            setIsAddDialogOpen(false);

        } catch (error: any) {
            console.error(" Lỗi khi thêm sản phẩm:", error);
            toast.error(error.response?.data?.message || "Không thể thêm sản phẩm. Vui lòng thử lại!");
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
            formData.append("concessionTypeId", String(selectedProduct.concessionTypeId));
            formData.append("unitInStock", selectedProduct.quantity.toString());

            //  Gọi hàm xử lý ảnh
            const file = await processImage(selectedProduct.image);
            if (file) formData.append("file", file);

            //  Gửi request API
            const res = await apiClient.put(`/concession/${selectedProduct.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

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
            const res = await apiClient.put(
                `/concession/${selectedProductId}/stock`,
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
            const res = await apiClient.delete(`${BACKEND_BASE_URL}/concession/${id}`);

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
            const res = await apiClient.put(
                `/concession/${toggleProduct.id}/status`,
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
// ➕ Thêm loại sản phẩm
    const handleAddType = async () => {
        if (!newTypeName.trim()) {
            toast.error("Tên loại sản phẩm không được để trống!");
            return;
        }

        try {
            const res = await apiClient.post("/concession/type", { name: newTypeName });
            if (res.data.status !== 200) {
                toast.error(res.data.message || "Không thể thêm loại sản phẩm!");
                return;
            }

            toast.success("Đã thêm loại sản phẩm mới!");
            setIsAddTypeDialogOpen(false);
            setNewTypeName("");
            await fetchConcessionTypes();
        } catch (err) {
            const error = err as any;
            if (error.response?.data?.status  === 1027) {
                toast.error("Loại sản phẩm này đã tồn tại!");
            } else {
                toast.error("Không thể thêm loại sản phẩm. Vui lòng thử lại!");
            }
        }
    };

// 🗑 Xoá loại sản phẩm
    const handleDeleteType = async (id: number) => {
        setSelectedTypeId(id);
        setIsDeleteTypeDialogOpen(true);
    };

    const confirmDeleteType = async () => {
        if (!selectedTypeId) return;

        try {
            const res = await apiClient.put(`/concession/types/${selectedTypeId}/status`);
            if (res.data.status !== 200) {
                toast.error(res.data.message || "Không thể xoá loại sản phẩm!");
                return;
            }

            toast.success("Đã xoá loại sản phẩm!");
            await fetchConcessionTypes();
            setIsDeleteTypeDialogOpen(false);
            setSelectedTypeId(null);
        } catch (err) {
            const error = err as any;

            console.error("Lỗi khi xoá loại:", error);
            if (error.response?.data?.status  === 1026) {
                toast.error("Không thể xoá loại sản phẩm này vì vẫn còn sản phẩm thuộc loại đó!");
            } else {
                toast.error("Không thể xoá loại sản phẩm. Vui lòng thử lại!");
            }
        }
    };

    // =======================================
    // 🟢 12. RETURN UI
    // =======================================
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
                            {/* Dropdown lọc loại sản phẩm */}
                            <Select
                                value={concessionTypeFilter}
                                onValueChange={(value: string) => setConcessionTypeFilter(value)}
                            >
                                <SelectTrigger className="w-full md:w-48 border-blue-200">
                                    <SelectValue placeholder="Loại sản phẩm" />
                                </SelectTrigger>

                                <SelectContent>
                                    {/* Mặc định chọn ALL */}
                                    <SelectItem value="ALL">Tất cả</SelectItem>

                                    {/* ✅ Load các loại sản phẩm từ state concessionTypes */}
                                    {concessionTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
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

                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE" )}>
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
                                                concessionType: concessionTypeFilter !== "ALL" ? concessionTypeFilter : undefined,
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
                                            concessionType: concessionTypeFilter !== "ALL" ? concessionTypeFilter : undefined,
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


                <div className="flex gap-4">
                {/* Products Table */}
                    <div className="w-[85%]">
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
                                        <TableCell className="text-gray-800">
                                            {concessionTypes.find(t => t.id === product.concessionTypeId)?.name || "Không xác định"}
                                        </TableCell>
                                        <TableCell className="text-gray-900">{product.price.toLocaleString()}đ</TableCell>
                                        <TableCell className="text-gray-600 max-w-xs truncate">{product.description}</TableCell>
                                        <TableCell>
                                            <img
                                                src={
                                                    product.image instanceof File
                                                        ? URL.createObjectURL(product.image)
                                                        : product.image || "/placeholder.svg"
                                                }
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                            />
                                        </TableCell>


                                        {/* Số lượng tồn kho */}
                                        <TableCell className="text-center align-middle">
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
                   </div>

                    {/* Bảng loại sản phẩm */}
                    <div className="w-[15%]">
                        <Card className="bg-white border-blue-100 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-gray-900 text-lg">Loại sản phẩm</CardTitle>

                                {/* Nút thêm loại sản phẩm */}
                                <Button
                                    onClick={() => setIsAddTypeDialogOpen(true)}
                                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type Name</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {concessionTypes.map((type) => (
                                            <TableRow key={type.id}>
                                                <TableCell className="font-medium">{type.name}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteType(type.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>

                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>


                {/*=======================================
                               DIALOG
                 =======================================*/}
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
                                    value={newProduct.concessionTypeId?.toString() || ""}
                                    onValueChange={(value: string) =>
                                        setNewProduct({ ...newProduct, concessionTypeId: Number(value) })
                                    }
                                >
                                    <SelectTrigger className="border-blue-200">
                                        <SelectValue placeholder="Chọn loại sản phẩm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {concessionTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
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
                                    <Label htmlFor="type">Loại sản phẩm</Label>
                                    <Select
                                        value={selectedProduct.concessionTypeId?.toString() || ""}
                                        onValueChange={(value: string) =>
                                            setSelectedProduct({ ...selectedProduct, concessionTypeId: Number(value) })
                                        }
                                    >
                                        <SelectTrigger className="border-blue-200">
                                            <SelectValue placeholder="Chọn loại sản phẩm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {concessionTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
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

                {/* 🟢 Dialog thêm loại sản phẩm */}
                <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Thêm loại sản phẩm</DialogTitle>
                            <DialogDescription>Nhập tên loại concession mới</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Label htmlFor="typeName">Tên loại</Label>
                            <Input
                                id="typeName"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="VD: Đồ uống, Bỏng, Snack..."
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setIsAddTypeDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleAddType} className="bg-blue-600 hover:bg-blue-700">
                                Thêm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 🔴 Dialog xác nhận xoá loại */}
                <AlertDialog open={isDeleteTypeDialogOpen} onOpenChange={setIsDeleteTypeDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xoá loại sản phẩm này không? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteTypeDialogOpen(false)}>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteType} className="bg-red-600 hover:bg-red-700">
                                Xoá
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>


        </BusinessManagerLayout>
    )
}