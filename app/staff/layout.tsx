import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Nhân viên',
    description: 'Trang cho nhân viên quầy PHT Cinema.',
}

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

