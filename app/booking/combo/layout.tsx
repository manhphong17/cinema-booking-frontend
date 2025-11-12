import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Chọn combo',
    description: 'Chọn combo bắp nước và đồ ăn nhẹ cho buổi xem phim tại PHT Cinema.',
}

export default function ComboLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

