"use client"

import {useRouter, useParams} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {MovieDetail} from "@/components/operator/movie-detail"

export default function MovieDetailPage() {
    const params = useParams()
    const movieId = params.id as string

    return (
        <OperatorLayout>
            <MovieDetail movieId={movieId} />
        </OperatorLayout>
    )
}
