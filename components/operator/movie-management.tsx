"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {
    ArrowDown,
    ArrowUp,
    FileArchive,
    FileUp,
    Film,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    X
} from "lucide-react"
import {OperatorCheckbox} from "@/components/ui/operator-checkbox"
import {toast} from "sonner"
import Image from "next/image"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

// Token management utilities
const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp < currentTime
    } catch {
        return true
    }
}

const refreshAccessToken = async (): Promise<string | null> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            credentials: "include", // Include cookies
        })

        if (response.ok) {
            const data = await response.json()
            const newAccessToken = data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        } else {
            // Show notification before redirect
            if (typeof window !== 'undefined') {
                // Import toast dynamically to avoid SSR issues
                const {toast} = await import("sonner")
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
                    duration: 3000,
                })

                // Wait a bit for user to see the notification
                setTimeout(() => {
                    localStorage.removeItem("accessToken")
                    window.location.href = "/session-expired"
                }, 2000)
            }
            return null
        }
    } catch (error) {
        console.error("Refresh token failed:", error)
        if (typeof window !== 'undefined') {
            const {toast} = await import("sonner")
            toast.error("Lỗi xác thực. Vui lòng đăng nhập lại.", {
                duration: 3000,
            })

            setTimeout(() => {
                localStorage.removeItem("accessToken")
                window.location.href = "/session-expired"
            }, 2000)
        }
        return null
    }
}

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem("accessToken")

    // Check if token is expired
    if (isTokenExpired(token)) {
        token = await refreshAccessToken()
        if (!token) {
            throw new Error("Authentication failed")
        }
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    })
}

interface Movie {
    id: number
    actor: string
    description: string
    director: string
    name: string
    posterUrl: string
    releaseDate: string
    trailerUrl?: string
    status: "UPCOMING" | "PLAYING" | "ENDED"
    country: { id: number; name: string }
    language: { id: number; name: string }
    genre: { id: number; name: string }[]
    ageRating?: string
    duration?: number
}


const AGE_RATINGS = ["P", "K", "T13", "T16", "T18", "C"]
const COUNTRIES = ["Vietnam", "USA", "Korea", "Japan", "China", "Thailand", "France", "UK"]

interface Genre {
    id: number
    name: string
}

interface Language {
    id: number
    name: string
}

export function MovieManagement() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null)

    const [posterPreview, setPosterPreview] = useState<string>("")
    const [posterFile, setPosterFile] = useState<File | null>(null)

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGenre, setSelectedGenre] = useState<string>("all")
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [dateError, setDateError] = useState("")
    const [statusFilters, setStatusFilters] = useState<{ upcoming: boolean; "now-showing": boolean; ended: boolean }>({
        upcoming: false,
        "now-showing": false,
        ended: false,
    })


    const [sortField, setSortField] = useState<"name" | "releaseDate">("releaseDate")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalMovies, setTotalMovies] = useState(0)

    const [formData, setFormData] = useState({
        name: "",
        genre: "",
        language: "",
        duration: "",
        releaseDate: "",
        description: "",
        poster: "",
        status: "" as Movie["status"],
        director: "",
        actors: "",
        ageRating: "",
        year: "",
        country: "",
    })

    const fetchGenres = async () => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/movies/movie-genres`)
            if (response.ok) {
                const data = await response.json()
                setGenres(data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch genres:", error)
        }
    }

    const fetchLanguages = async () => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/movies/languages`)
            if (response.ok) {
                const data = await response.json()
                setLanguages(data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch languages:", error)
        }
    }

    const fetchMovies = async () => {
        setIsLoading(true)
        try {
            const statuses = Object.entries(statusFilters)
                .filter(([_, v]) => v)
                .map(([k]) => {
                    // Map frontend status to backend enum
                    switch (k) {
                        case 'upcoming':
                            return 'UPCOMING'
                        case 'now-showing':
                            return 'PLAYING'
                        case 'ended':
                            return 'ENDED'
                        default:
                            return k.toUpperCase()
                    }
                })
                .join(",")

            // Build query parameters only for non-empty values
            const queryParams: Record<string, string> = {
                pageNo: currentPage.toString(),
                pageSize: pageSize.toString(),
                sortBy: `${sortField}:${sortDirection}`,
            }

            // Only add filter parameters if they have values
            if (searchQuery.trim()) {
                queryParams.keyword = searchQuery.trim()
            }
            if (selectedGenre !== "all") {
                queryParams.genre = selectedGenre
            }
            if (selectedLanguage !== "all") {
                queryParams.language = selectedLanguage
            }
            if (dateFrom) {
                queryParams.fromDate = dateFrom
            }
            if (dateTo) {
                queryParams.toDate = dateTo
            }

            const query = new URLSearchParams()

            // Add all parameters
            Object.entries(queryParams).forEach(([key, value]) => {
                if (key !== 'statuses') {
                    query.append(key, value)
                }
            })

            // Add statuses as multiple parameters
            if (statuses) {
                const statusArray = statuses.split(',')
                statusArray.forEach(status => {
                    query.append('statuses', status)
                })
            }

            const fullUrl = BASE_URL + `/movies/list-with-filter-many-column-and-sortBy?${query.toString()}`

            const res = await fetchWithAuth(fullUrl)

            if (!res.ok) throw new Error("Vui lòng đăng nhập để sử dụng chức năng")

            const data = await res.json()
            setMovies(data.data.items || [])
            // Fix: Calculate totalPages if API returns 0 but has items
            const totalItems = data.data.totalItems || 0
            const calculatedTotalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0
            setTotalMovies(totalItems)
        } catch (error) {
            toast.error("Không thể tải danh sách phim. Vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchGenres(),
                fetchLanguages(),
                fetchMovies()
            ])
        }
        loadData()
    }, [])

    useEffect(() => {
        const loadMovies = async () => {
            await fetchMovies()
        }
        loadMovies()
    }, [currentPage, pageSize, sortField, sortDirection, searchQuery, selectedGenre, selectedLanguage, dateFrom, dateTo, statusFilters])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WebP)")
                return
            }

            setPosterFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPosterPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removePosterPreview = () => {
        setPosterPreview("")
        setPosterFile(null)
        setFormData({...formData, poster: ""})
    }

    const validateDateRange = (from: string, to: string) => {
        if (from && to && new Date(from) > new Date(to)) {
            setDateError("Ngày bắt đầu không được lớn hơn ngày kết thúc")
            toast.warning("Ngày bắt đầu không được lớn hơn ngày kết thúc")
            return false
        }
        setDateError("")
        return true
    }

    const handleSubmit = async () => {
        try {
            const formDataToSend = new FormData()
            for (const [key, value] of Object.entries(formData)) {
                formDataToSend.append(key, value)
            }
            if (posterFile) formDataToSend.append("posterFile", posterFile)

            const url = editingMovie ? `${BASE_URL}/movies/${editingMovie.id}` : `${BASE_URL}/movies`
            const method = editingMovie ? "PUT" : "POST"

            const res = await fetchWithAuth(url, {
                method,
                body: formDataToSend,
            })
            if (!res.ok) throw new Error("Không thể lưu phim")

            toast.success(editingMovie ? "Cập nhật phim thành công" : "Thêm phim mới thành công")

            setIsDialogOpen(false)
            resetForm()
            await fetchMovies()
        } catch (error) {
            toast.error("Không thể lưu phim. Vui lòng thử lại.")
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const res = await fetchWithAuth(`${BASE_URL}/movies/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Không thể xóa phim")

            toast.success("Xóa phim thành công")
            await fetchMovies()
        } catch {
            toast.error("Không thể xóa phim. Vui lòng thử lại.")
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            genre: "",
            language: "",
            duration: "",
            releaseDate: "",
            description: "",
            poster: "",
            status: "UPCOMING",
            director: "",
            actors: "",
            ageRating: "",
            year: "",
            country: "",
        })
        setEditingMovie(null)
        setPosterPreview("")
        setPosterFile(null)
    }

    const resetFilters = () => {
        setSearchQuery("")
        setSelectedGenre("all")
        setSelectedLanguage("all")
        setDateFrom("")
        setDateTo("")
        setDateError("")
        setStatusFilters({upcoming: false, "now-showing": false, ended: false})
        setCurrentPage(1)
        toast.info("Đã đặt lại bộ lọc")
    }

    const toggleSort = (field: "name" | "releaseDate") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const getStatusBadge = (status: Movie["status"]) => {
        switch (status) {
            case "UPCOMING":
                return {
                    label: "Sắp chiếu",
                    variant: "secondary" as const,
                    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }
            case "PLAYING":
                return {
                    label: "Đang chiếu",
                    variant: "default" as const,
                    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }
            case "ENDED":
                return {
                    label: "Đã kết thúc",
                    variant: "outline" as const,
                    className: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }
            default:
                return {
                    label: "Không xác định",
                    variant: "outline" as const,
                    className: "bg-muted text-muted-foreground border-muted-foreground/20"
                }
        }
    }


    const totalPages = totalMovies > 0 ? Math.ceil(totalMovies / pageSize) : 0

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const isCSV = file.name.endsWith(".csv")
        const isZIP = file.name.endsWith(".zip")

        if (!isCSV && !isZIP) {
            toast.error("Vui lòng chọn file CSV hoặc ZIP hợp lệ")
            return
        }

        const formData = new FormData()
        formData.append("file", file)

        try {
            setIsLoading(true)
            const response = await fetchWithAuth(`${BASE_URL}/movies/bulk`, {
                method: "POST",
                body: formData,
            })
            if (!response.ok) throw new Error("Upload thất bại")

            const result = await response.json()
            toast.success(`Đã thêm ${result.count} phim`)
            setIsBulkDialogOpen(false)
            await fetchMovies()
        } catch {
            toast.error("Không thể tải lên file. Vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (movie: Movie) => {
        setEditingMovie(movie)
        setFormData({
            name: movie.name || "",
            genre: movie.genre?.[0]?.name || "",
            language: movie.language?.name || "",
            duration: movie.duration?.toString() || "",
            releaseDate: movie.releaseDate || "",
            description: movie.description || "",
            poster: movie.posterUrl || "",
            status: movie.status || "UPCOMING",
            director: movie.director || "",
            actors: movie.actor || "",
            ageRating: movie.ageRating || "",
            year: new Date(movie.releaseDate).getFullYear().toString(),
            country: movie.country?.name || "",
        })
        setPosterPreview(movie.posterUrl || "")
        setIsDialogOpen(true)
    }


    const downloadTemplate = () => {
        const csvContent = `title,genre,language,duration,releaseDate,description,director,actors,ageRating,year,country,status,poster_filename
Spider-Man: No Way Home,Action,English,148,2024-12-15,A superhero film,Jon Watts,Tom Holland; Zendaya,T13,2024,USA,upcoming,spider-man.jpg
Top Gun: Maverick,Action,English,130,2024-11-20,An action drama,Joseph Kosinski,Tom Cruise; Jennifer Connelly,T16,2024,USA,now-showing,top-gun.jpg`

        const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"})
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "movie_template.csv"
        link.click()
        toast.info("Đã tải xuống file mẫu CSV")
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">Quản lý Phim</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Quản lý danh sách phim và thông tin chi tiết</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"
                                    className="border-primary text-primary hover:bg-primary/10 bg-transparent">
                                <FileUp className="w-4 h-4 mr-2"/>
                                Thêm nhiều phim
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="bg-card text-card-foreground border-border max-w-2xl max-h-[80vh] w-[90vw] sm:w-full flex flex-col operator-dialog-scroll">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-foreground text-2xl">Thêm nhiều phim cùng lúc</DialogTitle>
                            </DialogHeader>
                            <div
                                className="space-y-6 py-4 overflow-y-auto flex-1 operator-scrollbar operator-scroll-fade">
                                {/* Scroll indicator */}
                                <div className="text-center text-xs text-muted-foreground mb-2 opacity-60">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                                        <span className="ml-2">Cuộn để xem thêm</span>
                                    </div>
                                </div>

                                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                    <h3 className="font-semibold text-foreground">Hướng dẫn:</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-foreground mb-2">Cách 1: Chỉ thông tin phim
                                                (CSV)</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                                <li>Tải xuống file mẫu CSV bên dưới</li>
                                                <li>Điền thông tin phim vào file CSV</li>
                                                <li>Tải lên file CSV</li>
                                            </ol>
                                        </div>
                                        <div className="border-t border-border pt-3">
                                            <h4 className="font-medium text-foreground mb-2">Cách 2: Phim + Poster
                                                (ZIP)</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                                <li>Tải xuống file mẫu CSV và điền thông tin phim</li>
                                                <li>Thêm cột "poster_filename" với tên file ảnh (vd: spider-man.jpg)
                                                </li>
                                                <li>Chuẩn bị các file ảnh poster tương ứng</li>
                                                <li>Đặt file CSV và tất cả ảnh poster vào cùng 1 thư mục</li>
                                                <li>Nén thư mục thành file ZIP</li>
                                                <li>Tải lên file ZIP</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={downloadTemplate}
                                        variant="outline"
                                        className="w-full border-border text-foreground hover:bg-muted bg-transparent"
                                    >
                                        <FileUp className="w-4 h-4 mr-2"/>
                                        Tải xuống file mẫu CSV
                                    </Button>

                                    <div className="relative">
                                        <Input
                                            id="bulk-upload"
                                            type="file"
                                            accept=".csv,.zip"
                                            onChange={handleBulkUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            onClick={() => document.getElementById("bulk-upload")?.click()}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <FileArchive className="w-4 h-4 mr-2"/>
                                                    Chọn file CSV hoặc ZIP
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
                                    <p className="text-sm text-foreground">
                                        <strong>Lưu ý CSV:</strong> File CSV phải có đúng định dạng với các cột: title,
                                        genre, language,
                                        duration, releaseDate, description, director, actors, ageRating, year, country,
                                        status
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Lưu ý ZIP:</strong> File ZIP phải chứa 1 file CSV và các file ảnh
                                        poster. Tên file ảnh trong
                                        CSV phải khớp với tên file trong ZIP.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open)
                            if (!open) resetForm()
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 mr-2"/>
                                Thêm phim mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="bg-card text-card-foreground border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-foreground text-2xl">
                                    {editingMovie ? "Sửa phim" : "Thêm phim mới"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="poster" className="text-foreground font-medium">
                                        Poster phim
                                    </Label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    id="poster-file"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("poster-file")?.click()}
                                                    className="border-border text-foreground hover:bg-muted bg-transparent"
                                                >
                                                    <Upload className="w-4 h-4 mr-2"/>
                                                    Chọn file
                                                </Button>
                                                {posterFile && (
                                                    <span
                                                        className="text-sm text-muted-foreground flex items-center">{posterFile.name}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Chọn file ảnh poster (JPG, PNG,
                                                WebP)</p>
                                        </div>

                                        {posterPreview && (
                                            <div className="relative">
                                                <Image
                                                    src={posterPreview || "/placeholder.svg"}
                                                    alt="Poster preview"
                                                    width={120}
                                                    height={180}
                                                    className="rounded-lg object-cover shadow-lg border-2 border-border"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={removePosterPreview}
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="name" className="text-foreground font-medium">
                                        Tên phim
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="director" className="text-foreground font-medium">
                                            Đạo diễn
                                        </Label>
                                        <Input
                                            id="director"
                                            value={formData.director}
                                            onChange={(e) => setFormData({...formData, director: e.target.value})}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="actors" className="text-foreground font-medium">
                                            Diễn viên
                                        </Label>
                                        <Input
                                            id="actors"
                                            value={formData.actors}
                                            onChange={(e) => setFormData({...formData, actors: e.target.value})}
                                            placeholder="Ngăn cách bằng dấu phẩy"
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="genre" className="text-foreground font-medium">
                                            Thể loại
                                        </Label>
                                        <Select
                                            value={formData.genre}
                                            onValueChange={(value) => setFormData({...formData, genre: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn thể loại"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {genres.map((genre) => (
                                                    <SelectItem key={genre.id} value={genre.name}>
                                                        {genre.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="language" className="text-foreground font-medium">
                                            Ngôn ngữ
                                        </Label>
                                        <Select
                                            value={formData.language}
                                            onValueChange={(value) => setFormData({...formData, language: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn ngôn ngữ"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {languages.map((lang) => (
                                                    <SelectItem key={lang.id} value={lang.name}>
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="ageRating" className="text-foreground font-medium">
                                            Độ tuổi
                                        </Label>
                                        <Select
                                            value={formData.ageRating}
                                            onValueChange={(value) => setFormData({...formData, ageRating: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {AGE_RATINGS.map((rating) => (
                                                    <SelectItem key={rating} value={rating}>
                                                        {rating}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="country" className="text-foreground font-medium">
                                            Quốc gia
                                        </Label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(value) => setFormData({...formData, country: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {COUNTRIES.map((country) => (
                                                    <SelectItem key={country} value={country}>
                                                        {country}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="duration" className="text-foreground font-medium">
                                            Thời lượng (phút)
                                        </Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="releaseDate" className="text-foreground font-medium">
                                            Ngày khởi chiếu
                                        </Label>
                                        <Input
                                            id="releaseDate"
                                            type="date"
                                            value={formData.releaseDate}
                                            onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                                            className="bg-input border-border text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="status" className="text-foreground font-medium">
                                        Trạng thái
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: Movie["status"]) =>
                                            setFormData({...formData, status: value})
                                        }
                                    >
                                        <SelectTrigger className="bg-input border-border text-foreground">
                                            <SelectValue placeholder="Chọn trạng thái"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="UPCOMING">Sắp chiếu</SelectItem>
                                            <SelectItem value="PLAYING">Đang chiếu</SelectItem>
                                            <SelectItem value="ENDED">Đã kết thúc</SelectItem>
                                        </SelectContent>
                                    </Select>


                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="description" className="text-foreground font-medium">
                                        Mô tả
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="bg-input border-border text-foreground min-h-32"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false)
                                        resetForm()
                                    }}
                                    className="border-border text-foreground hover:bg-muted"
                                >
                                    Hủy
                                </Button>
                                <Button onClick={handleSubmit}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    Lưu
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                <div className="space-y-5">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                            <Input
                                placeholder="Tìm kiếm theo tên phim hoặc tên quốc gia..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 bg-input border-border text-foreground h-12 text-base"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="border-border text-foreground hover:bg-muted bg-transparent h-12 px-6"
                        >
                            Xóa bộ lọc
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground font-medium">Thể loại</Label>
                            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                                <SelectTrigger className="bg-input border-border text-foreground h-11">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {genres.map((genre) => (
                                        <SelectItem key={genre.id} value={genre.name}>
                                            {genre.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground font-medium">Ngôn ngữ</Label>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="bg-input border-border text-foreground h-11">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.id} value={lang.name}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground font-medium">Từ ngày</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value)
                                    validateDateRange(e.target.value, dateTo)
                                }}
                                className={`bg-input border-border text-foreground h-11 ${dateError ? "border-destructive" : ""}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground font-medium">Đến ngày</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value)
                                    validateDateRange(dateFrom, e.target.value)
                                }}
                                className={`bg-input border-border text-foreground h-11 ${dateError ? "border-destructive" : ""}`}
                            />
                        </div>
                    </div>

                    {dateError && <p className="text-sm text-destructive font-medium">{dateError}</p>}

                    <div className="space-y-4">
                        <Label className="text-sm text-muted-foreground font-medium">Trạng thái:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <OperatorCheckbox
                                id="upcoming"
                                checked={statusFilters.upcoming}
                                onChange={(e) => setStatusFilters({...statusFilters, upcoming: e.target.checked})}
                                status="upcoming"
                                label="Sắp chiếu"
                                showIndicator={true}
                            />
                            <OperatorCheckbox
                                id="now-showing"
                                checked={statusFilters["now-showing"]}
                                onChange={(e) => setStatusFilters({...statusFilters, "now-showing": e.target.checked})}
                                status="now-showing"
                                label="Đang chiếu"
                                showIndicator={true}
                            />
                            <OperatorCheckbox
                                id="ended"
                                checked={statusFilters.ended}
                                onChange={(e) => setStatusFilters({...statusFilters, ended: e.target.checked})}
                                status="ended"
                                label="Đã kết thúc"
                                showIndicator={true}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-border">
                        <Label className="text-sm text-muted-foreground font-medium">Sắp xếp theo:</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={sortField === "name" ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSort("name")}
                                className={
                                    sortField === "name"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "border-border text-foreground hover:bg-muted"
                                }
                            >
                                Tên phim
                                {sortField === "name" &&
                                    (sortDirection === "asc" ? (
                                        <ArrowUp className="w-3 h-3 ml-1"/>
                                    ) : (
                                        <ArrowDown className="w-3 h-3 ml-1"/>
                                    ))}
                            </Button>
                            <Button
                                variant={sortField === "releaseDate" ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSort("releaseDate")}
                                className={
                                    sortField === "releaseDate"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "border-border text-foreground hover:bg-muted"
                                }
                            >
                                Ngày phát hành
                                {sortField === "releaseDate" &&
                                    (sortDirection === "asc" ? (
                                        <ArrowUp className="w-3 h-3 ml-1"/>
                                    ) : (
                                        <ArrowDown className="w-3 h-3 ml-1"/>
                                    ))}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                        <span className="ml-4 text-muted-foreground text-lg">Đang tải dữ liệu...</span>
                    </div>
                ) : movies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Film className="w-10 h-10 text-muted-foreground"/>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy phim</h3>
                        <p className="text-base text-muted-foreground max-w-md">
                            Không có phim nào phù hợp với tiêu chí tìm kiếm. Vui lòng thử lại với bộ lọc khác.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-muted/50">
                                        <TableHead className="text-muted-foreground font-semibold">Tên phim</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Thể loại</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Đạo diễn</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Diễn viên</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Độ tuổi</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Thời
                                            lượng</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Ngôn ngữ</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Quốc gia</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Ngày phát
                                            hành</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Trạng
                                            thái</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Poster</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movies.map((movie) => {
                                        const statusBadge = getStatusBadge(movie.status)
                                        return (
                                            <TableRow key={movie.id}
                                                      className="border-border hover:bg-muted/30 transition-colors">
                                                <TableCell
                                                    className="font-semibold text-foreground">{movie.name}</TableCell>
                                                <TableCell>{movie.genre.map(g => g.name).join(", ")}</TableCell>
                                                <TableCell className="text-foreground">{movie.director}</TableCell>
                                                <TableCell className="text-foreground max-w-[200px] truncate"
                                                           title={movie.actor}>
                                                    {movie.actor}
                                                </TableCell>
                                                <TableCell className="text-foreground">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                                    >
                                                        {movie.ageRating || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-foreground">
                                                    {movie.duration ? `${movie.duration} phút` : "N/A"}
                                                </TableCell>
                                                <TableCell
                                                    className="text-foreground">{movie.language?.name || "N/A"}</TableCell>
                                                <TableCell className="text-foreground">{movie.country?.name}</TableCell>
                                                <TableCell className="text-foreground">
                                                    {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={statusBadge.variant}
                                                        className={statusBadge.className}
                                                    >
                                                        {statusBadge.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Image
                                                        src={movie.posterUrl || "/placeholder.svg"}
                                                        alt={movie.name}
                                                        width={80}
                                                        height={120}
                                                        className="rounded-lg object-cover shadow-md"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditDialog(movie)}
                                                            className="text-foreground hover:bg-muted"
                                                        >
                                                            <Pencil className="w-4 h-4"/>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(movie.id)}
                                                            className="text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-6 py-5 border-t border-border">
                            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground font-medium">
                  Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalMovies)} trong
                  tổng số {totalMovies} phim
                </span>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setCurrentPage(1)
                                    }}
                                >
                                    <SelectTrigger className="w-24 bg-input border-border text-foreground">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                                >
                                    Trước
                                </Button>
                                <div className="flex gap-1">
                                    {totalPages > 0 && Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }

                                        // Ensure pageNum is within valid range
                                        if (pageNum < 1 || pageNum > totalPages) {
                                            return null
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={
                                                    currentPage === pageNum
                                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                        : "border-border text-foreground hover:bg-muted"
                                                }
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    }).filter(Boolean)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}
