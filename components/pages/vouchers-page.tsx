"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, Percent, Clock, Star, Copy, Check } from "lucide-react"
import { useState } from "react"

export function VouchersPageContent() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const vouchers = [
        {
            id: 1,
            title: "Giảm 20% cho combo bắp nước",
            description: "Áp dụng cho combo bắp nước size lớn",
            discount: "20%",
            code: "COMBO20",
            expiry: "31/12/2024",
            type: "combo",
            isActive: true,
            minOrder: 100000,
            maxDiscount: 50000
        },
        {
            id: 2,
            title: "Mua 2 tặng 1 vé xem phim",
            description: "Mua 2 vé xem phim bất kỳ, tặng 1 vé miễn phí",
            discount: "50%",
            code: "BUY2GET1",
            expiry: "15/01/2025",
            type: "ticket",
            isActive: true,
            minOrder: 200000,
            maxDiscount: 100000
        },
        {
            id: 3,
            title: "Giảm 30% cho sinh viên",
            description: "Áp dụng cho tất cả vé xem phim với thẻ sinh viên",
            discount: "30%",
            code: "STUDENT30",
            expiry: "28/02/2025",
            type: "student",
            isActive: true,
            minOrder: 50000,
            maxDiscount: 30000
        },
        {
            id: 4,
            title: "Giảm 15% cho thành viên VIP",
            description: "Dành cho khách hàng VIP với gói thành viên",
            discount: "15%",
            code: "VIP15",
            expiry: "10/01/2025",
            type: "vip",
            isActive: false,
            minOrder: 300000,
            maxDiscount: 100000
        },
        {
            id: 5,
            title: "Giảm 25% cho ngày sinh nhật",
            description: "Áp dụng trong tháng sinh nhật của bạn",
            discount: "25%",
            code: "BIRTHDAY25",
            expiry: "31/12/2024",
            type: "birthday",
            isActive: true,
            minOrder: 150000,
            maxDiscount: 75000
        },
        {
            id: 6,
            title: "Giảm 10% cho lần đầu đặt vé",
            description: "Dành cho khách hàng mới lần đầu sử dụng dịch vụ",
            discount: "10%",
            code: "FIRST10",
            expiry: "20/01/2025",
            type: "newbie",
            isActive: true,
            minOrder: 100000,
            maxDiscount: 20000
        }
    ]

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'combo': return <Gift className="h-5 w-5" />
            case 'ticket': return <Star className="h-5 w-5" />
            case 'student': return <Percent className="h-5 w-5" />
            case 'vip': return <Star className="h-5 w-5" />
            case 'birthday': return <Gift className="h-5 w-5" />
            case 'newbie': return <Percent className="h-5 w-5" />
            default: return <Gift className="h-5 w-5" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'combo': return 'bg-orange-100 text-orange-800'
            case 'ticket': return 'bg-blue-100 text-blue-800'
            case 'student': return 'bg-green-100 text-green-800'
            case 'vip': return 'bg-purple-100 text-purple-800'
            case 'birthday': return 'bg-pink-100 text-pink-800'
            case 'newbie': return 'bg-cyan-100 text-cyan-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const copyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedCode(code)
            setTimeout(() => setCopiedCode(null), 2000)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Voucher & Khuyến Mãi
                    </h1>
                    <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                        Tiết kiệm chi phí với các voucher và khuyến mãi hấp dẫn
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">6</h3>
                                <p className="text-gray-600">Voucher có sẵn</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Percent className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">50%</h3>
                                <p className="text-gray-600">Giảm giá tối đa</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">30</h3>
                                <p className="text-gray-600">Ngày còn lại</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">1000+</h3>
                                <p className="text-gray-600">Lượt sử dụng</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Vouchers Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Voucher Có Sẵn
                        </h2>
                        <p className="text-lg text-gray-600">
                            Chọn voucher phù hợp và tiết kiệm cho lần xem phim tiếp theo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vouchers.map((voucher) => (
                            <Card key={voucher.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge className={`${getTypeColor(voucher.type)} flex items-center gap-1`}>
                                            {getTypeIcon(voucher.type)}
                                            {voucher.type.toUpperCase()}
                                        </Badge>
                                        <Badge variant={voucher.isActive ? "default" : "secondary"}>
                                            {voucher.isActive ? "Có sẵn" : "Hết hạn"}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl text-gray-900">
                                        {voucher.title}
                                    </CardTitle>
                                    <p className="text-gray-600 text-sm">
                                        {voucher.description}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Mã giảm giá:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                                    {voucher.code}
                                                </code>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(voucher.code)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {copiedCode === voucher.code ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Giảm giá:</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {voucher.discount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Đơn tối thiểu:</span>
                                            <span className="text-sm text-gray-700">
                                                {voucher.minOrder.toLocaleString()}đ
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Giảm tối đa:</span>
                                            <span className="text-sm text-gray-700">
                                                {voucher.maxDiscount.toLocaleString()}đ
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Hết hạn:</span>
                                            <span className="text-sm text-gray-700 flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {voucher.expiry}
                                            </span>
                                        </div>
                                        <Button 
                                            className="w-full" 
                                            disabled={!voucher.isActive}
                                        >
                                            {voucher.isActive ? "Sử dụng ngay" : "Đã hết hạn"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Use Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Cách Sử Dụng Voucher
                        </h2>
                        <p className="text-lg text-gray-600">
                            Hướng dẫn đơn giản để sử dụng voucher hiệu quả
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-orange-600">1</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Chọn Voucher
                                </h3>
                                <p className="text-gray-600">
                                    Chọn voucher phù hợp với nhu cầu và điều kiện sử dụng
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">2</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Sao Chép Mã
                                </h3>
                                <p className="text-gray-600">
                                    Sao chép mã voucher và áp dụng khi thanh toán
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <CardContent>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">3</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Tiết Kiệm
                                </h3>
                                <p className="text-gray-600">
                                    Tận hưởng mức giảm giá và tiết kiệm chi phí
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
