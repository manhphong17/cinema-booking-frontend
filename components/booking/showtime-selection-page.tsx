"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Play, MapPin, Monitor, Crown, Zap, Volume2, Loader2, ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Movie } from "@/type/movie";
import { apiClient } from "@/src/api/interceptor";

// Types
type ShowtimeSlot = { startTime: string; endTime: string; time: string; price: string; available: boolean };
type ShowtimeResponse = { status: number; message: string; data: { startTime: string; endTime: string }[] };
type RoomInfo = { showTimeId: number; startTime: string; endTime: string; roomId: number; roomName: string; roomType: string; totalSeat: number; totalSeatAvailable: number };
type RoomResponse = { status: number; message: string; data: RoomInfo[] };

// Utilities
const generateNext7Days = () => {
    const days: { date: string; label: string }[] = [];
    const formatter = new Intl.DateTimeFormat("vi-VN", { weekday: "long" });
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = `${d.getMonth() + 1}`.padStart(2, "0");
        const dd = `${d.getDate()}`.padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        const w = formatter.format(d);
        const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : w.charAt(0).toUpperCase() + w.slice(1);
        days.push({ date: iso, label });
    }
    return days;
};

type ShowtimeSelectionPageProps = { movieId: string | null };

export default function ShowtimeSelectionPage({ movieId }: ShowtimeSelectionPageProps) {
    const router = useRouter();
    const days = useMemo(() => generateNext7Days(), []);
    const [selectedDate, setSelectedDate] = useState<string>(days[0].date);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedHall, setSelectedHall] = useState<string | null>(null);

    // Movie
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Showtimes
    const [showtimes, setShowtimes] = useState<ShowtimeSlot[]>([]);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [showtimeError, setShowtimeError] = useState<string | null>(null);

    // Rooms
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);

    // Navigation
    const [isNavigating, setIsNavigating] = useState(false);

    // Fetch movie
    useEffect(() => {
        const fetchMovieData = async () => {
            if (!movieId) { setLoading(false); return; }
            try {
                setLoading(true);
                setError(null);
                const res = await apiClient.get(`/movies/${movieId}`);
                if (res.data?.status === 200 && res.data?.data) {
                    setMovie(res.data.data);
                } else {
                    setError("Không thể tải thông tin phim");
                }
            } catch {
                setError("Không thể kết nối server");
            } finally {
                setLoading(false);
            }
        };
        fetchMovieData();
    }, [movieId]);

    // Fetch showtimes
    const fetchShowtimes = async (id: string, date: string) => {
        try {
            setLoadingShowtimes(true);
            setShowtimeError(null);
            const res = await apiClient.get<ShowtimeResponse>(`/bookings/movies/${id}/show-times/${date}`);
            if (res.data?.status === 200 && res.data?.data) {
                const data = res.data.data.map((s) => ({
                    startTime: s.startTime,
                    endTime: s.endTime,
                    time: new Date(s.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    price: "100,000đ",
                    available: true,
                }));
                setShowtimes(data);
            } else {
                setShowtimes([]);
                setShowtimeError("Không có suất chiếu cho ngày này");
            }
        } catch {
            setShowtimes([]);
            setShowtimeError("Không thể tải suất chiếu");
        } finally {
            setLoadingShowtimes(false);
        }
    };

    // Fetch rooms
    const fetchRooms = async (id: string, startTime: string) => {
        setLoadingRooms(true);
        setRoomError(null);
        try {
            const res = await apiClient.get<RoomResponse>(`/bookings/movies/${id}/show-times/start-time/${encodeURIComponent(startTime)}`);
            if (res.data?.status === 200 && Array.isArray(res.data.data)) {
                setRooms([...res.data.data]);
            } else {
                setRooms([]);
                setRoomError("Không có phòng chiếu cho suất này");
            }
        } catch {
            setRoomError("Không thể tải thông tin phòng");
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    // Load showtimes when date/movie changes
    useEffect(() => {
        if (movieId && selectedDate) {
            setSelectedTime(null);
            setSelectedHall(null);
            setRooms([]);
            setRoomError(null);
            fetchShowtimes(movieId, selectedDate);
        }
    }, [movieId, selectedDate]);

    const handleContinue = () => {
        if (!selectedTime || !selectedHall) return;
        const selectedRoom = rooms.find(room => room.roomName === selectedHall);
        if (!selectedRoom) {
            alert('Không tìm thấy thông tin phòng chiếu. Vui lòng thử lại.');
            return;
        }
        if (selectedRoom.totalSeatAvailable === 0) {
            alert('Phòng chiếu này đã hết vé. Vui lòng chọn phòng khác.');
            return;
        }
        setIsNavigating(true);
        setTimeout(() => {
            router.push(`/booking/seats?showtimeId=${selectedRoom.showTimeId}`);
        }, 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: '#3BAEF0' }} />
                    <p className="text-gray-600">Đang tải thông tin phim...</p>
                </div>
            </div>
        );
    }

    if (error && !movie) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-lg text-red-600 mb-3">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" style={{ borderColor: '#3BAEF0', color: '#3BAEF0' }} className="hover:opacity-80">
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3BAEF0 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            </div>

            {/* Decorative Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#3BAEF0' }}></div>

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-end mb-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Movie info */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-sm border border-gray-200 bg-white">
                            <CardContent className="p-4">
                                <div className="text-center">
                                    <img
                                        src={movie?.posterUrl || "/placeholder.svg"}
                                        alt={movie?.name || "Movie"}
                                        className="w-full max-w-52 mx-auto rounded-lg shadow-lg mb-4"
                                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                                    />
                                    <h2 className="text-xl font-bold mb-4 text-gray-900 leading-tight">{movie?.name || "Tên phim"}</h2>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="h-4 w-4" style={{ color: '#3BAEF0' }} />
                                                <span>Thời lượng:</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{movie?.duration || 120} phút</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="h-4 w-4" style={{ color: '#3BAEF0' }} />
                                                <span>Năm phát hành:</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : "2024"}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="h-4 w-4" style={{ color: '#3BAEF0' }} />
                                                <span>Quốc gia:</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{movie?.country?.name || "Mỹ"}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Users className="h-4 w-4" style={{ color: '#3BAEF0' }} />
                                                <span>Độ tuổi:</span>
                                            </div>
                                            <Badge variant="secondary" style={{ backgroundColor: '#E6F5FF', color: '#3BAEF0', borderColor: '#B3E0FF', fontSize: '0.75rem', padding: '0.25rem 0.75rem', fontWeight: '600' }}>P{movie?.ageRating || 13}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: showtime selections */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Date + time */}
                        <Card className="shadow-sm border border-gray-200 bg-white">
                            <CardHeader className="bg-gray-50 border-b border-gray-200">
                                <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                                    <Calendar className="h-5 w-5" style={{ color: '#3BAEF0' }} />
                                    <span>Chọn ngày và giờ chiếu</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4">
                                {/* Dates */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3BAEF0' }}></div>
                                        <h3 className="font-medium text-gray-900">Chọn ngày</h3>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {days.map((d) => (
                                            <button
                                                key={d.date}
                                                onClick={() => {
                                                    setSelectedDate(d.date);
                                                    setSelectedTime(null);
                                                    setSelectedHall(null);
                                                    setRooms([]);
                                                    setRoomError(null);
                                                }}
                                                style={selectedDate === d.date ? { backgroundColor: '#3BAEF0', borderColor: '#3BAEF0' } : {}}
                                                className={`shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-w-[90px] ${
                                                    selectedDate === d.date
                                                        ? "text-white"
                                                        : "bg-white text-gray-700 border-gray-300 hover:border-[#3BAEF0]"
                                                }`}
                                            >
                                                <div className="font-bold">{d.label}</div>
                                                <div className={`text-xs ${selectedDate === d.date ? "text-white opacity-80" : "text-gray-500"}`}>{d.date}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Times */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3BAEF0' }}></div>
                                        <h3 className="font-medium text-gray-900">Chọn khung giờ chiếu</h3>
                                    </div>
                                    {loadingShowtimes ? (
                                        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                            <Loader2 className="h-6 w-6 animate-spin mr-2" style={{ color: '#3BAEF0' }} />
                                            <span className="text-gray-600">Đang tải suất chiếu...</span>
                                        </div>
                                    ) : showtimeError ? (
                                        <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-red-600 mb-3 font-medium">{showtimeError}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => movieId && fetchShowtimes(movieId, selectedDate)}
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                Thử lại
                                            </Button>
                                        </div>
                                    ) : showtimes.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-gray-600">Không có suất chiếu cho ngày này</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                            {showtimes.map((slot) => {
                                                const isSelected = selectedTime === slot.time;
                                                return (
                                                    <button
                                                        key={slot.startTime}
                                                        disabled={!slot.available}
                                                        onClick={() => {
                                                            if (!slot.available) return;
                                                            setRooms([]);
                                                            setRoomError(null);
                                                            setSelectedTime(slot.time);
                                                            setSelectedHall(null);
                                                            if (movieId) {
                                                                setTimeout(() => { fetchRooms(movieId, slot.startTime); }, 50);
                                                            }
                                                        }}
                                                        style={isSelected ? { backgroundColor: '#3BAEF0', borderColor: '#3BAEF0' } : {}}
                                                        className={`p-3 rounded-lg border text-center font-medium transition-all text-sm ${
                                                            isSelected
                                                                ? "text-white"
                                                                : slot.available
                                                                    ? "bg-white text-gray-700 border-gray-300 hover:border-[#3BAEF0]"
                                                                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rooms */}
                        {selectedTime && (
                            <Card className="shadow-sm border border-gray-200 bg-white">
                                <CardHeader className="bg-gray-50 border-b border-gray-200">
                                    <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                                        <Monitor className="h-5 w-5" style={{ color: '#3BAEF0' }} />
                                        <span>Chọn phòng chiếu</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {loadingRooms ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            <span>Đang tải thông tin phòng...</span>
                                        </div>
                                    ) : roomError ? (
                                        <div className="text-center py-6">
                                            <p className="text-red-600 mb-2">{roomError}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const selectedSlot = showtimes.find((slot) => slot.time === selectedTime);
                                                    if (movieId && selectedSlot) fetchRooms(movieId, selectedSlot.startTime);
                                                }}
                                            >
                                                Thử lại
                                            </Button>
                                        </div>
                                    ) : rooms.length === 0 ? (
                                        <div className="text-center py-6">
                                            <p className="text-gray-500">Không có phòng chiếu cho suất này</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {rooms.map((room) => {
                                                const isSelected = selectedHall === room.roomName;
                                                const getRoomIcon = (roomType: string) => {
                                                    switch (roomType) {
                                                        case "2D": return <Monitor className="h-5 w-5" />;
                                                        case "3D": return <Zap className="h-5 w-5" />;
                                                        case "IMAX": return <Volume2 className="h-5 w-5" />;
                                                        case "VIP": return <Crown className="h-5 w-5" />;
                                                        default: return <Monitor className="h-5 w-5" />;
                                                    }
                                                };
                                                const isSoldOut = room.totalSeatAvailable === 0;
                                                return (
                                                    <Card
                                                        key={room.roomId}
                                                        style={isSelected && !isSoldOut ? { borderColor: '#3BAEF0', backgroundColor: '#E6F5FF' } : {}}
                                                        className={`transition-all duration-200 border ${
                                                            isSoldOut
                                                                ? "opacity-60 cursor-not-allowed border-gray-300"
                                                                : isSelected
                                                                    ? ""
                                                                    : "border-gray-300 hover:border-[#3BAEF0]"
                                                        }`}
                                                        onClick={() => { if (!isSoldOut) { setSelectedHall(room.roomName); } }}
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    {getRoomIcon(room.roomType)}
                                                                    <span className="font-medium text-base">{room.roomName}</span>
                                                                </div>
                                                                <Badge variant="outline" className="text-xs">{room.roomType}</Badge>
                                                            </div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Thời gian:</span>
                                                                    <span className="font-medium">
                                    {selectedTime} - {new Date(room.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Ghế trống:</span>
                                                                    <span className={`font-medium ${isSoldOut ? "text-red-600" : "text-green-600"}`}>
                                    {room.totalSeatAvailable}/{room.totalSeat}
                                  </span>
                                                                </div>
                                                            </div>
                                                            {isSoldOut && (
                                                                <div className="mt-2 pt-2 border-t border-red-200 text-red-600 text-xs">
                                                                    Không thể chọn - Đã hết vé
                                                                </div>
                                                            )}
                                                            {isSelected && !isSoldOut && (
                                                                <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: '#B3E0FF', color: '#3BAEF0' }}>
                                                                    Đã chọn
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Continue */}
                        {selectedTime && (
                            <Card className="shadow-sm border border-gray-200 bg-white">
                                <CardContent className="p-4">
                                    {(() => {
                                        const selectedRoom = rooms.find((room) => room.roomName === selectedHall);
                                        const isSoldOut = selectedRoom?.totalSeatAvailable === 0;
                                        const isDisabled = !selectedHall || isNavigating || isSoldOut;
                                        return (
                                            <Button
                                                onClick={handleContinue}
                                                disabled={isDisabled}
                                                style={{ backgroundColor: '#3BAEF0' }}
                                                className="w-full hover:opacity-90 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                            >
                                                {isNavigating ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span>Đang chuyển trang...</span>
                                                    </div>
                                                ) : isSoldOut ? (
                                                    "Phòng này đã hết vé"
                                                ) : selectedHall ? (
                                                    "Tiếp tục chọn ghế →"
                                                ) : (
                                                    "Vui lòng chọn phòng chiếu"
                                                )}
                                            </Button>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}