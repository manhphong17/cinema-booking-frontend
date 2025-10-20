"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {createPortal} from "react-dom"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    ArrowLeft,
    Calendar,
    Clock,
    Edit,
    Film,
    Globe,
    Loader2,
    MessageSquare,
    Save,
    Star,
    Upload,
    Users,
    Video,
    X
} from "lucide-react"
import {toast} from "sonner"
import Image from "next/image"
import {useRouter} from "next/navigation"
import Link from "next/link"
import {apiClient} from "../../src/api/interceptor"
import {useAuthGuard} from "../../src/api/auth-guard"


interface Movie {
    id: number
    actor: string
    description: string
    director: string
    name: string
    posterUrl: string
    bannerUrl?: string
    releaseDate: string
    trailerUrl?: string
    status: "UPCOMING" | "PLAYING" | "ENDED"
    country: { id: number; name: string }
    language: { id: number; name: string }
    genre: { id: number; name: string }[]
    ageRating?: number
    duration?: number
}

interface MovieDetailProps {
    movieId: string
}

export function MovieDetail({ movieId }: MovieDetailProps) {
    const router = useRouter()
    const [movie, setMovie] = useState<Movie | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check auth on component mount
    useAuthGuard()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [genres, setGenres] = useState<{id: number; name: string}[]>([])
    const [languages, setLanguages] = useState<{id: number; name: string}[]>([])
    const [countries, setCountries] = useState<{id: number; name: string}[]>([])
    const [selectedGenres, setSelectedGenres] = useState<{id: number; name: string}[]>([])
    const [genreSearch, setGenreSearch] = useState("")
    const [showGenreDropdown, setShowGenreDropdown] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const [posterFile, setPosterFile] = useState<File | null>(null)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [posterPreview, setPosterPreview] = useState<string>("")
    const [bannerPreview, setBannerPreview] = useState<string>("")

    const [formData, setFormData] = useState({
        name: "",
        director: "",
        actor: "",
        description: "",
        posterUrl: "",
        bannerUrl: "",
        trailerUrl: "",
        releaseDate: "",
        status: "" as Movie["status"],
        countryId: "",
        languageId: "",
        genreIds: [] as number[],
        ageRating: "",
        duration: "",
    })

    const fetchGenres = async () => {
        try {
            const response = await apiClient.get('/movies/movie-genres')
            setGenres(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch genres:", error)
        }
    }

    const fetchLanguages = async () => {
        try {
            const response = await apiClient.get('/movies/languages')
            setLanguages(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch languages:", error)
        }
    }

    const fetchCountries = async () => {
        try {
            const response = await apiClient.get('/movies/countries')
            setCountries(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch countries:", error)
        }
    }

    // Filter genres based on search
    const filteredGenres = genres.filter(genre =>
        genre.name.toLowerCase().includes(genreSearch.toLowerCase())
    )

    // Calculate dropdown position
    const updateDropdownPosition = () => {
        const inputElement = document.querySelector('.genre-dropdown-container input')
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            })
        }
    }

    // Handle genre selection
    const handleGenreSelect = (genre: {id: number; name: string}) => {
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

    const fetchMovie = async () => {
        setIsLoading(true)
        try {
            console.log("Fetching movie with ID:", movieId)

            const response = await apiClient.get(`/movies/${movieId}`)
            console.log("Movie data received:", response.data)

            if (!response.data.data) {
                throw new Error("Dữ liệu phim không hợp lệ")
            }

            setMovie(response.data.data)

            // Set selected genres from movie data
            const movieGenres = response.data.data.genre || []
            setSelectedGenres(movieGenres)

            // Populate form data
            setFormData({
                name: response.data.data.name || "",
                director: response.data.data.director || "",
                actor: response.data.data.actor || "",
                description: response.data.data.description || "",
                posterUrl: response.data.data.posterUrl || "",
                bannerUrl: response.data.data.bannerUrl || "",
                trailerUrl: response.data.data.trailerUrl || "",
                releaseDate: response.data.data.releaseDate || "",
                status: response.data.data.status || "UPCOMING",
                countryId: response.data.data.country?.id?.toString() || "",
                languageId: response.data.data.language?.id?.toString() || "",
                genreIds: movieGenres.map((g: {id: number; name: string}) => g.id),
                ageRating: response.data.data.ageRating?.toString() || "",
                duration: response.data.data.duration?.toString() || "",
            })
        } catch (error) {
            console.error("Error fetching movie:", error)
            toast.error(`Không thể tải thông tin phim (ID: ${movieId}). Vui lòng kiểm tra lại.`)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (movieId) {
            const loadData = async () => {
                await Promise.all([
                    fetchGenres(),
                    fetchLanguages(),
                    fetchCountries(),
                    fetchMovie()
                ])
            }
            loadData()
        }
    }, [movieId])

    // Close genre dropdown when clicking outside and update position on scroll
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.genre-dropdown-container') && !target.closest('[data-genre-dropdown]')) {
                setShowGenreDropdown(false)
            }
        }

        const handleScroll = () => {
            if (showGenreDropdown) {
                updateDropdownPosition()
            }
        }

        if (showGenreDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
            window.addEventListener('scroll', handleScroll, true)
            window.addEventListener('resize', handleScroll)
            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
                window.removeEventListener('scroll', handleScroll, true)
                window.removeEventListener('resize', handleScroll)
            }
        }
    }, [showGenreDropdown])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'banner') => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WebP)")
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                if (type === 'poster') {
                    setPosterPreview(reader.result as string)
                } else {
                    setBannerPreview(reader.result as string)
                }
            }
            reader.readAsDataURL(file)

            if (type === 'poster') {
                setPosterFile(file)
            } else {
                setBannerFile(file)
            }
        }
    }

    const removePosterPreview = () => {
        setPosterPreview("")
        setPosterFile(null)
    }

    const removeBannerPreview = () => {
        setBannerPreview("")
        setBannerFile(null)
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        // Reset form data to original movie data
        if (movie) {
            const movieGenres = movie.genre || []
            setSelectedGenres(movieGenres)
            setFormData({
                name: movie.name || "",
                director: movie.director || "",
                actor: movie.actor || "",
                description: movie.description || "",
                posterUrl: movie.posterUrl || "",
                bannerUrl: movie.bannerUrl || "",
                trailerUrl: movie.trailerUrl || "",
                releaseDate: movie.releaseDate || "",
                status: movie.status || "UPCOMING",
                countryId: movie.country?.id?.toString() || "",
                languageId: movie.language?.id?.toString() || "",
                genreIds: movieGenres.map((g: {id: number; name: string}) => g.id),
                ageRating: movie.ageRating?.toString() || "",
                duration: movie.duration?.toString() || "",
            })
        }
        // Reset poster and banner file and preview
        setPosterFile(null)
        setBannerFile(null)
        setPosterPreview("")
        setBannerPreview("")
        setShowGenreDropdown(false)
        setGenreSearch("")
    }

    //nhúng trailer url
    function toEmbedUrl(url: string): string {
        if (!url) return ""

        // YouTube
        if (url.includes("youtube.com/watch?v=")) {
            return url.replace("watch?v=", "embed/")
        }

        // youtu.be short link
        if (url.includes("youtu.be/")) {
            return url.replace("youtu.be/", "www.youtube.com/embed/")
        }

        // Vimeo
        if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
            return url.replace("vimeo.com/", "player.vimeo.com/video/")
        }

        return url // Nếu đã đúng dạng hoặc là loại khác
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            console.log("Saving movie with ID:", movieId)
            console.log("Form data:", formData)
            console.log("Has poster file:", !!posterFile)
            console.log("Has banner file:", !!bannerFile)

            // If there's a poster or banner file, use FormData for file upload

                const formDataToSend = new FormData()

                // Add basic movie data (ID comes from URL path)
                formDataToSend.append("director", formData.director)
                formDataToSend.append("actor", formData.actor)
                formDataToSend.append("description", formData.description)
                if (formData.trailerUrl && formData.trailerUrl.trim() !== "") {
                    formDataToSend.append("trailerUrl", formData.trailerUrl)
                }
                formDataToSend.append("releaseDate", formData.releaseDate)
                formDataToSend.append("status", formData.status)
                if (formData.ageRating && formData.ageRating.trim() !== "") {
                    formDataToSend.append("ageRating", formData.ageRating)
                }
                if (formData.duration && formData.duration.trim() !== "") {
                    formDataToSend.append("duration", formData.duration)
                }

                // Add IDs
                if (formData.countryId) {
                    formDataToSend.append("countryId", formData.countryId)
                }
                if (formData.languageId) {
                    formDataToSend.append("languageId", formData.languageId)
                }

                // Add genre IDs as Long values
                formData.genreIds.forEach(genreId => {
                    formDataToSend.append("genreIds", genreId.toString())
                })

                // Add poster file with correct field name
                if (posterFile) {
                    formDataToSend.append("poster", posterFile)
                }

                // Add banner file with correct field name
                if (bannerFile) {
                    formDataToSend.append("banner", bannerFile)
                }

                console.log("Sending FormData update to:", `/movies/update-full/${movieId}`)
                const response = await apiClient.put(`/movies/update-full/${movieId}`, formDataToSend, {
                })

                console.log("FormData update response:", response.data)

            toast.success("Cập nhật phim thành công")
            setIsEditing(false)
            setPosterFile(null)
            setBannerFile(null)
            setPosterPreview("")
            setBannerPreview("")
            setShowGenreDropdown(false)
            setGenreSearch("")
            await fetchMovie() // Reload movie data
        } catch (error) {
            toast.error("Không thể cập nhật phim. Vui lòng thử lại.")
            console.error("Error updating movie:", error)
        } finally {
            setIsSaving(false)
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                <span className="ml-4 text-muted-foreground text-lg">Đang tải thông tin phim...</span>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Film className="w-10 h-10 text-muted-foreground"/>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy phim</h3>
                <p className="text-base text-muted-foreground max-w-md mb-6">
                    Phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                </p>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Quay lại
                </Button>
            </div>
        )
    }

    const statusBadge = getStatusBadge(movie.status)

    return (
        <div className="space-y-6 overflow-visible">
            {/* Header navigation ở đầu trang */}
            <div className="flex items-center justify-between px-6 md:px-12 lg:px-20">
                <div className="flex items-center gap-4">
                    <Link href="/operator-manager/movies">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground hover:bg-muted"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Quay lại
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">{movie.name}</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            {isEditing ? "Chỉnh sửa thông tin phim" : "Chi tiết thông tin phim"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">ID: {movie.id}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground hover:bg-muted"
                            >
                                <X className="w-4 h-4 mr-2"/>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2"/>
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleEdit}
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Edit className="w-4 h-4 mr-2"/>
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 md:px-12 lg:px-20 overflow-visible">
                {/* Poster và thông tin cơ bản */}
                <div className="lg:col-span-1">
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="relative">
                                <Image
                                    src={posterPreview || movie.posterUrl || "/placeholder.svg"}
                                    alt={movie.name}
                                    width={300}
                                    height={450}
                                    className="w-full rounded-lg object-cover shadow-lg border-2 border-border"
                                />
                                <div className="absolute top-4 right-4">
                                    <Badge
                                        variant={statusBadge.variant}
                                        className={statusBadge.className}
                                    >
                                        {statusBadge.label}
                                    </Badge>
                                </div>

                                {isEditing && (
                                    <div className="absolute bottom-4 left-4 right-4 z-50">
                                        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/10">
                                            <div className="flex gap-2">
                                                <Input
                                                    id="poster-file"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'poster')}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("poster-file")?.click()}
                                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                                                >
                                                    <Upload className="w-4 h-4 mr-2"/>
                                                    Chọn ảnh mới
                                                </Button>
                                                {posterFile && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={removePosterPreview}
                                                        className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30 backdrop-blur-sm"
                                                    >
                                                        <X className="w-4 h-4 mr-2"/>
                                                        Hủy
                                                    </Button>
                                                )}
                                            </div>
                                            {posterFile && (
                                                <p className="text-xs text-white/90 mt-1 font-medium">
                                                    {posterFile.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm text-muted-foreground">Ngày phát hành:</span>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={formData.releaseDate}
                                            onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                                            className="text-sm h-8 w-32"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-foreground">
                                            {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm text-muted-foreground">Thời lượng:</span>
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                                className="text-sm h-8 w-20"
                                                placeholder="0"
                                            />
                                            <span className="text-xs text-muted-foreground">phút</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-foreground">
                                            {movie.duration ? `${movie.duration} phút` : "Chưa cập nhật"}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Độ tuổi:</span>

                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.ageRating}
                                            onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                                            className="text-sm h-8 w-20"
                                            placeholder="0"
                                            min="0"
                                        />
                                    ) : movie.ageRating !== undefined && movie.ageRating !== null ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                        >
                                            {movie.ageRating}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Chưa cập nhật</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Banner Card */}
                <div className="lg:col-span-2">
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Film className="w-6 h-6"/>
                            Banner phim
                        </h2>
                        <div className="relative">
                            <Image
                                src={bannerPreview || movie.bannerUrl || "/placeholder-banner.jpg"}
                                alt={`${movie.name} - Banner`}
                                width={800}
                                height={300}
                                className="w-full h-48 md:h-64 rounded-lg object-cover shadow-lg border-2 border-border"
                            />
                            {isEditing && (
                                <div className="absolute bottom-4 left-4 right-4 z-50">
                                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/10">
                                        <div className="flex gap-2">
                                            <Input
                                                id="banner-file"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'banner')}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => document.getElementById("banner-file")?.click()}
                                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                                            >
                                                <Upload className="w-4 h-4 mr-2"/>
                                                Chọn banner mới
                                            </Button>
                                            {bannerFile && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={removeBannerPreview}
                                                    className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30 backdrop-blur-sm"
                                                >
                                                    <X className="w-4 h-4 mr-2"/>
                                                    Hủy
                                                </Button>
                                            )}
                                        </div>
                                        {bannerFile && (
                                            <p className="text-xs text-white/90 mt-1 font-medium">
                                                {bannerFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Mô tả - Di chuyển xuống dưới banner */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl mt-6">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6"/>
                            Mô tả
                        </h2>

                        {isEditing ? (
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Nhập mô tả phim..."
                                className="min-h-32"
                            />
                        ) : (
                            <p className="text-foreground leading-relaxed text-lg">
                                {movie.description || "Chưa có mô tả cho phim này."}
                            </p>
                        )}
                    </Card>
                </div>

                {/* Các phần khác - span 3 cột */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Thông tin cơ bản */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Film className="w-6 h-6"/>
                            Thông tin cơ bản
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm font-medium text-muted-foreground">Đạo diễn:</span>
                                </div>
                                {isEditing ? (
                                    <Input
                                        value={formData.director}
                                        onChange={(e) => setFormData({...formData, director: e.target.value})}
                                        placeholder="Nhập tên đạo diễn"
                                        className="text-sm"
                                    />
                                ) : (
                                    <p className="text-foreground">{movie.director || "Chưa cập nhật"}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm font-medium text-muted-foreground">Diễn viên:</span>
                                </div>
                                {isEditing ? (
                                    <Input
                                        value={formData.actor}
                                        onChange={(e) => setFormData({...formData, actor: e.target.value})}
                                        placeholder="Nhập tên diễn viên (ngăn cách bằng dấu phẩy)"
                                        className="text-sm"
                                    />
                                ) : (
                                    <p className="text-foreground">{movie.actor || "Chưa cập nhật"}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm font-medium text-muted-foreground">Quốc gia:</span>
                                </div>
                                {isEditing ? (
                                    <Select
                                        value={formData.countryId}
                                        onValueChange={(value) => setFormData({...formData, countryId: value})}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Chọn quốc gia"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-foreground">{movie.country?.name || "Chưa cập nhật"}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm font-medium text-muted-foreground">Ngôn ngữ:</span>
                                </div>
                                {isEditing ? (
                                    <Select
                                        value={formData.languageId}
                                        onValueChange={(value) => setFormData({...formData, languageId: value})}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Chọn ngôn ngữ"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map((lang) => (
                                                <SelectItem key={lang.id} value={lang.id.toString()}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-foreground">{movie.language?.name || "Chưa cập nhật"}</p>
                                )}
                            </div>

                            {/* Thêm: Phần Status */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="w-4 h-4 text-muted-foreground" variant="outline">
                                        S
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
                                </div>
                                {isEditing ? (
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({...formData, status: value as Movie["status"]})}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Chọn trạng thái"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UPCOMING">Sắp chiếu</SelectItem>
                                            <SelectItem value="PLAYING">Đang chiếu</SelectItem>
                                            <SelectItem value="ENDED">Đã kết thúc</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge
                                        variant={statusBadge.variant}
                                        className={statusBadge.className}
                                    >
                                        {statusBadge.label}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Thể loại */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl overflow-visible">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Star className="w-6 h-6"/>
                            Thể loại
                        </h2>

                        {isEditing ? (
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
                                            updateDropdownPosition()
                                            setShowGenreDropdown(true)
                                        }}
                                        onFocus={() => {
                                            updateDropdownPosition()
                                            setShowGenreDropdown(true)
                                        }}
                                        className="bg-input border-border text-foreground"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {movie.genre && movie.genre.length > 0 ? (
                                    movie.genre.map((g) => (
                                        <Badge
                                            key={g.id}
                                            variant="outline"
                                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-lg px-3 py-1"
                                        >
                                            {g.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-lg">Chưa cập nhật</p>
                                )}
                            </div>

                        )}
                    </Card>

                    {/* Trailer */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Video className="w-6 h-6"/>
                            Trailer
                        </h2>

                        {isEditing ? (
                            <div className="space-y-3">
                                <Label htmlFor="trailerUrl" className="text-sm font-medium text-muted-foreground">
                                    URL Trailer (YouTube, Vimeo...)
                                </Label>
                                <Input
                                    id="trailerUrl"
                                    value={formData.trailerUrl}
                                    onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="text-sm"
                                />
                                {formData.trailerUrl && (
                                    <div className="aspect-video rounded-lg overflow-hidden">
                                        <iframe
                                            src={toEmbedUrl(formData.trailerUrl)}
                                            title={`${movie.name} - Trailer`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            movie.trailerUrl ? (
                                <div className="aspect-video rounded-lg overflow-hidden">
                                    <iframe
                                        src={toEmbedUrl(movie.trailerUrl)}
                                        title={`${movie.name} - Trailer`}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Chưa có trailer cho phim này.</p>
                            )
                        )}
                    </Card>
                </div>
            </div>

            {/* Genre Dropdown Portal */}
            {showGenreDropdown && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[99999] pointer-events-none"
                    onClick={() => setShowGenreDropdown(false)}
                >
                    <div
                        data-genre-dropdown
                        className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl max-h-60 overflow-y-auto pointer-events-auto"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            minWidth: '200px'
                        }}
                    >
                        {filteredGenres.length > 0 ? (
                            filteredGenres.map((genre) => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    onClick={() => handleGenreSelect(genre)}
                                    className="w-full px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                >
                                    <span className="font-medium">{genre.name}</span>
                                    {selectedGenres.find(g => g.id === genre.id) && (
                                        <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">✓</span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                                Không tìm thấy thể loại
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}