import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Trang chủ',
    description: 'Khám phá các bộ phim đang chiếu và sắp chiếu tại PHT Cinema. Đặt vé ngay để trải nghiệm điện ảnh đẳng cấp.',
}

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

