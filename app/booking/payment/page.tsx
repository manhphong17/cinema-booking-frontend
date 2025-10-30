"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CustomerInfoCard, { CustomerInfo } from "./CustomerInfoCard";
import PaymentMethodCard from "./PaymentMethodCard";
import OrderSummary from "./OrderSummary";
import { CheckCircle } from "lucide-react";

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Data từ trang trước
    const movieId = searchParams.get("movieId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const hall = searchParams.get("hall");
    const seats = searchParams.get("seats")?.split(",") || [];
    const combosParam = searchParams.get("combos");

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: "",
        email: "",

    });

    const [selectedPayment, setSelectedPayment] = useState("cash");
    const [isProcessing, setIsProcessing] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);

    // Mock movieData (sau này call BE)
    const movieData = {
        id: movieId,
        title: "Avengers: Endgame",
        poster: "/generic-superhero-team-poster.png",
        time,
        date,
        hall,
    };

    // Mock combos
    const combos = useMemo(
        () => [
            { id: "combo1", name: "Combo 1", price: 69000 },
            { id: "combo2", name: "Combo 2", price: 99000 },
            { id: "combo3", name: "Combo VIP", price: 129000 },
        ],
        []
    );

    const [comboQty, setComboQty] = useState<Record<string, number>>({});

    useEffect(() => {
        if (combosParam) {
            try {
                const parsed = JSON.parse(combosParam);
                const map: Record<string, number> = {};

                parsed.forEach((c: any) => {
                    map[c.comboId] = c.quantity;
                });

                setComboQty(map);
            } catch (err) {
                console.error("Combo parse error:", err);
            }
        }
    }, [combosParam]);

    // =================== PRICE CALC ===================
    const combosTotal = useMemo(() => {
        return combos.reduce(
            (sum, c) => sum + (comboQty[c.id] || 0) * c.price,
            0
        );
    }, [combos, comboQty]);

    const calculateTicketTotal = () => {
        return seats.reduce((total, seatId) => {
            const row = seatId[0];
            if (row === "H") return total + 200000;
            if (["E", "F", "G"].includes(row)) return total + 150000;
            return total + 100000;
        }, 0);
    };

    const calculateTotal = () => {
        return calculateTicketTotal() + combosTotal - discountValue;
    };

    const getSeatType = (seatId: string) => {
        const row = seatId[0];
        if (row === "H") return "Premium";
        if (["E", "F", "G"].includes(row)) return "VIP";
        return "Thường";
    };

    // =================== PAYMENT ===================
    const handlePayment = async () => {
        if (!customerInfo.name || !customerInfo.email ) {
            alert("Vui lòng điền thông tin khách hàng");
            return;
        }

        setIsProcessing(true);

        if (selectedPayment === "vnpay") {
            // gọi API createPayment
            const res = await fetch("/api/payment/vnpay", {
                method: "POST",
                body: JSON.stringify({
                    total: calculateTotal(),
                }),
            });

            const data = await res.json();
            window.location.href = data.paymentUrl;
            return;
        }

        // cash mock
        setTimeout(() => {
            const bookingId = `BK${Date.now()}`;
            router.push(`/booking/confirmation?bookingId=${bookingId}`);
        }, 1500);
    };

    return (
        <HomeLayout>
            {/* THAY ĐỔI: Đổi nền từ bg-gray-50 sang bg-slate-100 */}
            <div className="min-h-screen bg-slate-100 py-8">
                <div className="container mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 px-4">

                    {/* LEFT */}
                    <div className="lg:col-span-3 space-y-6">
                        <CustomerInfoCard
                            onChange={(info, discount) => {
                                setCustomerInfo(info);
                                setDiscountValue(discount);
                            }}
                        />
                        <PaymentMethodCard onSelect={setSelectedPayment} />
                    </div>
                        <div className="lg:col-span-1 space-y-6">
                            <OrderSummary
                                movieData={movieData}
                                seats={seats}
                                combos={combos}
                                comboQty={comboQty}
                                combosTotal={combosTotal}
                                discount={discountValue}
                                calculate={calculateTotal}
                                getSeatType={getSeatType}
                            />

                            {/* Button "Thanh toán" được chuyển vào đây */}
                            <button
                                disabled={isProcessing}
                                onClick={handlePayment}
                                className="w-full py-4 rounded-lg bg-orange-600 text-white
                   font-bold text-lg shadow-lg hover:bg-orange-700
                   transition-all duration-200"
                            >
                                {isProcessing
                                    ? "Đang xử lý..."
                                    : `Thanh toán ${calculateTotal().toLocaleString()}đ`}
                            </button>
                        </div>

                </div>
            </div>
        </HomeLayout>
    );
}
