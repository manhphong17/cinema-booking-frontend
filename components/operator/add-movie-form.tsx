"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {
    ArrowLeft,
    Film,
    Loader2,
    Upload,
    X,
    Clock,
    Star,
    Users,
    Video
} from "lucide-react"
import {toast} from "sonner"
import Image from "next/image"
import {apiClient} from "../../src/api/interceptor"

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

export function AddMovieForm() {
    const router = useRouter()
    const [genres, setGenres] = useState<Genre[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [countries, setCountries] = useState<Country[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [posterPreview, setPosterPreview] = useState<string>("")
    const [posterFile, setPosterFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        genreIds: [] as number[],
        languageId: "",
        duration: "",
        releaseDate: "",
        description: "",
        director: "",
        actor: "",
        ageRating: "",
        countryId: "",
        trailerUrl: "",
    })

    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
    const [genreSearch, setGenreSearch] = useState("")
    const [showGenreDropdown, setShowGenreDropdown] = useState(false)

    const fetchGenres = async () => {
        try {
            const response = await apiClient.get('/movies/movie-genres')
            setGenres(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch genres:", error)
        }
    }

    // Filter genres based on search
    const filteredGenres = genres.filter(genre =>
        genre.name.toLowerCase().includes(genreSearch.toLowerCase())
    )

    // Handle genre selection
    const handleGenreSelect = (genre: Genre) => {
        if (!selectedGenres.find(g => g.id === genre.id)) {
            const newSelectedGenres = [...selectedGenres, genre]
            const newGenreIds = newSelectedGenres.map(g => g.id)
            setSelectedGenres(newSelectedGenres)
            setFormData({
                ...formData,
                genreIds: newGenreIds
            })
            console.log("Genre selected:", genre.name, "New genre IDs:", newGenreIds)
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
        console.log("Genre removed:", genreId, "New genre IDs:", newGenreIds)
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

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([
                fetchGenres(),
                fetchLanguages(),
                fetchCountries()
            ])
            setIsLoading(false)
        }
        loadData()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check file type - match backend validation exactly
            const allowedTypes = ['image/jpeg', 'image/png']
            if (!allowedTypes.includes(file.type)) {
                toast.error("Vui lòng chọn file ảnh hợp lệ (JPEG, PNG)")
                return
            }

            // Check file size (max 5MB)
            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                toast.error("Kích thước file không được vượt quá 5MB")
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
    }

    const validateForm = () => {
        if (!formData.name || !formData.name.trim()) {
            toast.error("Vui lòng nhập tên phim")
            return false
        }
        if (formData.name.length<2 ||formData.name.length>200 ) {
            toast.error("Độ dài tên phim phải từ 2 đến 200 kí tự")
            return false
        }

        if (!formData.genreIds || !Array.isArray(formData.genreIds) || formData.genreIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một thể loại")
            return false
        }
        if (!formData.languageId || formData.languageId === "") {
            toast.error("Vui lòng chọn ngôn ngữ")
            return false
        }
        if (!formData.releaseDate || formData.releaseDate === "") {
            toast.error("Vui lòng chọn ngày phát hành")
            return false
        }
        if (!formData.countryId || formData.countryId === "") {
            toast.error("Vui lòng chọn quốc gia")
            return false
        }
        if (!formData.director || !formData.director.trim()) {
            toast.error("Vui lòng nhập tên đạo diễn")
            return false
        }
        if (!formData.actor || !formData.actor.trim()) {
            toast.error("Vui lòng nhập tên diễn viên")
            return false
        }

        if (formData.actor.length <1 || formData.actor.length >500) {
            toast.error("Tên diễn viên phải từ 1 đến 500 kí tự")
            return false
        }
        if (!formData.description || !formData.description.trim()) {
            toast.error("Vui lòng nhập mô tả phim")
            return false
        }
        if (formData.description.length < 1 || formData.description.length > 2000) {
            toast.error("Mô tả phim phải dưới 2000 ký tự")
            return false
        }

        if (!formData.duration || formData.duration === "" || parseInt(formData.duration) <= 0) {
            toast.error("Vui lòng nhập thời lượng phim hợp lệ")
            return false
        }
        if (!formData.ageRating || formData.ageRating === "") {
            toast.error("Vui lòng nhập độ tuổi")
            return false
        }
        if (!posterFile) {
            toast.error("Vui lòng chọn file poster")
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        // Additional validation before sending
        console.log("Current form data before processing:", formData)
        console.log("Selected genres before processing:", selectedGenres)

        setIsSaving(true)
        try {
            const formDataToSend = new FormData()

            // Ensure all required fields are properly formatted to match backend DTO
            const movieData = {
                name: formData.name?.trim() || "",
                description: formData.description?.trim() || "",
                duration: formData.duration ? parseInt(formData.duration) : null,
                releaseDate: formData.releaseDate || "",
                director: formData.director?.trim() || "",
                actor: formData.actor?.trim() || "",
                ageRating: formData.ageRating ? parseInt(formData.ageRating) : null,
                trailerUrl: formData.trailerUrl?.trim() || "",
                genreIds: Array.isArray(formData.genreIds) ? formData.genreIds.map(id => Number(id)) : [],
                languageId: formData.languageId ? parseInt(formData.languageId) : null,
                countryId: formData.countryId ? parseInt(formData.countryId) : null
            }

            // Validate that all required fields have values
            if (!movieData.name) {
                toast.error("Tên phim không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.languageId) {
                toast.error("Ngôn ngữ không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.countryId) {
                toast.error("Quốc gia không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.description || movieData.description.trim() === "") {
                toast.error("Mô tả không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.director) {
                toast.error("Đạo diễn không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.actor) {
                toast.error("Diễn viên không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.duration || movieData.duration <= 0) {
                toast.error("Thời lượng không hợp lệ")
                setIsSaving(false)
                return
            }
            if (!movieData.ageRating) {
                toast.error("Độ tuổi không được để trống")
                setIsSaving(false)
                return
            }
            if (!movieData.genreIds || movieData.genreIds.length === 0) {
                toast.error("Thể loại không được để trống")
                setIsSaving(false)
                return
            }

            // Handle regular fields - match backend DTO field order
            formDataToSend.append("name", movieData.name)
            formDataToSend.append("description", movieData.description)
            formDataToSend.append("duration", movieData.duration!.toString())
            formDataToSend.append("releaseDate", movieData.releaseDate)
            formDataToSend.append("director", movieData.director)
            formDataToSend.append("actor", movieData.actor)
            formDataToSend.append("ageRating", movieData.ageRating!.toString())
            formDataToSend.append("trailerUrl", movieData.trailerUrl)
            formDataToSend.append("languageId", movieData.languageId!.toString())
            formDataToSend.append("countryId", movieData.countryId!.toString())

            // Handle multiple genre IDs - ensure we always send at least one genre
            if (movieData.genreIds && movieData.genreIds.length > 0) {
                movieData.genreIds.forEach((id) => {
                    formDataToSend.append("genreIds", id.toString())
                })
            } else {
                // This should not happen due to validation, but just in case
                toast.error("Vui lòng chọn ít nhất một thể loại")
                setIsSaving(false)
                return
            }

            if (posterFile) {
                formDataToSend.append("poster", posterFile)
            } else {
                toast.error("Vui lòng chọn file poster")
                setIsSaving(false)
                return
            }
            const response = await apiClient.post('/movies/add', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log("Request successful with FormData:", response.data)

            if (response.data.status === 200) {
                toast.success("Thêm phim mới thành công")
                router.push("/operator-manager/movies")
            }
            else {
                throw new Error(response.data.message || "Failed to create movie")
            }
        } catch (error: any) {
            if(error.response.data.status ===409 ){
                toast.error("Phim đã tồn tại trong hệ thống.")
            }
            else{
                toast.error("Không thể thêm phim. Vui lòng thử lại.")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            genreIds: [],
            languageId: "",
            duration: "",
            releaseDate: "",
            description: "",
            director: "",
            actor: "",
            ageRating: "",
            countryId: "",
            trailerUrl: "",
        })
        setSelectedGenres([])
        setGenreSearch("")
        setShowGenreDropdown(false)
        setPosterPreview("")
        setPosterFile(null)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                <span className="ml-4 text-muted-foreground text-lg">Đang tải dữ liệu...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => router.push("/operator-manager/movies")}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">Thêm phim mới</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Tạo phim mới với đầy đủ thông tin chi tiết</p>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Poster & Basic Info */}
                <div className="space-y-6">
                    {/* Poster Section */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Film className="w-6 h-6 text-primary"/>
                                <h2 className="text-2xl font-semibold text-foreground">Poster phim</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                id="poster-file"
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById("poster-file")?.click()}
                                                className="border-primary text-primary hover:bg-primary/10"
                                            >
                                                <Upload className="w-4 h-4 mr-2"/>
                                                Chọn file poster
                                            </Button>
                                            {posterFile && (
                                                <span className="text-sm text-muted-foreground flex items-center">
                                                    {posterFile.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Chọn file ảnh poster (JPEG, PNG) - Kích thước khuyến nghị: 300x450px
                                        </p>
                                    </div>
                                </div>

                                {/* Poster Preview */}
                                <div className="flex justify-center">
                                    {posterPreview ? (
                                        <div className="relative group">
                                            <Image
                                                src={posterPreview}
                                                alt="Poster preview"
                                                width={300}
                                                height={450}
                                                className="rounded-lg object-cover shadow-2xl border-4 border-border transition-transform group-hover:scale-105"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={removePosterPreview}
                                                className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                                            >
                                                <X className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-72 h-108 bg-gradient-to-br from-muted/50 to-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                                            <div className="text-center text-muted-foreground">
                                                <Film className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                                                <p className="text-lg font-medium">Chưa có poster</p>
                                                <p className="text-sm">Chọn file để xem trước</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Basic Info */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-6 h-6 text-primary"/>
                                <h2 className="text-2xl font-semibold text-foreground">Thông tin cơ bản</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="name" className="text-foreground font-medium text-lg">
                                        Tên phim *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            console.log("Name input changed:", e.target.value)
                                            setFormData({...formData, name: e.target.value})
                                        }}
                                        className="bg-input border-border text-foreground h-12 text-lg"
                                        placeholder="Nhập tên phim"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label className="text-foreground font-medium">
                                            Thể loại *
                                        </Label>

                                        {/* Selected Genres Display */}
                                        {selectedGenres.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {selectedGenres.map((genre) => (
                                                    <Badge
                                                        key={genre.id}
                                                        variant="secondary"
                                                        className="bg-primary/10 text-primary border-primary/20 px-3 py-1"
                                                    >
                                                        {genre.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleGenreRemove(genre.id)}
                                                            className="ml-2 hover:text-red-500"
                                                        >
                                                            <X className="w-3 h-3"/>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Genre Search Input */}
                                        <div className="relative">
                                            <Input
                                                placeholder="Tìm kiếm thể loại..."
                                                value={genreSearch}
                                                onChange={(e) => {
                                                    setGenreSearch(e.target.value)
                                                    setShowGenreDropdown(true)
                                                }}
                                                onFocus={() => setShowGenreDropdown(true)}
                                                className="bg-input border-border text-foreground h-12"
                                            />

                                            {/* Dropdown */}
                                            {showGenreDropdown && (
                                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredGenres.length > 0 ? (
                                                        filteredGenres.map((genre) => (
                                                            <button
                                                                key={genre.id}
                                                                type="button"
                                                                onClick={() => handleGenreSelect(genre)}
                                                                className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                                                                disabled={selectedGenres.some(g => g.id === genre.id)}
                                                            >
                                                                <span>{genre.name}</span>
                                                                {selectedGenres.some(g => g.id === genre.id) && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Đã chọn
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-muted-foreground text-sm">
                                                            Không tìm thấy thể loại
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Click outside to close dropdown */}
                                        {showGenreDropdown && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowGenreDropdown(false)}
                                            />
                                        )}
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="language" className="text-foreground font-medium">
                                            Ngôn ngữ *
                                        </Label>
                                        <Select
                                            value={formData.languageId}
                                            onValueChange={(value) => {
                                                console.log("Language selected:", value)
                                                setFormData({...formData, languageId: value})
                                            }}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground h-12">
                                                <SelectValue placeholder="Chọn ngôn ngữ"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {languages.map((lang) => (
                                                    <SelectItem key={lang.id} value={lang.id.toString()}>
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="country" className="text-foreground font-medium">
                                        Quốc gia *
                                    </Label>
                                    <Select
                                        value={formData.countryId}
                                        onValueChange={(value) => {
                                            console.log("Country selected:", value)
                                            setFormData({...formData, countryId: value})
                                        }}
                                    >
                                        <SelectTrigger className="bg-input border-border text-foreground h-12">
                                            <SelectValue placeholder="Chọn quốc gia"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="releaseDate" className="text-foreground font-medium">
                                            Ngày phát hành *
                                        </Label>
                                        <Input
                                            id="releaseDate"
                                            type="date"
                                            value={formData.releaseDate}
                                            onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                                            className="bg-input border-border text-foreground h-12"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="space-y-6">
                    {/* Cast & Crew */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-6 h-6 text-primary"/>
                                <h2 className="text-2xl font-semibold text-foreground">Đạo diễn & Diễn viên</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="director" className="text-foreground font-medium text-lg">
                                        Đạo diễn *
                                    </Label>
                                    <Input
                                        id="director"
                                        value={formData.director}
                                        onChange={(e) => setFormData({...formData, director: e.target.value})}
                                        className="bg-input border-border text-foreground h-12 text-lg"
                                        placeholder="Nhập tên đạo diễn"
                                    />
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="actors" className="text-foreground font-medium text-lg">
                                        Diễn viên *
                                    </Label>
                                    <Input
                                        id="actors"
                                        value={formData.actor}
                                        onChange={(e) => setFormData({...formData, actor: e.target.value})}
                                        className="bg-input border-border text-foreground h-12 text-lg"
                                        placeholder="Nhập tên diễn viên (ngăn cách bằng dấu phẩy)"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Movie Details */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-6 h-6 text-primary"/>
                                <h2 className="text-2xl font-semibold text-foreground">Chi tiết phim</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="description" className="text-foreground font-medium text-lg">
                                        Mô tả phim *
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => {
                                            console.log("Description changed:", e.target.value)
                                            setFormData({...formData, description: e.target.value})
                                        }}
                                        className="bg-input border-border text-foreground min-h-32 text-lg"
                                        placeholder="Nhập mô tả phim..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="duration" className="text-foreground font-medium">
                                            Thời lượng (phút) *
                                        </Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                            className="bg-input border-border text-foreground h-12"
                                            placeholder="120"
                                            min="1"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="ageRating" className="text-foreground font-medium">
                                            Độ tuổi *
                                        </Label>
                                        <Input
                                            id="ageRating"
                                            type="number"
                                            value={formData.ageRating}
                                            onChange={(e) => setFormData({...formData, ageRating: e.target.value})}
                                            className="bg-input border-border text-foreground h-12"
                                            placeholder="Nhập độ tuổi (ví dụ: 13, 16, 18)"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Media URLs */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Video className="w-6 h-6 text-primary"/>
                                <h2 className="text-2xl font-semibold text-foreground">Media</h2>
                            </div>

                            <div className="space-y-4">

                                <div className="grid gap-3">
                                    <Label htmlFor="trailerUrl" className="text-foreground font-medium">
                                        URL Trailer
                                    </Label>
                                    <Input
                                        id="trailerUrl"
                                        value={formData.trailerUrl}
                                        onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                                        className="bg-input border-border text-foreground h-12"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Action Buttons */}
            <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                <div className="flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={resetForm}
                        className="border-border text-foreground hover:bg-muted h-12 px-8"
                    >
                        <X className="w-4 h-4 mr-2"/>
                        Đặt lại form
                    </Button>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/operator-manager/movies")}
                            className="border-border text-foreground hover:bg-muted h-12 px-8"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-lg font-semibold"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin"/>
                                    Đang thêm phim...
                                </>
                            ) : (
                                <>
                                    <Film className="w-5 h-5 mr-2"/>
                                    Thêm phim mới
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}