import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Thông tin cá nhân',
    description: 'Quản lý thông tin cá nhân và lịch sử đặt vé của bạn tại PHT Cinema.',
}

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

