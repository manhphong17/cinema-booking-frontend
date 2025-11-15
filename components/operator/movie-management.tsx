"use client"

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
import type React from "react"
import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Switch} from "@/components/ui/switch"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
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
import {apiClient} from "../../src/api/interceptor"
import {useAuthGuard} from "../../src/api/auth-guard"

// ===============================
// 2️⃣ TYPE DEFINITIONS
// ===============================
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
    isFeatured: boolean
}

type FeaturedMap = Record<number, boolean>

interface Genre {
    id: number
    name: string
}

interface Language {
    id: number
    name: string
}

interface Country {
    id: number
    name: string
}

// ===============================
// 3️⃣ COMPONENT CHÍNH
// ===============================
export function MovieManagement() {
    const router = useRouter()
    
    // =======================================
    // 🟢 STATE CHÍNH & DATA
    // =======================================
    const [movies, setMovies] = useState<Movie[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [countries, setCountries] = useState<Country[]>([])
    const [featuredByMovieId, setFeaturedByMovieId] = useState<FeaturedMap>({}) // Local featured (Banner/Nổi bật) state map by movie id

    // =======================================
    // 🟢 STATE LOADING & DIALOG
    // =======================================
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
    const [confirmDeleteMovie, setConfirmDeleteMovie] = useState<Movie | null>(null)

    // =======================================
    // 🟢 STATE FORM & GENRE SELECTION
    // =======================================
    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
    const [genreSearch, setGenreSearch] = useState("")
    const [showGenreDropdown, setShowGenreDropdown] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        genreIds: [] as number[],
        languageId: "",
        duration: "",
        releaseDate: "",
        description: "",
        poster: "",
        status: "" as Movie["status"],
        director: "",
        actors: "",
        ageRating: "",
        year: "",
        countryId: "",
        trailerUrl: "",
    })

    // =======================================
    // 🟢 STATE FILTER & SORT
    // =======================================
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
    const [sortField, setSortField] = useState<"id" | "name" | "releaseDate">("id")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

    // =======================================
    // 🟢 STATE PAGINATION
    // =======================================
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalMovies, setTotalMovies] = useState(0)

    // =======================================
    // 🟢 AUTH GUARD
    // =======================================
    useAuthGuard()

    // =======================================
    // 🟢 FETCH API: LẤY DANH SÁCH
    // =======================================
    const fetchGenres = async () => {
        try {
            const response = await apiClient.get('/movies/movie-genres')
            setGenres(response.data.data || [])
        } catch (error) {
            console.error("Lỗi khi tải danh sách thể loại:", error)
        }
    }

    const fetchLanguages = async () => {
        try {
            const response = await apiClient.get('/movies/languages')
            setLanguages(response.data.data || [])
        } catch (error) {
            console.error("Lỗi khi tải danh sách ngôn ngữ:", error)
        }
    }

    const fetchCountries = async () => {
        try {
            const response = await apiClient.get('/movies/countries')
            setCountries(response.data.data || [])
        } catch (error) {
            console.error("Lỗi khi tải danh sách quốc gia:", error)
        }
    }

    // =======================================
    // 🟢 HELPER FUNCTIONS
    // =======================================
    const filteredGenres = genres.filter(genre => 
        genre.name.toLowerCase().includes(genreSearch.toLowerCase())
    )

    const handleGenreSelect = (genre: Genre) => {
        if (!selectedGenres.find(g => g.id === genre.id)) {
            const newSelectedGenres = [...selectedGenres, genre]
            const newGenreIds = newSelectedGenres.map(g => g.id)
            setSelectedGenres(newSelectedGenres)
            setFormData({
                ...formData,
                genreIds: newGenreIds
            })
        }
        setGenreSearch("")
        setShowGenreDropdown(false)
    }

    // Handle genre removal
    const handleGenreRemove = (genreId: number) => {
        const newSelectedGenres = selectedGenres.filter(g => g.id !== genreId)
        const newGenreIds = newSelectedGenres.map(g => g.id)
        setSelectedGenres(newSelectedGenres)
        setFormData({
            ...formData,
            genreIds: newGenreIds
        })
    }

    // =======================================
    // 🟢 FETCH API: LẤY DANH SÁCH PHIM
    // =======================================
    const fetchMovies = async () => {
        setIsLoading(true)
        try {
            const statuses = Object.entries(statusFilters)
                .filter(([_, v]) => v)
                .map(([k]) => {
                    // Map trạng thái frontend sang enum backend
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

            // Xây dựng query parameters chỉ cho các giá trị không rỗng
            const queryParams: Record<string, string> = {
                pageNo: currentPage.toString(),
                pageSize: pageSize.toString(),
                sortBy: `${sortField}:${sortDirection}`,
            }

            // Chỉ thêm tham số filter nếu chúng có giá trị
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

            // Thêm tất cả parameters
            Object.entries(queryParams).forEach(([key, value]) => {
                if (key !== 'statuses') {
                    query.append(key, value)
                }
            })

            // Thêm statuses như multiple parameters
            if (statuses && statuses.length > 0) {
                statuses.forEach(status => {
                    query.append('statuses', status)
                })
            }

            const response = await apiClient.get(`/movies/list-with-filter-many-column-and-sortBy?${query.toString()}`)
            
            const items = response.data.data.items || []
            setMovies(items)
            
            // Khởi tạo featured map cho items mới nếu chưa có
            const newFeatureMap: FeaturedMap = {}
            for (const m of items){
                newFeatureMap[m.id] = m.isFeatured
            }
            setFeaturedByMovieId(newFeatureMap)

            const totalItems = response.data.data.totalItems || 0
            setTotalMovies(totalItems)
        } catch (error) {
            toast.error("Lỗi kết nối server.")
        } finally {
            setIsLoading(false)
        }
    }

    // =======================================
    // 🟢 CRUD: CẬP NHẬT / XOÁ / TOGGLE FEATURED
    // =======================================
    const handleToggleFeatured = async (movieId: number, checked: boolean) => {
        // Lưu trạng thái trước khi gọi API
        const previousValue = featuredByMovieId[movieId]
        setFeaturedByMovieId(prev => ({...prev, [movieId]: checked}))
        try {
            // Gọi API update feature
            await apiClient.patch(`/movies/update-feature/${movieId}`, {isFeatured: checked})
            toast.success(checked ? "Đã bật Banner" : "Đã tắt Banner")
        }
        catch (error){
            // Hoàn tác trạng thái
            setFeaturedByMovieId(prev => ({...prev, [movieId]: previousValue}))
            toast.error("Không thể cập nhật trạng thái nổi bật.")
        }
    }

    // =======================================
    // 🟢 useEffect — INIT & LOAD DATA
    // =======================================
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchGenres(),
                fetchLanguages(),
                fetchCountries(),
                fetchMovies()
            ])
        }
        loadData()
    }, [])

    // =======================================
    // 🟢 useEffect — CLOSE GENRE DROPDOWN
    // =======================================
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.genre-dropdown-container')) {
                setShowGenreDropdown(false)
            }
        }

        if (showGenreDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showGenreDropdown])

    // =======================================
    // 🟢 useEffect — FETCH MOVIES KHI FILTER THAY ĐỔI
    // =======================================
    useEffect(() => {
        const loadMovies = async () => {
            await fetchMovies()
        }
        loadMovies()
    }, [currentPage, pageSize, sortField, sortDirection, searchQuery, selectedGenre, selectedLanguage, dateFrom, dateTo, statusFilters])

    // =======================================
    // 🟢 VALIDATION FUNCTIONS
    // =======================================
    const validateDateRange = (from: string, to: string) => {
        if (from && to && new Date(from) > new Date(to)) {
            toast.warning("Ngày bắt đầu không được lớn hơn ngày kết thúc")
            return false
        }
        setDateError("")
        return true
    }

    const validateForm = () => {
        if (!formData.name || !formData.name.trim()) {
            toast.error("Vui lòng nhập tên phim")
            return false
        }
        if (formData.name.length < 2 || formData.name.length > 200) {
            toast.error("Độ dài tên phim phải từ 2 đến 200 kí tự")
            return false
        }
        if (!formData.genreIds || formData.genreIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một thể loại")
            return false
        }
        if (!formData.languageId) {
            toast.error("Vui lòng chọn ngôn ngữ")
            return false
        }
        if (!formData.releaseDate) {
            toast.error("Vui lòng chọn ngày phát hành")
            return false
        }
        if (!formData.status) {
            toast.error("Vui lòng chọn trạng thái")
            return false
        }
        if (!formData.countryId) {
            toast.error("Vui lòng chọn quốc gia")
            return false
        }
        
        return true
    }

    // =======================================
    // 🟢 EVENT HANDLERS
    // =======================================
    const handleSubmit = async () => {
        if (!validateForm()) return
        
        try {
            const basicData = {
                id: editingMovie?.id,
                name: formData.name,
                genreIds: formData.genreIds,
                languageId: parseInt(formData.languageId),
                releaseDate: formData.releaseDate,
                status: formData.status,
                countryId: parseInt(formData.countryId),
            }
            await apiClient.put(`/movies/update/${editingMovie?.id}`, basicData)

            toast.success("Cập nhật thông tin thành công")

            resetForm()
            await fetchMovies()
        } catch (error: any) {
            if(error.response?.data?.status === 409) {
                toast.error("Phim đã tồn tại trong hệ thống.")
            } else {
                toast.error("Không thể lưu phim. Vui lòng thử lại.")
            }
        }
    }

    const handleConfirmDelete = async () => {
        if (!confirmDeleteMovie) return
        try {
            setIsDeleting(true)
            await apiClient.patch(`/movies/delete/${confirmDeleteMovie.id}`)
            toast.success("Xóa phim thành công")
            setConfirmDeleteMovie(null)
            await fetchMovies()
        } catch {
            toast.error("Không thể xóa phim. Vui lòng thử lại.")
        } finally {
            setIsDeleting(false)
        }
    }

    // =======================================
    // 🟢 HELPER FUNCTIONS: RESET & UTILS
    // =======================================
    const resetForm = () => {
        setFormData({
            name: "",
            genreIds: [],
            languageId: "",
            duration: "",
            releaseDate: "",
            description: "",
            poster: "",
            status: "UPCOMING",
            director: "",
            actors: "",
            ageRating: "",
            year: "",
            countryId: "",
            trailerUrl: "",
        })
        setSelectedGenres([])
        setEditingMovie(null)
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

    const toggleSort = (field: "id" | "name" | "releaseDate") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc") // Mặc định giảm dần cho tất cả field
        }
    }

    // =======================================
    // 🟢 UI HELPER FUNCTIONS
    // =======================================
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

    // =======================================
    // 🟢 COMPUTED VALUES
    // =======================================
    const totalPages = totalMovies > 0 ? Math.ceil(totalMovies / pageSize) : 0

    // =======================================
    // 🟢 BULK UPLOAD FUNCTIONS
    // =======================================
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
            const response = await apiClient.post('/movies/bulk', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })
            
            toast.success(`Đã thêm ${response.data.count} phim`)
            setIsBulkDialogOpen(false)
            await fetchMovies()
        } catch {
            toast.error("Không thể tải lên file. Vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = async (movie: Movie) => {
        setEditingMovie(movie)
        
        // Đảm bảo countries đã được load trước khi mở dialog
        if (countries.length === 0) {
            await fetchCountries()
        }
        
        // Set selected genres từ dữ liệu phim
        const movieGenres = movie.genre || []
        setSelectedGenres(movieGenres)
        
        setFormData({
            name: movie.name || "",
            genreIds: movieGenres.map(g => g.id),
            languageId: movie.language?.id?.toString() || "",
            duration: movie.duration?.toString() || "",
            releaseDate: movie.releaseDate || "",
            description: movie.description || "",
            poster: movie.posterUrl || "",
            status: movie.status || "UPCOMING",
            director: movie.director || "",
            actors: movie.actor || "",
            ageRating: movie.ageRating || "",
            year: new Date(movie.releaseDate).getFullYear().toString(),
            countryId: movie.country?.id?.toString() || "",
            trailerUrl: movie.trailerUrl || "",
        })
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

    // =======================================
    // 🟢 RETURN UI
    // =======================================
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

                    <Button
                        onClick={() => router.push("/operator-manager/movies/add")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2"/>
                        Thêm phim mới
                    </Button>

                    {/* Edit Dialog */}
                    <Dialog
                        open={!!editingMovie}
                        onOpenChange={(open) => {
                            if (!open) {
                                setEditingMovie(null)
                                resetForm()
                                setShowGenreDropdown(false)
                                setGenreSearch("")
                            }
                        }}
                    >
                        <DialogContent className="bg-card text-card-foreground border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-foreground text-2xl">
                                    Chỉnh sửa phim
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="edit-name" className="text-foreground font-medium">
                                        Tên phim *
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="bg-input border-border text-foreground"
                                        placeholder="Nhập tên phim"
                                    />
                                </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="edit-genre" className="text-foreground font-medium">
                                            Thể loại *
                                        </Label>
                                    <div className="space-y-3">
                                        {/* Selected Genres Display */}
                                        {selectedGenres.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedGenres.map((genre) => (
                                                    <Badge
                                                        key={genre.id}
                                                        variant="secondary"
                                                        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                                    >
                                                        {genre.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleGenreRemove(genre.id)}
                                                            className="ml-2 hover:text-destructive"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                    </div>
                                        )}
                                        
                                        {/* Genre Search Input */}
                                        <div className="relative genre-dropdown-container">
                                            <Input
                                                placeholder="Tìm kiếm thể loại..."
                                                value={genreSearch}
                                                onChange={(e) => {
                                                    setGenreSearch(e.target.value)
                                                    setShowGenreDropdown(true)
                                                }}
                                                onFocus={() => setShowGenreDropdown(true)}
                                                className="bg-input border-border text-foreground"
                                            />
                                            
                                            {/* Genre Dropdown */}
                                            {showGenreDropdown && (
                                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredGenres.length > 0 ? (
                                                        filteredGenres.map((genre) => (
                                                            <button
                                                                key={genre.id}
                                                                type="button"
                                                                onClick={() => handleGenreSelect(genre)}
                                                                className="w-full px-3 py-2 text-left text-foreground hover:bg-muted/50 flex items-center justify-between"
                                                            >
                                                                <span>{genre.name}</span>
                                                                {selectedGenres.find(g => g.id === genre.id) && (
                                                                    <span className="text-primary text-sm">✓</span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-muted-foreground text-sm">
                                                            Không tìm thấy thể loại
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="edit-language" className="text-foreground font-medium">
                                            Ngôn ngữ *
                                        </Label>
                                        <Select
                                            value={formData.languageId}
                                            onValueChange={(value) => setFormData({...formData, languageId: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn ngôn ngữ"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {languages.length > 0 ? (
                                                    languages.map((lang) => (
                                                        <SelectItem key={lang.id} value={lang.id.toString()}>
                                                            {lang.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-muted-foreground text-sm">
                                                        Đang tải danh sách ngôn ngữ...
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="edit-country" className="text-foreground font-medium">
                                            Quốc gia *
                                        </Label>
                                        <Select
                                            value={formData.countryId}
                                            onValueChange={(value) => setFormData({...formData, countryId: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground">
                                                <SelectValue placeholder="Chọn quốc gia"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {countries.length > 0 ? (
                                                    countries.map((country) => (
                                                        <SelectItem key={country.id} value={country.id.toString()}>
                                                            {country.name}
                                                    </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-muted-foreground text-sm">
                                                        Đang tải danh sách quốc gia...
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="edit-status" className="text-foreground font-medium">
                                            Trạng thái *
                                        </Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: "UPCOMING" | "PLAYING" | "ENDED") =>
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
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="edit-releaseDate" className="text-foreground font-medium">
                                        Ngày phát hành *
                                    </Label>
                                    <Input
                                        id="edit-releaseDate"
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Film className="w-5 h-5 text-amber-600"/>
                                        <h3 className="font-semibold text-amber-800">Chỉnh sửa chi tiết</h3>
                                    </div>
                                    <p className="text-sm text-amber-700 mb-3">
                                        Để chỉnh sửa thông tin chi tiết như đạo diễn, diễn viên, mô tả... 
                                        hãy vào trang chi tiết phim.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setEditingMovie(null)
                                            resetForm()
                                            router.push(`/operator-manager/movies/${editingMovie?.id}`)
                                        }}
                                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                                    >
                                        <Film className="w-4 h-4 mr-2"/>
                                        Xem & Chỉnh sửa chi tiết
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingMovie(null)
                                        resetForm()
                                        setShowGenreDropdown(false)
                                        setGenreSearch("")
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
                                variant={sortField === "id" ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSort("id")}
                                className={
                                    sortField === "id"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "border-border text-foreground hover:bg-muted"
                                }
                            >
                                ID
                                {sortField === "id" &&
                                    (sortDirection === "asc" ? (
                                        <ArrowUp className="w-3 h-3 ml-1"/>
                                    ) : (
                                        <ArrowDown className="w-3 h-3 ml-1"/>
                                    ))}
                            </Button>
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
                                        <TableHead className="text-muted-foreground font-semibold w-16">ID</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Tên phim</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Thể loại</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Ngôn ngữ</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Quốc gia</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Ngày phát
                                            hành</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Nổi bật</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Trạng
                                            thái</TableHead>
                                        <TableHead className="text-muted-foreground font-semibold">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movies.map((movie) => {
                                        const statusBadge = getStatusBadge(movie.status)
                                        return (
                                            <TableRow key={movie.id}
                                                      className="border-border hover:bg-muted/30 transition-colors">
                                                <TableCell className="text-muted-foreground font-mono text-sm">
                                                    {movie.id}
                                                </TableCell>
                                                <TableCell
                                                    className="font-semibold text-foreground">{movie.name}</TableCell>
                                                <TableCell>{movie.genre.map(g => g.name).join(", ")}</TableCell>
                                                <TableCell
                                                    className="text-foreground">{movie.language?.name || "N/A"}</TableCell>
                                                <TableCell className="text-foreground">{movie.country?.name}</TableCell>
                                                <TableCell className="text-foreground">
                                                    {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={!!featuredByMovieId[movie.id]}
                                                        onCheckedChange={(checked) => handleToggleFeatured(movie.id, checked)}
                                                        aria-label="Đánh dấu phim nổi bật"
                                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                                                    />
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
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                if (e.ctrlKey || e.metaKey) {
                                                                    // Ctrl+Click hoặc Cmd+Click: mở tab mới
                                                                    window.open(`/operator-manager/movies/${movie.id}`, '_blank')
                                                                } else {
                                                                    // Click thường: mở trong tab hiện tại
                                                                    router.push(`/operator-manager/movies/${movie.id}`)
                                                                }
                                                            }}
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            title="Xem chi tiết (Ctrl+Click để mở tab mới)"
                                                        >
                                                            <Film className="w-4 h-4"/>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditDialog(movie)}
                                                            className="text-foreground hover:bg-muted"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil className="w-4 h-4"/>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setConfirmDeleteMovie(movie)}
                                                            className="text-destructive hover:bg-destructive/10"
                                                            title="Xóa"
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

            {/* Delete confirmation dialog */}
            <Dialog open={!!confirmDeleteMovie} onOpenChange={(open) => { if (!open) setConfirmDeleteMovie(null) }}>
                <DialogContent className="bg-card text-card-foreground border-border max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg">Xác nhận xoá</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-muted-foreground">
                            Bạn có chắc muốn xoá phim <strong>{confirmDeleteMovie?.name}</strong> (ID: {confirmDeleteMovie?.id}) không?
                            Hành động này không thể hoàn tác.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteMovie(null)}
                            className="border-border text-foreground hover:bg-muted"
                            disabled={isDeleting}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Đang xoá..." : "Xác nhận xoá"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
