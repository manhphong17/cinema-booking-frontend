"use client"

import {useRouter} from "next/navigation"
import {OperatorLayout} from "@/components/layouts/operator-layout"
import {MovieManagement} from "@/components/operator/movie-management";
import {NewsManagement} from "@/components/operator/news-management";

export default function NewsPage() {
    return (
        <OperatorLayout>
            <NewsManagement/>
        </OperatorLayout>
    )
}