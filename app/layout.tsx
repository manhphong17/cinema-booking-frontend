import {Analytics} from '@vercel/analytics/next'
import './globals.css'
import '../styles/home.css'
import {Toaster as SonnerToaster} from "sonner"
import {Toaster as ShadcnToaster} from "@/components/ui/toaster"
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
            <SonnerToaster richColors position="top-right"/>
            <ShadcnToaster />
        </Suspense>
        <Analytics/>
        </body>
        </html>
    )
}
