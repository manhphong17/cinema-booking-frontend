
"use client"

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/src/api/interceptor";
import { toast } from "sonner";

interface Props {
    onChange: (info: CustomerInfo, discount: number) => void;
}

export interface CustomerInfo {
    name: string;
    email: string;
    loyalPoint: number;
}

export default function CustomerInfoCard({ onChange }: Props) {
    const [info, setInfo] = useState<CustomerInfo>({
        name: "",
        email: "",
        loyalPoint: 0,
    });

    const [pointToApply, setPointToApply] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);

    const POINT_RATE = 1000;

    // Fetch từ BE
    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await apiClient.get("/users/me");
                const data = res.data.data;

                setInfo({
                    name: data.name,
                    email: data.email,
                    loyalPoint: data.loyalPoint,
                });

                onChange(
                    { name: data.name, email: data.email, loyalPoint: data.loyalPoint },
                    discountValue
                );
            } catch (err) {
                console.error("Fetch user profile failed", err);
                toast.error("Không thể tải thông tin khách hàng");
            }
        }

        fetchProfile();
    }, []);


    const handleApplyPoint = () => {
        if (pointToApply < 0 || pointToApply > info.loyalPoint) {
            toast.error("Điểm không hợp lệ");
            return;
        }

        const discount = pointToApply * POINT_RATE;

        // ✅ Tính lại loyalPoint dựa trên loyalPoint gốc, không tiếp tục trừ
        const originalPoint = info.loyalPoint + Math.floor(discountValue / POINT_RATE);
        const updatedInfo = {
            ...info,
            loyalPoint: originalPoint - pointToApply,
        };

        setDiscountValue(discount);
        setInfo(updatedInfo);

        onChange(updatedInfo, discount);
    };

    return (
        <Card className="shadow-xl border-2 rounded-xl bg-white hover:shadow-2xl transition-all duration-300" style={{ borderColor: '#B3E0FF' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3BAEF0'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#B3E0FF'}>
            <CardHeader className="border-b-2 rounded-t-xl" style={{ background: 'linear-gradient(to right, #E6F5FF, white, #E6F5FF)', borderColor: '#B3E0FF' }}>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3BAEF0, #38AAEC)' }}></div>
                  Thông tin khách hàng
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Họ tên</Label>
                        <div className="px-3 py-2 border rounded-md bg-gray-100 text-gray-700">
                            {info.name}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="px-3 py-2 border rounded-md bg-gray-100 text-gray-700">
                            {info.email}
                        </div>
                    </div>
                </div>

                <div className="border p-4 rounded-lg space-y-3" style={{ backgroundColor: '#E6F5FF', borderColor: '#B3E0FF' }}>
                    <h6 className="font-semibold text-lg" style={{ color: '#3BAEF0' }}>
                        Quy đổi điểm thành viên
                    </h6>

                    <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                        <span className="text-sm font-medium text-gray-700">
                            Số điểm khả dụng của bạn:
                        </span>
                        <span className="text-xl ">
                            {info.loyalPoint.toLocaleString()} điểm
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="points" className="text-sm font-medium ">
                            Nhập số điểm muốn dùng
                        </Label>
                        <div className="flex flex-wrap items-center gap-4 ">
                            <Input
                                id="points"
                                type="number"
                                value={pointToApply}
                                onChange={(e) => setPointToApply(Number(e.target.value))}
                                className="w-36 bg-white"
                                placeholder="Nhập điểm..."
                            />

                            <Button
                                onClick={handleApplyPoint}
                                style={{ backgroundColor: '#38AAEC' }}
                                className="text-white font-bold shadow-lg hover:opacity-90 transition-all duration-200"
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </div>

                    {pointToApply > 0 && (
                        <div className="pt-2 text-sm font-semibold text-green-600">
                            Bạn sẽ được giảm: {(pointToApply * POINT_RATE).toLocaleString()}đ
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
