"use client"

import {useRouter, useParams} from "next/navigation"
import {AdminLayout} from "@/components/layouts/admin-layout"
import {MovieDetail} from "@/components/operator/movie-detail"

export default function MovieDetailPage() {
    const params = useParams()
    const movieId = params.id as string

    return (
        <AdminLayout activeSection="movies" onSectionChange={() => {}}>
            <MovieDetail movieId={movieId} />
        </AdminLayout>
    )
}
