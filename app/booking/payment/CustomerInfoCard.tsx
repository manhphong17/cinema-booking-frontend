"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
    onChange: (info: CustomerInfo, discount: number) => void;
}

export interface CustomerInfo {
    name: string;
    email: string;
}

export default function CustomerInfoCard({ onChange }: Props) {
    const [info, setInfo] = useState<CustomerInfo>({
        name: "",
        email: "",
    });

    const [loyalPoint, setLoyalPoint] = useState(0);
    const [pointToApply, setPointToApply] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);

    const POINT_RATE = 1000;

    // Fetch từ BE
    useEffect(() => {
        async function fetchProfile() {
            const res = await fetch("/api/customer/profile");
            const data = await res.json();
            setInfo({
                name: data.name,
                email: data.email,
            });
            setLoyalPoint(data.loyalPoint);
        }

        fetchProfile();
    }, []);

    const handleApplyPoint = () => {
        if (pointToApply <= 0 || pointToApply > loyalPoint) {
            alert("Điểm không hợp lệ");
            return;
        }

        const discount = pointToApply * POINT_RATE;
        setDiscountValue(discount);
        setLoyalPoint((prev) => prev - pointToApply);

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

            <CardContent className="space-y-6 ">

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"> {/* Thêm space-y-2 */}
                        <Label htmlFor="name">Họ tên</Label>
                        <Input
                            id="name"
                            value={info.name}
                            onChange={(e) =>
                                setInfo((prev) => ({ ...prev, name: e.target.value }))
                            }
                        />
                    </div>
                    <div className="space-y-2"> {/* Thêm space-y-2 */}
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={info.email}
                            onChange={(e) =>
                                setInfo((prev) => ({ ...prev, email: e.target.value }))
                            }
                        />
                    </div>
                </div>


                <div className="border p-4 rounded-lg bg-blue-50 border-blue-200 space-y-3">
                    <h6 className="font-semibold text-primary text-lg">
                        Quy đổi điểm thành viên
                    </h6>

                    <p className="text-sm text-gray-700">
                        Bạn có muốn quy đổi điểm thành viên để trừ tiền vào đơn hàng không?
                    </p>

                    <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                        <span className="text-sm font-medium text-gray-700">
                            Số điểm khả dụng của bạn:
                        </span>
                        <span className="text-xl ">
                            {loyalPoint.toLocaleString()} điểm
                         </span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="points" className="text-sm font-medium">
                            Nhập số điểm muốn dùng
                        </Label>
                        <div className="flex flex-wrap items-center gap-4">
                            <Input
                                id="points"
                                type="number"
                                value={pointToApply}
                                onChange={(e) => setPointToApply(Number(e.target.value))}
                                className="w-36"
                                placeholder="Nhập điểm..."
                            />

                            <Button onClick={handleApplyPoint}  className=" bg-orange-600 text-white
                   font-bold text-lg shadow-lg hover:bg-orange-700
                   transition-all duration-200">
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