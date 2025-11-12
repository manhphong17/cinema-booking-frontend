import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Đăng nhập',
    description: 'Đăng nhập vào tài khoản PHT Cinema để đặt vé xem phim và tận hưởng các ưu đãi đặc biệt.',
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

