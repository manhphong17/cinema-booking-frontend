"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"

interface PaymentMethodCardProps {
  onSelect: (method: string) => void
}

export default function PaymentMethodCard({ onSelect }: PaymentMethodCardProps) {
  const paymentMethods = [
    { id: "cash", name: "Tiền mặt", icon: "/cash.png" },
    { id: "vnpay", name: "VNPay", icon: "/vnpay-logo.png" },
  ]

  const [selected, setSelected] = useState("cash")

  return (
    <Card className="shadow-xl border-2 border-gray-200/80 rounded-xl bg-white hover:border-primary/30 transition-all duration-300">
      <CardHeader className="border-b-2 border-gray-200/60 rounded-t-xl bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <CardTitle className="text-xl font-bold text-gray-900">
          Phương thức thanh toán
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <RadioGroup
          value={selected}
          onValueChange={(v) => {
            setSelected(v)
            onSelect(v)
          }}
        >
          {paymentMethods.map((m) => (
            <label
              key={m.id}
              htmlFor={m.id}
              className={`
                flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border
                ${
                  selected === m.id
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={m.id} id={m.id} className="scale-125" />
                <img src={m.icon} className="w-7" alt={m.name} />
                <span className="font-semibold text-gray-700">{m.name}</span>
              </div>

              <span className=" text-sm font-medium"></span>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

