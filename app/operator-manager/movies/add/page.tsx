"use client"

import {AdminLayout} from "@/components/layouts/admin-layout"
import {AddMovieForm} from "@/components/operator/add-movie-form"

export default function AddMoviePage() {
    return (
        <AdminLayout activeSection="movies" onSectionChange={() => {}}>
            <AddMovieForm/>
        </AdminLayout>
    )
}
