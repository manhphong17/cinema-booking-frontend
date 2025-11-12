import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Chi tiết phim',
    description: 'Xem thông tin chi tiết về phim, lịch chiếu và đặt vé ngay tại PHT Cinema.',
}

export default function MovieDetailLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

