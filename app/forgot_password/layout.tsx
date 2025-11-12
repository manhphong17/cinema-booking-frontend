import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Quên mật khẩu',
    description: 'Khôi phục mật khẩu tài khoản PHT Cinema của bạn bằng email.',
}

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

