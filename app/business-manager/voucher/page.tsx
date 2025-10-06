"use client"

import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift } from "lucide-react"

export default function VoucherPage() {
    return (
        <BusinessManagerLayout activeSection="voucher">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Voucher</h1>
                    <p className="text-gray-600 mt-2">Quản lý mã giảm giá và chương trình khuyến mãi</p>
                </div>

                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Tính năng đang phát triển</CardTitle>
                        <CardDescription className="text-gray-600">Module quản lý voucher sẽ sớm được cập nhật</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Gift className="w-10 h-10 text-blue-600" />
                            </div>
                            <p className="text-gray-600 text-center">
                                Tính năng quản lý voucher đang được phát triển.
                                <br />
                                Vui lòng quay lại sau.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </BusinessManagerLayout>
    )
}
