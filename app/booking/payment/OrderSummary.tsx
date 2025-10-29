"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, MapPin } from "lucide-react";

interface Props {
    movieData: any;
    seats: string[];
    combos: any[];
    comboQty: Record<string, number>;
    combosTotal: number;
    discount: number;
    calculate: () => number;
    getSeatType: (id: string) => string;
}

export default function OrderSummary({
                                         movieData,
                                         seats,
                                         combos,
                                         comboQty,
                                         combosTotal,
                                         discount,
                                         calculate,
                                         getSeatType,
                                     }: Props) {
    return (
        <Card className="lg:col-span-1 sticky top-4 w-full h-fit shadow-md border border-gray-200 rounded-xl bg-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 " >
                    <CheckCircle className="h-5 w-5" />
                    Tóm tắt đơn hàng
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Movie Info */}
                <div className="flex gap-3">
                    <img
                        src={movieData.poster}
                        alt={movieData.title}
                        className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{movieData.title}</h4>
                        <div className="space-y-1 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{movieData.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{movieData.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{movieData.hall}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Seats */}
                <div>
                    <h4 className="font-semibold text-sm mb-2">Ghế đã chọn</h4>
                    <div className="space-y-1">
                        {seats.map((seatId) => (
                            <div key={seatId} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span>Ghế {seatId}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {getSeatType(seatId)}
                                    </Badge>
                                </div>

                                <span className="font-medium">
                  {(() => {
                      const row = seatId[0];
                      if (row === "H") return "200,000đ";
                      if (["E", "F", "G"].includes(row)) return "150,000đ";
                      return "100,000đ";
                  })()}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Combo Totals */}
                {Object.values(comboQty).some((qty) => qty > 0) && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Combo đã chọn</h4>
                        <div className="space-y-1">
                            {combos.map((combo) => {
                                const qty = comboQty[combo.id] || 0;
                                if (qty === 0) return null;

                                return (
                                    <div key={combo.id} className="flex justify-between items-center text-sm">
                                        <span>{combo.name} x{qty}</span>
                                        <span className="text-base font-medium">
                      {(combo.price * qty).toLocaleString()}đ
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Discount */}
                {discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Giảm theo Loyal Point:</span>
                        <span>-{discount.toLocaleString()}đ</span>
                    </div>
                )}

                {/* Summary Footer */}
                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span>Tạm tính:</span>
                        <span>{(comboQty && combosTotal + seats.length * 0).toLocaleString()}đ</span>
                    </div>

                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{calculate().toLocaleString()}đ</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
