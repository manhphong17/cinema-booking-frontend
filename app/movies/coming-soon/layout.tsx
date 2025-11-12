import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Phim sắp chiếu',
    description: 'Khám phá các bộ phim sắp ra mắt tại PHT Cinema. Đặt vé trước để nhận ưu đãi đặc biệt.',
}

export default function ComingSoonLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

