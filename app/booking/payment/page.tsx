"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { useSearchParams } from "next/navigation"
import PaymentPage from "@/components/booking/payment-page"

export default function PaymentPageRoute() {
 const searchParams = useSearchParams()

  // Data từ trang trước
  const movieId = searchParams.get("movieId")
  const date = searchParams.get("date")
  const time = searchParams.get("time")
  const hall = searchParams.get("hall")
  const seats = searchParams.get("seats")
  const combosParam = searchParams.get("combos")
  const showtimeId = searchParams.get("showtimeId")


  return (
    <HomeLayout>
      <PaymentPage
        movieId={movieId}
        date={date}
        time={time}
        hall={hall}
        seats={seats}
        combosParam={combosParam}
        showtimeId={showtimeId}
      />
    </HomeLayout>
  )
}
