"use client"

import {useRouter} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {MovieManagement} from "@/components/operator/movie-management";

export default function MoviePage() {
    return (
        <OperatorLayout>
            <MovieManagement/>
        </OperatorLayout>
    )
}