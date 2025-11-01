"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { useSearchParams } from "next/navigation"
import ConcessionSelectionPage from "@/components/booking/concession-selection-page"

export default function ComboSelectionPage() {
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const showtimeId = searchParams.get('showtimeId')
  const seats = searchParams.get('seats')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const hall = searchParams.get('hall')

  return (
    <HomeLayout>
      <ConcessionSelectionPage
        movieId={movieId}
        seats={seats}
        date={date}
        time={time}
        hall={hall}
        showtimeId={showtimeId}
      />
    </HomeLayout>
  )
}
