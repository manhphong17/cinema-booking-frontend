import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Tin tức',
    description: 'Cập nhật tin tức mới nhất về phim ảnh và các sự kiện tại PHT Cinema.',
}

export default function NewsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

