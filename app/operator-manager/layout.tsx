import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Quản lý vận hành',
    description: 'Trang quản lý vận hành hệ thống PHT Cinema.',
}

export default function OperatorManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
