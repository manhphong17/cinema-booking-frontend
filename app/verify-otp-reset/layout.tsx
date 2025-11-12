import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Xác thực OTP đặt lại mật khẩu',
    description: 'Nhập mã OTP để xác thực và đặt lại mật khẩu tài khoản PHT Cinema.',
}

export default function VerifyOTPResetLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

