import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Xác thực OTP',
    description: 'Nhập mã OTP để xác thực tài khoản PHT Cinema của bạn.',
}

export default function VerifyOTPLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

