import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Chọn ghế',
    description: 'Chọn ghế ngồi ưa thích của bạn tại PHT Cinema.',
}

export default function SeatsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

