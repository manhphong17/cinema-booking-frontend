"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Movie } from "@/type/movie"
import { apiClient } from "../../../src/api/interceptor"
import { MovieDetail } from "@/components/movie/movie-detail"

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get(`/movies/${params.id}`)
        
        if (response.data?.status === 200 && response.data?.data) {
          setMovie(response.data.data)
        } else {
          setError("Không thể tải thông tin phim")
        }
      } catch (err: any) {
        console.error("Error fetching movie details:", err)
        if (err.response?.status === 404) {
          setError("Không tìm thấy phim")
        } else {
          setError("Đã xảy ra lỗi khi tải thông tin phim")
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchMovieDetails()
    }
  }, [params.id])

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Đang tải thông tin phim...</p>
          </div>
        </div>
      </HomeLayout>
    )
  }

  if (error || !movie) {
    return (
      <HomeLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy phim</h1>
            <p className="text-muted-foreground mb-6">{error || "Phim không tồn tại"}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>
        </div>
      </HomeLayout>
    )
  }

  return (
    <HomeLayout>
      <MovieDetail movie={movie} onBack={() => router.back()} />
    </HomeLayout>
  )
}
