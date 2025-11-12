import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Đặt vé',
    description: 'Đặt vé xem phim tại PHT Cinema. Chọn suất chiếu, ghế ngồi và thanh toán dễ dàng.',
}

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

