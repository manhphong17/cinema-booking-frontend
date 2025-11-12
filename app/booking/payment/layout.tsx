import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Thanh toán',
    description: 'Thanh toán đơn hàng đặt vé xem phim tại PHT Cinema.',
}

export default function PaymentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

