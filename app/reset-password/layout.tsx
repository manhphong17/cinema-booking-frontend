import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu mới cho tài khoản PHT Cinema của bạn.',
}

export default function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

