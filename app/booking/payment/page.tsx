"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CustomerInfoCard, { CustomerInfo } from "./CustomerInfoCard";
import PaymentMethodCard from "./PaymentMethodCard";
import BookingOrderSummary, { SeatInfo, ConcessionInfo, MovieInfo } from "@/components/booking/booking-order-summary";
import { apiClient } from "@/src/api/interceptor";
import { Movie } from "@/type/movie";
import { jwtDecode } from "jwt-decode";

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
    const showtimeId = searchParams.get("showtimeId");

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: "",
        email: "",
    });

    const [selectedPayment, setSelectedPayment] = useState("cash");
    const [isProcessing, setIsProcessing] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loadingMovie, setLoadingMovie] = useState(true);
    const [concessions, setConcessions] = useState<any[]>([]);
    const [loadingConcessions, setLoadingConcessions] = useState(false);
    const [seatData, setSeatData] = useState<any[]>([]);
    const [userId, setUserId] = useState<number | null>(null);

    const [comboQty, setComboQty] = useState<Record<string, number>>({});

    // Get userId from token
    useEffect(() => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                const decoded: any = jwtDecode(token);
                setUserId(decoded.userId);
            }
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    }, []);

    // Fetch movie data
    useEffect(() => {
        const fetchMovieData = async () => {
            if (!movieId) {
                setLoadingMovie(false);
                return;
            }

            try {
                setLoadingMovie(true);
                const response = await apiClient.get(`/movies/${movieId}`);
                if (response.data?.status === 200 && response.data?.data) {
                    setMovie(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching movie details:", error);
            } finally {
                setLoadingMovie(false);
            }
        };

        fetchMovieData();
    }, [movieId]);

    // Fetch seat data if showtimeId is available
    useEffect(() => {
        const fetchSeatData = async () => {
            if (!showtimeId) return;

            try {
                const response = await apiClient.get(
                    `/bookings/show-times/${showtimeId}/seats`
                );
                if (response.data?.status === 200 && response.data?.data?.length > 0) {
                    setSeatData(response.data.data[0].ticketResponses || []);
                }
            } catch (error) {
                console.error("Error fetching seat data:", error);
            }
        };

        fetchSeatData();
    }, [showtimeId]);

    // Fetch concessions data
    useEffect(() => {
        const fetchConcessions = async () => {
            try {
                setLoadingConcessions(true);
                const res = await apiClient.get("/concession", {
                    params: {
                        page: 0,
                        size: 100,
                        stockStatus: "IN_STOCK",
                        concessionStatus: "ACTIVE",
                    },
                });
                const list = res.data?.data?.content || [];
                setConcessions(list);
            } catch (error) {
                console.error("Error fetching concessions:", error);
            } finally {
                setLoadingConcessions(false);
            }
        };

        fetchConcessions();
    }, []);

    // Parse combo quantities from URL params
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
        return Object.entries(comboQty).reduce((sum, [comboId, quantity]) => {
            const concession = concessions.find(c => c.concessionId.toString() === comboId);
            if (!concession) return sum;
            return sum + (quantity * concession.price);
        }, 0);
    }, [comboQty, concessions]);

    const calculateTicketTotal = () => {
        if (seatData.length === 0) {
            // Fallback to hardcoded prices if seat data not available
            return seats.reduce((total, seatId) => {
                const row = seatId[0];
                if (row === "H") return total + 200000;
                if (["E", "F", "G"].includes(row)) return total + 150000;
                return total + 100000;
            }, 0);
        }

        // Calculate from actual seat data
        return seats.reduce((total, seatId) => {
            const ticket = seatData.find(t => {
                const rowLabel = String.fromCharCode(65 + t.rowIdx);
                const seatNumber = t.columnInx + 1;
                return `${rowLabel}${seatNumber}` === seatId;
            });
            return total + (ticket?.ticketPrice || 0);
        }, 0);
    };

    const calculateTotal = () => {
        return calculateTicketTotal() + combosTotal - discountValue;
    };

    const getSeatType = (seatId: string) => {
        if (seatData.length > 0) {
            const ticket = seatData.find(t => {
                const rowLabel = String.fromCharCode(65 + t.rowIdx);
                const seatNumber = t.columnInx + 1;
                return `${rowLabel}${seatNumber}` === seatId;
            });
            if (ticket) {
                const seatType = ticket.seatType.toLowerCase();
                if (seatType.includes('premium')) return 'premium';
                if (seatType.includes('vip')) return 'vip';
                return 'standard';
            }
        }
        // Fallback logic
        const row = seatId[0];
        if (row === "H") return "premium";
        if (["E", "F", "G"].includes(row)) return "vip";
        return "standard";
    };

    // Prepare data for BookingOrderSummary component
    const seatsInfo: SeatInfo[] = useMemo(() => {
        return seats.map(seatId => {
            if (seatData.length > 0) {
                const ticket = seatData.find(t => {
                    const rowLabel = String.fromCharCode(65 + t.rowIdx);
                    const seatNumber = t.columnInx + 1;
                    return `${rowLabel}${seatNumber}` === seatId;
                });
                if (ticket) {
                    const seatType = ticket.seatType.toLowerCase();
                    let type: 'standard' | 'vip' | 'premium' = 'standard';
                    if (seatType.includes('premium')) type = 'premium';
                    else if (seatType.includes('vip')) type = 'vip';
                    return { id: seatId, type, price: ticket.ticketPrice };
                }
            }
            // Fallback
            const row = seatId[0];
            let price = 100000;
            let type: 'standard' | 'vip' | 'premium' = 'standard';
            if (row === 'H') {
                price = 200000;
                type = 'premium';
            } else if (['E', 'F', 'G'].includes(row)) {
                price = 150000;
                type = 'vip';
            }
            return { id: seatId, type, price };
        });
    }, [seats, seatData]);

    const concessionsInfo: ConcessionInfo[] = useMemo(() => {
        const result: ConcessionInfo[] = [];
        Object.entries(comboQty).forEach(([comboId, quantity]) => {
            if (quantity > 0) {
                const concession = concessions.find(c => c.concessionId.toString() === comboId);
                if (concession) {
                    result.push({
                        id: String(comboId),
                        name: concession.name,
                        quantity,
                        price: concession.price
                    });
                }
            }
        });
        return result;
    }, [comboQty, concessions]);

    const movieInfo: MovieInfo | undefined = useMemo(() => {
        if (!movie) return undefined;
        return {
            title: movie.name,
            poster: movie.posterUrl,
            date: date || undefined,
            time: time || undefined,
            hall: hall || undefined
        };
    }, [movie, date, time, hall]);

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
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
                    {/* RIGHT - Order Summary */}
                    <div className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit space-y-6">
                        <BookingOrderSummary
                            movieInfo={movieInfo}
                            seats={seatsInfo}
                            seatsTotal={calculateTicketTotal()}
                            concessions={concessionsInfo}
                            concessionsTotal={combosTotal}
                            total={calculateTotal()}
                            discount={discountValue}
                            showtimeId={showtimeId ? parseInt(showtimeId) : null}
                            userId={userId}
                            movieId={movieId}
                        />

                        {/* Button "Thanh toán" được chuyển vào đây */}
                        <button
                            disabled={isProcessing}
                            onClick={handlePayment}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold text-lg shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:scale-105 border-2 border-gray-800 active:scale-95"
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
