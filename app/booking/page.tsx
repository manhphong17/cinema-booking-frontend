"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { useSearchParams } from "next/navigation"
import ShowtimeSelectionPage from "@/components/booking/showtime-selection-page"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const movieId = searchParams.get("movieId")

  return (
    <HomeLayout>
      <ShowtimeSelectionPage movieId={movieId} />
    </HomeLayout>
  )
}
