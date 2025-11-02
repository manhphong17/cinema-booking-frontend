"use client";

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
        if (pointToApply <= 0 || pointToApply > info.loyalPoint) {
            toast.error("Điểm không hợp lệ");
            return;
        }

        const discount = pointToApply * POINT_RATE;
        setDiscountValue(discount);

        // trừ điểm tạm thời để UI phản ánh
        setInfo((prev) => ({
            ...prev,
            loyalPoint: prev.loyalPoint - pointToApply,
        }));

        onChange(info, discount);
    };

    useEffect(() => {
        onChange(info, discountValue);
    }, [info, discountValue]);

    return (
        <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
            <CardHeader className="0 border-b rounded-t-xl">
                <CardTitle className="text-xl font-bold ">
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

                <div className="border p-4 rounded-lg bg-blue-50 border-blue-200 space-y-3">
                    <h6 className="font-semibold text-primary text-lg">
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
                                className="bg-orange-600 text-white font-bold shadow-lg hover:bg-orange-700 transition-all duration-200"
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
