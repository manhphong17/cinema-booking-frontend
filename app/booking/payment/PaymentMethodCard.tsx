"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface Props { onSelect: (method: string) => void; }

export default function PaymentMethodCard({ onSelect }: Props) {
    const paymentMethods = [
        { id: "cash", name: "Tiền mặt", icon: "/cash.png" },
        { id: "vnpay", name: "VNPay", icon: "/vnpay-logo.png" },
    ];

    const [selected, setSelected] = useState("cash");

    return (
        <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
            <CardHeader className="border-b rounded-t-xl">
                <CardTitle className="text-xl font-bold ">
                    Phương thức thanh toán
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <RadioGroup
                    value={selected}
                    onValueChange={(v) => { setSelected(v); onSelect(v); }}
                >
                    {paymentMethods.map((m) => (
                        <label
                            key={m.id}
                            htmlFor={m.id}
                            className={`
                            flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border
                                    ${selected === m.id
                                    ? "border-primary ring-2 ring-primary/30 bg-primary/5" // Làm nổi bật lựa chọn
                                    : "border-gray-200 hover:bg-gray-50"
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value={m.id} id={m.id} className="scale-125" />
                                <img src={m.icon} className="w-7"/>
                                <span className="font-semibold text-gray-700">{m.name}</span>
                            </div>

                            <span className=" text-sm font-medium"></span>
                        </label>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    );
}