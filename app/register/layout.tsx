import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Đăng ký',
    description: 'Đăng ký tài khoản PHT Cinema để nhận ưu đãi đặc biệt và đặt vé xem phim dễ dàng.',
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

