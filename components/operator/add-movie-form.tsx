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
    Calendar,
    Clock,
    Star,
    Users,
    Globe,
    MessageSquare,
    Video
} from "lucide-react"
import {toast} from "sonner"
import Image from "next/image"
import {apiClient} from "@/src/api/interceptor"

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

export function AddMovieForm() {
    const router = useRouter()
    const [genres, setGenres] = useState<Genre[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    
    const [posterPreview, setPosterPreview] = useState<string>("")
    const [posterFile, setPosterFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        genre: "",
        language: "",
        duration: "",
        releaseDate: "",
        description: "",
        poster: "",
        director: "",
        actors: "",
        ageRating: "",
        year: "",
        country: "",
        trailerUrl: "",
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

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([
                fetchGenres(),
                fetchLanguages()
            ])
            setIsLoading(false)
        }
        loadData()
    }, [])

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

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên phim")
            return false
        }
        if (!formData.genre) {
            toast.error("Vui lòng chọn thể loại")
            return false
        }
        if (!formData.language) {
            toast.error("Vui lòng chọn ngôn ngữ")
            return false
        }
        if (!formData.releaseDate) {
            toast.error("Vui lòng chọn ngày phát hành")
            return false
        }
        if (!formData.country) {
            toast.error("Vui lòng chọn quốc gia")
            return false
        }
        if (!formData.director.trim()) {
            toast.error("Vui lòng nhập tên đạo diễn")
            return false
        }
        if (!formData.actors.trim()) {
            toast.error("Vui lòng nhập tên diễn viên")
            return false
        }
        if (!formData.description.trim()) {
            toast.error("Vui lòng nhập mô tả phim")
            return false
        }
        if (!formData.duration || parseInt(formData.duration) <= 0) {
            toast.error("Vui lòng nhập thời lượng phim hợp lệ")
            return false
        }
        if (!formData.ageRating) {
            toast.error("Vui lòng chọn độ tuổi")
            return false
        }
        
        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return
        
        setIsSaving(true)
        try {
            const formDataToSend = new FormData()
            for (const [key, value] of Object.entries(formData)) {
                formDataToSend.append(key, value)
            }
            if (posterFile) formDataToSend.append("posterFile", posterFile)

            await apiClient.post('/movies', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })

            toast.success("Thêm phim mới thành công")
            router.push("/operator-manager/movies")
        } catch (error) {
            toast.error("Không thể thêm phim. Vui lòng thử lại.")
        } finally {
            setIsSaving(false)
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
            director: "",
            actors: "",
            ageRating: "",
            year: "",
            country: "",
            trailerUrl: "",
        })
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
                                                accept="image/*"
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
                                            Chọn file ảnh poster (JPG, PNG, WebP) - Kích thước khuyến nghị: 300x450px
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
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="bg-input border-border text-foreground h-12 text-lg"
                                        placeholder="Nhập tên phim"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="genre" className="text-foreground font-medium">
                                            Thể loại *
                                        </Label>
                                        <Select
                                            value={formData.genre}
                                            onValueChange={(value) => setFormData({...formData, genre: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground h-12">
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
                                            Ngôn ngữ *
                                        </Label>
                                        <Select
                                            value={formData.language}
                                            onValueChange={(value) => setFormData({...formData, language: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground h-12">
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

                                <div className="grid gap-3">
                                    <Label htmlFor="country" className="text-foreground font-medium">
                                        Quốc gia *
                                    </Label>
                                    <Select
                                        value={formData.country}
                                        onValueChange={(value) => setFormData({...formData, country: value})}
                                    >
                                        <SelectTrigger className="bg-input border-border text-foreground h-12">
                                            <SelectValue placeholder="Chọn quốc gia"/>
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
                                    <div className="grid gap-3">
                                        <Label htmlFor="year" className="text-foreground font-medium">
                                            Năm sản xuất
                                        </Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            className="bg-input border-border text-foreground h-12"
                                            placeholder="2024"
                                            min="1900"
                                            max="2030"
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
                                        value={formData.actors}
                                        onChange={(e) => setFormData({...formData, actors: e.target.value})}
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
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                                        <Select
                                            value={formData.ageRating}
                                            onValueChange={(value) => setFormData({...formData, ageRating: value})}
                                        >
                                            <SelectTrigger className="bg-input border-border text-foreground h-12">
                                                <SelectValue placeholder="Chọn độ tuổi"/>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                <SelectItem value="P">P - Mọi lứa tuổi</SelectItem>
                                                <SelectItem value="K">K - Trẻ em</SelectItem>
                                                <SelectItem value="T13">T13 - 13+</SelectItem>
                                                <SelectItem value="T16">T16 - 16+</SelectItem>
                                                <SelectItem value="T18">T18 - 18+</SelectItem>
                                                <SelectItem value="C">C - Cấm trẻ em</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                    <Label htmlFor="poster" className="text-foreground font-medium">
                                        URL Poster
                                    </Label>
                                    <Input
                                        id="poster"
                                        value={formData.poster}
                                        onChange={(e) => setFormData({...formData, poster: e.target.value})}
                                        className="bg-input border-border text-foreground h-12"
                                        placeholder="https://example.com/poster.jpg"
                                    />
                                </div>

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
