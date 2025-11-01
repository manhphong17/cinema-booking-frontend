"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CustomerInfoCardProps {
  onChange: (info: CustomerInfo, discount: number) => void
}

export interface CustomerInfo {
  name: string
  email: string
}

export default function CustomerInfoCard({ onChange }: CustomerInfoCardProps) {
  const [info, setInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
  })

  const [loyalPoint, setLoyalPoint] = useState(0)
  const [pointToApply, setPointToApply] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)

  const POINT_RATE = 1000

  // Fetch từ BE
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/customer/profile")
      const data = await res.json()
      setInfo({
        name: data.name,
        email: data.email,
      })
      setLoyalPoint(data.loyalPoint)
    }

    fetchProfile()
  }, [])

  const handleApplyPoint = () => {
    if (pointToApply <= 0 || pointToApply > loyalPoint) {
      alert("Điểm không hợp lệ")
      return
    }

    const discount = pointToApply * POINT_RATE
    setDiscountValue(discount)
    setLoyalPoint((prev) => prev - pointToApply)

    onChange(info, discount)
  }

  useEffect(() => {
    onChange(info, discountValue)
  }, [info, discountValue])

  return (
    <Card className="shadow-xl border-2 border-gray-200/80 rounded-xl bg-white hover:border-primary/30 transition-all duration-300">
      <CardHeader className="border-b-2 border-gray-200/60 rounded-t-xl bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <CardTitle className="text-xl font-bold text-gray-900">
          Thông tin khách hàng
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Họ tên
            </Label>
            <Input
              id="name"
              value={info.name}
              onChange={(e) =>
                setInfo((prev) => ({ ...prev, name: e.target.value }))
              }
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập họ tên..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={info.email}
              onChange={(e) =>
                setInfo((prev) => ({ ...prev, email: e.target.value }))
              }
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập email..."
            />
          </div>
        </div>

        <div className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-white rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <h6 className="font-bold text-primary text-lg">
              Quy đổi điểm thành viên
            </h6>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Bạn có muốn quy đổi điểm thành viên để trừ tiền vào đơn hàng không?
          </p>

          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              Số điểm khả dụng của bạn:
            </span>
            <span className="text-2xl font-bold text-primary">
              {loyalPoint.toLocaleString()} điểm
            </span>
          </div>

          <div className="space-y-3">
            <Label htmlFor="points" className="text-sm font-semibold text-gray-700">
              Nhập số điểm muốn dùng
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="points"
                type="number"
                value={pointToApply}
                onChange={(e) => setPointToApply(Number(e.target.value))}
                className="w-40 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Nhập điểm..."
                min="0"
                max={loyalPoint}
              />

              <Button
                onClick={handleApplyPoint}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-6 py-2 shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 rounded-lg"
              >
                Áp dụng
              </Button>
            </div>
          </div>

          {pointToApply > 0 && (
            <div className="pt-3 pb-2 px-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-700">
                  Bạn sẽ được giảm:
                </span>
                <span className="text-lg font-bold text-green-600">
                  {(pointToApply * POINT_RATE).toLocaleString()}đ
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

