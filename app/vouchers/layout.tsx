import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Voucher',
    description: 'Khám phá các voucher và ưu đãi đặc biệt tại PHT Cinema.',
}

export default function VouchersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

