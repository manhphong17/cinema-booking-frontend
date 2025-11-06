"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import apiClient from "@/src/api/interceptor";

interface PaymentMethod {
    paymentName: string;
    paymentCode: string;
    imageUrl: string;
}

interface PaymentMethodCardProps {
    onSelect: (methodCode: string) => void;
}

export default function PaymentMethodCard({ onSelect }: PaymentMethodCardProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selected, setSelected] = useState<string>("");

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const res = await apiClient.get("/bookings/payment-methods");
                const activeMethods: PaymentMethod[] = res.data.data || [];

                //  lọc bỏ các method có paymentCode = "CASH"
                const filtered = activeMethods.filter(
                    (m) => m.paymentCode?.toUpperCase() !== "CASH"
                );

                setPaymentMethods(filtered);
                if (filtered.length > 0) {
                    setSelected(filtered[0].paymentCode); // chọn mặc định method đầu tiên
                    onSelect(filtered[0].paymentCode);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách phương thức thanh toán:", err);
            }
        };

        fetchPaymentMethods();
    }, [onSelect]);

    return (
        <Card className="shadow-xl border-2 border-gray-200/80 rounded-xl bg-white hover:border-primary/30 transition-all duration-300">
            <CardHeader className="border-b-2 border-gray-200/60 rounded-t-xl bg-gradient-to-r from-gray-50 via-white to-gray-50">
                <CardTitle className="text-xl font-bold text-gray-900">
                    Phương thức thanh toán
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {paymentMethods.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                        Không có phương thức thanh toán khả dụng
                    </p>
                ) : (
                    <RadioGroup
                        value={selected}
                        onValueChange={(v) => {
                            setSelected(v);
                            onSelect(v);
                        }}
                    >
                        {paymentMethods.map((m) => (
                            <label
                                key={m.paymentCode}
                                htmlFor={m.paymentCode}
                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border
                                    ${
                                    selected === m.paymentCode
                                        ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                                        : "border-gray-200 hover:bg-gray-50"
                                    }   
                                            `}
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem
                                        value={m.paymentCode}
                                        id={m.paymentCode}
                                        className="scale-125"
                                    />
                                    <img
                                        src={m.imageUrl || "/payment-default.png"}  // ✅ load từ DB
                                        alt={m.paymentName}
                                        className="w-7"
                                    />
                                    <span className="font-semibold text-gray-700">
                                        {m.paymentName}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </RadioGroup>
                )}
            </CardContent>
        </Card>
    );
}
