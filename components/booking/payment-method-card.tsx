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
    includeCash?: boolean; // For staff, allow CASH payment method
}

export default function PaymentMethodCard({ onSelect, includeCash = false }: PaymentMethodCardProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selected, setSelected] = useState<string>("");

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const res = await apiClient.get("/bookings/payment-methods");
                const activeMethods: PaymentMethod[] = res.data.data || [];

                // Filter: if includeCash is false, remove CASH (for customer)
                // If includeCash is true, keep all methods (for staff)
                const filtered = includeCash 
                    ? activeMethods 
                    : activeMethods.filter(
                        (m) => m.paymentCode?.toUpperCase() !== "CASH"
                    );

                setPaymentMethods(filtered);
                if (filtered.length > 0) {
                    // For staff, prefer CASH as default
                    const defaultMethod = includeCash 
                        ? filtered.find(m => m.paymentCode?.toUpperCase() === "CASH") || filtered[0]
                        : filtered[0];
                    setSelected(defaultMethod.paymentCode);
                    onSelect(defaultMethod.paymentCode);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách phương thức thanh toán:", err);
            }
        };

        fetchPaymentMethods();
    }, [includeCash]); // Remove onSelect from dependencies to avoid infinite loop

    return (
        <Card className="shadow-xl border-2 rounded-xl bg-white transition-all duration-300" style={{ borderColor: '#B3E0FF' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3BAEF0'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#B3E0FF'}>
            <CardHeader className="border-b-2" style={{ backgroundColor: '#E6F5FF', borderColor: '#B3E0FF' }}>
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
                            console.log("[PaymentMethodCard] Value changed to:", v);
                            setSelected(v);
                            if (onSelect) {
                                onSelect(v);
                            }
                        }}
                    >
                        {paymentMethods.map((m) => (
                            <label
                                key={m.paymentCode}
                                htmlFor={m.paymentCode}
                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border
                                    ${
                                    selected === m.paymentCode
                                        ? "rounded-lg p-3"
                                        : "border-gray-200 hover:bg-gray-50"
                                    }   
                                            `}
                                style={selected === m.paymentCode 
                                    ? { background: 'linear-gradient(to right, #E6F5FF, #B3E0FF)', borderColor: '#3BAEF0' }
                                    : {}
                                }
                                onClick={() => {
                                    console.log("[PaymentMethodCard] Label clicked:", m.paymentCode);
                                    setSelected(m.paymentCode);
                                    if (onSelect) {
                                        onSelect(m.paymentCode);
                                    }
                                }}
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
