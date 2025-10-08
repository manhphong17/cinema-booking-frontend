"use client"

import {useRouter, useParams} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {MovieDetail} from "@/components/operator/movie-detail"

export default function MovieDetailPage() {
    const params = useParams()
    const movieId = params.id as string

    console.log("MovieDetailPage - params:", params)
    console.log("MovieDetailPage - movieId:", movieId)

    if (!movieId) {
        return (
            <OperatorLayout>
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
                        <p className="text-muted-foreground">Không tìm thấy ID phim trong URL</p>
                    </div>
                </div>
            </OperatorLayout>
        )
    }

    return (
        <OperatorLayout>
            <MovieDetail movieId={movieId} />
        </OperatorLayout>
    )
}
