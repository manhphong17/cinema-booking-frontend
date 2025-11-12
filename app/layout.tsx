import {Analytics} from '@vercel/analytics/next'
import './globals.css'
import '../styles/home.css'
import '../styles/operator.css'
import {Toaster as SonnerToaster} from "sonner"
import {Toaster as ShadcnToaster} from "@/components/ui/toaster"
import {Inter, JetBrains_Mono} from "next/font/google"
import {Suspense} from "react";
import type { Metadata } from 'next'

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    display: "swap",
})

export const metadata: Metadata = {
    title: {
        default: 'PHT Cinema - Rạp chiếu phim hàng đầu Việt Nam',
        template: '%s | PHT Cinema'
    },
    description: 'Hệ thống rạp chiếu phim hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh đẳng cấp quốc tế với công nghệ hiện đại và dịch vụ chuyên nghiệp.',
    keywords: ['cinema', 'movie', 'phim', 'rạp chiếu phim', 'đặt vé', 'booking', 'PHT Cinema'],
    authors: [{ name: 'PHT Cinema' }],
    creator: 'PHT Cinema',
    publisher: 'PHT Cinema',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="vi">
        <body className={`font-sans antialiased ${inter.variable} ${jetbrainsMono.variable}`}>
        <Suspense fallback={null}>
            {children}
            <SonnerToaster richColors position="top-right"/>
            <ShadcnToaster />
        </Suspense>
        <Analytics/>
        </body>
        </html>
    )
}
