import {Analytics} from '@vercel/analytics/next'
import './globals.css'
import {Toaster} from "sonner"
import {Inter, JetBrains_Mono} from "next/font/google"
import {Suspense} from "react";

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

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`font-sans antialiased ${inter.variable} ${jetbrainsMono.variable}`}>
        <Suspense fallback={null}>
            {children}
            <Toaster richColors position="top-right"/>
        </Suspense>
        <Analytics/>
        </body>
        </html>
    )
}
