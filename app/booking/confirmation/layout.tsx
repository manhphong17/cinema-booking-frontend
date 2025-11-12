import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Xác nhận đặt vé',
    description: 'Xác nhận đơn hàng đặt vé xem phim tại PHT Cinema.',
}

export default function ConfirmationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

