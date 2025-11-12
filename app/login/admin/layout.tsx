import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Đăng nhập Admin',
    description: 'Đăng nhập vào hệ thống quản lý PHT Cinema cho nhân viên và quản trị viên.',
}

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

