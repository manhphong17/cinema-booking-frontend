import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Quản trị viên',
    description: 'Trang quản trị hệ thống PHT Cinema.',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

