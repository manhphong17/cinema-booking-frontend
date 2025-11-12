import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Quản lý kinh doanh',
    description: 'Trang quản lý kinh doanh hệ thống PHT Cinema.',
}

export default function BusinessManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

