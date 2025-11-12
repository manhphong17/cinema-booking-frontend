import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Phim đang chiếu',
    description: 'Xem các bộ phim đang chiếu tại PHT Cinema. Đặt vé ngay để không bỏ lỡ những bộ phim hay nhất.',
}

export default function NowShowingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

