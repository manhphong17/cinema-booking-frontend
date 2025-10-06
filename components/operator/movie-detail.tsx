"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
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
            credentials: "include",
        })

        if (response.ok) {
            const data = await response.json()
            const newAccessToken = data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        } else {
            if (typeof window !== 'undefined') {
                const {toast} = await import("sonner")
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
                    duration: 3000,
                })

                setTimeout(() => {
                    localStorage.removeItem("accessToken")
                    window.location.href = "/login"
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
                window.location.href = "/login"
            }, 2000)
        }
        return null
    }
}

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem("accessToken")

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

interface MovieDetailProps {
    movieId: string
}

export function MovieDetail({ movieId }: MovieDetailProps) {
    const router = useRouter()
    const [movie, setMovie] = useState<Movie | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [genres, setGenres] = useState<{id: number; name: string}[]>([])
    const [languages, setLanguages] = useState<{id: number; name: string}[]>([])
    const [countries] = useState(["Vietnam", "USA", "Korea", "Japan", "China", "Thailand", "France", "UK"])
    const [ageRatings] = useState(["P", "K", "T13", "T16", "T18", "C"])
    const [posterFile, setPosterFile] = useState<File | null>(null)
    const [posterPreview, setPosterPreview] = useState<string>("")
    
    const [formData, setFormData] = useState({
        name: "",
        director: "",
        actor: "",
        description: "",
        posterUrl: "",
        trailerUrl: "",
        releaseDate: "",
        status: "" as Movie["status"],
        country: "",
        language: "",
        genre: "",
        ageRating: "",
        duration: "",
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

    const fetchMovie = async () => {
        setIsLoading(true)
        try {
            const response = await fetchWithAuth(`${BASE_URL}/movies/${movieId}`)
            if (!response.ok) throw new Error("Không thể tải thông tin phim")
            
            const data = await response.json()
            setMovie(data.data)
            
            // Populate form data
            setFormData({
                name: data.data.name || "",
                director: data.data.director || "",
                actor: data.data.actor || "",
                description: data.data.description || "",
                posterUrl: data.data.posterUrl || "",
                trailerUrl: data.data.trailerUrl || "",
                releaseDate: data.data.releaseDate || "",
                status: data.data.status || "UPCOMING",
                country: data.data.country?.name || "",
                language: data.data.language?.name || "",
                genre: data.data.genre?.[0]?.name || "",
                ageRating: data.data.ageRating || "",
                duration: data.data.duration?.toString() || "",
            })
        } catch (error) {
            toast.error("Không thể tải thông tin phim. Vui lòng thử lại.")
            console.error("Error fetching movie:", error)
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
                    fetchMovie()
                ])
            }
            loadData()
        }
    }, [movieId])

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
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        // Reset form data to original movie data
        if (movie) {
            setFormData({
                name: movie.name || "",
                director: movie.director || "",
                actor: movie.actor || "",
                description: movie.description || "",
                posterUrl: movie.posterUrl || "",
                trailerUrl: movie.trailerUrl || "",
                releaseDate: movie.releaseDate || "",
                status: movie.status || "UPCOMING",
                country: movie.country?.name || "",
                language: movie.language?.name || "",
                genre: movie.genre?.[0]?.name || "",
                ageRating: movie.ageRating || "",
                duration: movie.duration?.toString() || "",
            })
        }
        // Reset poster file and preview
        setPosterFile(null)
        setPosterPreview("")
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const formDataToSend = new FormData()
            
            // Add all form data
            for (const [key, value] of Object.entries(formData)) {
                formDataToSend.append(key, value)
            }
            
            // Add poster file if selected
            if (posterFile) {
                formDataToSend.append("posterFile", posterFile)
            }
            
            const response = await fetchWithAuth(`${BASE_URL}/movies/${movieId}`, {
                method: "PUT",
                body: formDataToSend,
            })
            
            if (!response.ok) throw new Error("Không thể cập nhật phim")
            
            toast.success("Cập nhật phim thành công")
            setIsEditing(false)
            setPosterFile(null)
            setPosterPreview("")
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
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
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("poster-file")?.click()}
                                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                                                        className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
                                                    >
                                                        <X className="w-4 h-4 mr-2"/>
                                                        Hủy
                                                    </Button>
                                                )}
                                            </div>
                                            {posterFile && (
                                                <p className="text-xs text-white/80 mt-1">
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
                                    <Star className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm text-muted-foreground">Độ tuổi:</span>
                                    {isEditing ? (
                                        <Select
                                            value={formData.ageRating}
                                            onValueChange={(value) => setFormData({...formData, ageRating: value})}
                                        >
                                            <SelectTrigger className="h-8 w-20 text-sm">
                                                <SelectValue placeholder="Chọn"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ageRatings.map((rating) => (
                                                    <SelectItem key={rating} value={rating}>
                                                        {rating}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        movie.ageRating ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                            >
                                                {movie.ageRating}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Chưa cập nhật</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Thông tin chi tiết */}
                <div className="lg:col-span-2 space-y-6">
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
                                        value={formData.country}
                                        onValueChange={(value) => setFormData({...formData, country: value})}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Chọn quốc gia"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country} value={country}>
                                                    {country}
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
                                        value={formData.language}
                                        onValueChange={(value) => setFormData({...formData, language: value})}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Chọn ngôn ngữ"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map((lang) => (
                                                <SelectItem key={lang.id} value={lang.name}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-foreground">{movie.language?.name || "Chưa cập nhật"}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Thể loại */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Star className="w-6 h-6"/>
                            Thể loại
                        </h2>
                        
                        {isEditing ? (
                            <Select
                                value={formData.genre}
                                onValueChange={(value) => setFormData({...formData, genre: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn thể loại"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {genres.map((genre) => (
                                        <SelectItem key={genre.id} value={genre.name}>
                                            {genre.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {movie.genre && movie.genre.length > 0 ? (
                                    movie.genre.map((g) => (
                                        <Badge
                                            key={g.id}
                                            variant="outline"
                                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                        >
                                            {g.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">Chưa cập nhật</p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Mô tả */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border p-6 shadow-xl">
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
                            <p className="text-foreground leading-relaxed">
                                {movie.description || "Chưa có mô tả cho phim này."}
                            </p>
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
                                            src={formData.trailerUrl}
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
                                        src={movie.trailerUrl}
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
        </div>
    )
}
