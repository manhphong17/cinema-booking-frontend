"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { useSearchParams } from "next/navigation"
import BookingSelectionPage from "@/components/booking/booking-selection-page"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const movieId = searchParams.get("movieId")

  return (
    <HomeLayout>
      <BookingSelectionPage movieId={movieId} />
    </HomeLayout>
  )
}
