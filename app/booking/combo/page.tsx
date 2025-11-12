"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { useSearchParams } from "next/navigation"
import ConcessionSelectionPage from "@/components/booking/concession-selection-page"

export default function ComboSelectionPage() {
  const searchParams = useSearchParams()
  const showtimeId = searchParams.get('showtimeId')

  return (
    <HomeLayout>
      <ConcessionSelectionPage
        showtimeId={showtimeId}
      />
    </HomeLayout>
  )
}
