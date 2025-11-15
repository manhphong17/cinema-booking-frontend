"use client";

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Monitor, Sofa } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Movie } from "@/type/movie";
import { apiClient } from "@/src/api/interceptor";
import { useSeatWebSocket } from "@/hooks/use-seat-websocket";
import { jwtDecode } from "jwt-decode";
import BookingOrderSummary, {
  SeatInfo,
  MovieInfo,
} from "./booking-order-summary";

type TicketResponse = {
  ticketId: number;
  rowIdx: number;
  columnInx: number;
  seatType: string;
  seatStatus: string;
  ticketPrice: number;
};

type ShowtimeSeatData = {
  showTimeId: number;
  roomId: number;
  ticketResponses: TicketResponse[];
};

type ShowtimeSeatResponse = {
  status: number;
  message: string;
  data: ShowtimeSeatData[];
};

// ===============================
// 3️⃣ COMPONENT CHÍNH
// ===============================
export default function SeatSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showtimeIdParam = searchParams.get("showtimeId");

  // =======================================
  // 🟢 STATE CHÍNH & DATA
  // =======================================
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [syncTrigger, setSyncTrigger] = useState(0); // Trigger để sync TTL khi chọn ghế
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimeId, setShowtimeId] = useState<number | null>(null);
  const [seatData, setSeatData] = useState<TicketResponse[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // =======================================
  // 🟢 REFS & TRACKING
  // =======================================
  const releasedSeatsRef = useRef<Set<number>>(new Set()); // Theo dõi ghế vừa được giải phóng bởi user hiện tại
  const sentSeatsRef = useRef<Set<number>>(new Set()); // Theo dõi đã gửi ghế nào qua WebSocket
  const hasRestoredRef = useRef(false); // Theo dõi đã khôi phục ghế chưa để tránh vòng lặp vô hạn

  // =======================================
  // 🟢 WEBSOCKET CALLBACKS
  // =======================================

  // Callback WebSocket khi ghế được giải phóng
  const handleSeatReleased = useCallback(
    (releasedUserId: number, ticketIds: number[]) => {
      // Khi ghế của user hiện tại được giải phóng qua WebSocket, cập nhật seatData local
      // Đảm bảo UI phản ánh việc giải phóng ngay lập tức, kể cả khi backendStatus chưa cập nhật trong API response
      if (releasedUserId === userId) {
        console.log(
          "[SeatSelection] WebSocket RELEASED confirmed, updating local seatData:",
          ticketIds
        );

        // Cập nhật seatData local để phản ánh việc giải phóng
        setSeatData((prev) =>
          prev.map((seat) => {
            if (
              ticketIds.includes(seat.ticketId) &&
              seat.seatStatus === "HELD"
            ) {
              return { ...seat, seatStatus: "AVAILABLE" };
            }
            return seat;
          })
        );

        // Dọn dẹp releasedSeatsRef vì đã cập nhật state local
        ticketIds.forEach((ticketId) => {
          releasedSeatsRef.current.delete(ticketId);
          console.log(
            "[SeatSelection] Đã xóa khỏi releasedSeatsRef - state local đã cập nhật:",
            ticketId
          );
        });
      }
    },
    [userId]
  );

  // Callback WebSocket khi ghế được đặt
  const handleSeatBooked = useCallback(
    (ticketIds: number[]) => {
      // Cập nhật seatData local để phản ánh việc đặt ghế
      setSeatData((prev) =>
        prev.map((seat) => {
          if (ticketIds.includes(seat.ticketId)) {
            return { ...seat, seatStatus: "BOOKED" };
          }
          return seat;
        })
      );

      // Xóa khỏi ghế đã chọn nếu user hiện tại đã chọn những ghế này
      setSelectedTicketIds((prev) =>
        prev.filter((ticketId) => !ticketIds.includes(ticketId))
      );

      // Xóa seatId tương ứng khỏi selectedSeats
      setSelectedSeats((prev) => {
        return prev.filter((seatId) => {
          // Tìm ticketId cho seatId này từ seatData hiện tại
          const seat = seatData.find((ticket) => {
            const rowLabel = String.fromCharCode(65 + ticket.rowIdx);
            const seatNumber = ticket.columnInx + 1;
            const expectedSeatId = `${rowLabel}${seatNumber}`;
            return expectedSeatId === seatId;
          });
          const ticketId = seat?.ticketId;
          return ticketId === undefined || !ticketIds.includes(ticketId);
        });
      });

      // Dọn dẹp sentSeatsRef
      ticketIds.forEach((ticketId) => {
        sentSeatsRef.current.delete(ticketId);
        releasedSeatsRef.current.delete(ticketId);
      });
    },
    [seatData]
  );

  const { isConnected, heldSeats, seatsByUser, selectSeats, deselectSeats } =
    useSeatWebSocket(
      showtimeId,
      userId,
      !!showtimeId && !!userId,
      handleSeatReleased,
      handleSeatBooked
    );

  // =======================================
  // 🟢 useEffect — INIT & LOAD DATA
  // =======================================
  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const decoded: any = jwtDecode(token);
        setUserId(decoded.userId);
      }
    } catch (error) {
      console.error("[Seats Page] Error decoding token:", error);
    }
  }, []);

  useEffect(() => {
    const fetchSeatData = async () => {
      if (!showtimeIdParam) {
        console.error("❌ Missing showtimeId parameter!");
        setLoadingSeats(false);
        return;
      }

      const startTime = Date.now();
      try {
        setLoadingSeats(true);

        const showtimeIdNum = parseInt(showtimeIdParam);
        if (isNaN(showtimeIdNum)) {
          console.error("❌ Invalid showtimeId parameter!");
          setLoadingSeats(false);
          return;
        }

        setShowtimeId(showtimeIdNum);

        console.log(
          "[SeatSelection] Fetching seat data for showtimeId:",
          showtimeIdNum
        );
        const response = await apiClient.get<ShowtimeSeatResponse>(
          `/bookings/show-times/${showtimeIdNum}/seats`
        );

        console.log("[SeatSelection] Seat data response:", response.data);

        if (response.data?.status === 200 && response.data?.data?.length > 0) {
          const data = response.data.data[0];
          setShowtimeId(data.showTimeId);
          const tickets = data.ticketResponses;
          console.log(
            "[SeatSelection] Setting seat data, ticket count:",
            tickets.length
          );
          setSeatData(tickets);

          // Reset cờ khôi phục khi fetch ghế mới (showtime mới hoặc reload)
          hasRestoredRef.current = false;
          // Xóa releasedSeatsRef khi fetch ghế mới (showtime mới hoặc reload)
          releasedSeatsRef.current.clear();

          // Thử lấy chi tiết showtime từ order session để lấy thông tin phim, ngày, giờ, phòng
          if (userId) {
            try {
              const orderSessionResponse = await apiClient.get(
                `/bookings/show-times/${showtimeIdNum}/users/${userId}/seat-hold`
              );
              if (
                orderSessionResponse.data?.status === 200 &&
                orderSessionResponse.data?.data
              ) {
                const orderSession = orderSessionResponse.data.data;
                // Trích xuất thông tin phim nếu có
                if (orderSession.movieId) {
                  try {
                    const movieResponse = await apiClient.get(
                      `/movies/${orderSession.movieId}`
                    );
                    if (
                      movieResponse.data?.status === 200 &&
                      movieResponse.data?.data
                    ) {
                      setMovie(movieResponse.data.data);
                    }
                  } catch (error) {
                    console.error("Error fetching movie details:", error);
                  }
                }
              }
            } catch (error) {
              console.log(
                "[SeatSelection] No order session found, will fetch movie later if needed"
              );
            }
          }
        } else {
          console.error("❌ No seat data received from API:", response.data);
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < 10000) {
            toast.error("Không có dữ liệu ghế từ server. Vui lòng thử lại.");
          }
        }
      } catch (error: any) {
        console.error("Error fetching seat data:", error);
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 10000) {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Không thể tải sơ đồ ghế";
          toast.error(errorMessage);
        }
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeatData();
  }, [showtimeIdParam, userId]);

  // =======================================
  // 🟢 useEffect — KHÔI PHỤC GHẾ ĐÃ GIỮ
  // =======================================
  useEffect(() => {
    if (!userId || !showtimeId || !seatData.length) return;
    if (hasRestoredRef.current) return; // Đã khôi phục rồi

    const restoreHeldSeats = async () => {
      try {
        const response = await apiClient.get<{
          status: number;
          message: string;
          data: {
            seats: Array<{
              ticketId: number;
              rowIdx: number;
              columnIdx: number;
              seatType: string;
              status: string;
            }>;
          };
        }>(`/bookings/show-times/${showtimeId}/users/${userId}/seat-hold`);

        if (response.data?.status === 200 && response.data?.data?.seats) {
          const heldSeats = response.data.data.seats;
          const restoredSeats: string[] = [];
          const restoredTicketIds: number[] = [];

          heldSeats.forEach((seat) => {
            const rowLabel = String.fromCharCode(65 + seat.rowIdx);
            const seatNumber = seat.columnIdx + 1;
            const seatId = `${rowLabel}${seatNumber}`;
            restoredSeats.push(seatId);
            restoredTicketIds.push(seat.ticketId);
          });

          console.log(
            "[SeatSelection] Restoring held seats from API:",
            restoredSeats
          );
          if (restoredSeats.length > 0) {
            hasRestoredRef.current = true;
            setSelectedSeats(restoredSeats);
            setSelectedTicketIds(restoredTicketIds);
            // Xóa releasedSeatsRef khi khôi phục - những ghế này đang được khôi phục, không phải giải phóng
            restoredTicketIds.forEach((ticketId) => {
              releasedSeatsRef.current.delete(ticketId);
            });
          } else {
            // Nếu không có ghế nào để khôi phục, xóa releasedSeatsRef cho showtime này
            releasedSeatsRef.current.clear();
          }
        }
      } catch (error) {
        // Không có ghế đã giữ hoặc lỗi - bỏ qua
        console.log(
          "[SeatSelection] Không có ghế đã giữ để khôi phục hoặc lỗi:",
          error
        );
      }
    };

    restoreHeldSeats();
  }, [userId, showtimeId, seatData]);

  // =======================================
  // 🟢 useEffect — ĐỒNG BỘ WEBSOCKET
  // =======================================
  useEffect(() => {
    if (
      !isConnected ||
      !showtimeId ||
      !userId ||
      selectedTicketIds.length === 0
    )
      return;

    // Chỉ lấy những ghế MỚI chưa được gửi qua WebSocket
    const newTicketsToSelect = selectedTicketIds.filter((ticketId) => {
      // Đã gửi rồi, bỏ qua
      if (sentSeatsRef.current.has(ticketId)) {
        return false;
      }

      // Kiểm tra xem ghế này có được giữ bởi người khác không (không phải user hiện tại)
      if (!heldSeats.has(ticketId)) {
        // Không được giữ bởi ai, có thể chọn
        return true;
      }

      // Kiểm tra xem có được giữ bởi user hiện tại không
      const currentUserSeats = userId ? seatsByUser.get(userId) : null;
      if (currentUserSeats && currentUserSeats.has(ticketId)) {
        // Được giữ bởi user hiện tại, có thể chọn
        return true;
      }

      // Được giữ bởi người khác, không thể chọn
      return false;
    });

    if (newTicketsToSelect.length > 0) {
      // Đánh dấu đã gửi những ghế này
      newTicketsToSelect.forEach((ticketId) =>
        sentSeatsRef.current.add(ticketId)
      );
      selectSeats(newTicketsToSelect);
    }
  }, [
    isConnected,
    showtimeId,
    userId,
    selectedTicketIds,
    selectSeats,
    heldSeats,
    seatsByUser,
  ]);

  // =======================================
  // 🟢 useEffect — DỌN DẸP
  // =======================================
  useEffect(() => {
    // So sánh với selectedTicketIds hiện tại
    const currentSelectedSet = new Set(selectedTicketIds);
    const toRemove: number[] = [];

    sentSeatsRef.current.forEach((ticketId: number) => {
      if (!currentSelectedSet.has(ticketId)) {
        // Ghế này không còn trong selectedTicketIds nữa, xóa khỏi sentSeatsRef
        toRemove.push(ticketId);
      }
    });

    toRemove.forEach((ticketId) => sentSeatsRef.current.delete(ticketId));
  }, [selectedTicketIds]);

  // Dọn dẹp releasedSeatsRef khi backendStatus không còn là HELD
  // Dọn dẹp chính xảy ra qua handleSeatReleased khi WebSocket xác nhận message RELEASED
  // Đây chỉ là phương án dự phòng trong trường hợp bỏ lỡ message WebSocket
  useEffect(() => {
    if (!seatData.length) return;

    releasedSeatsRef.current.forEach((ticketId) => {
      // Kiểm tra xem backendStatus có còn là HELD cho ghế này không
      const seat = seatData.find((t) => t.ticketId === ticketId);
      const backendStatus = seat?.seatStatus || "AVAILABLE";

      // Xóa khỏi releasedSeatsRef nếu backendStatus KHÔNG phải HELD (dọn dẹp dự phòng)
      if (backendStatus !== "HELD") {
        releasedSeatsRef.current.delete(ticketId);
        console.log(
          "[SeatSelection] Đã xóa khỏi releasedSeatsRef - backendStatus đã cập nhật (dự phòng):",
          ticketId,
          backendStatus
        );
      }
    });
  }, [seatData]);

  // =======================================
  // 🟢 HÀM HỖ TRỢ
  // =======================================
  const getTicketId = (seatId: string): number | null => {
    const seat = seatData.find((ticket) => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx);
      const seatNumber = ticket.columnInx + 1;
      const expectedSeatId = `${rowLabel}${seatNumber}`;
      return expectedSeatId === seatId;
    });
    return seat?.ticketId || null;
  };

  // =======================================
  // 🟢 XỬ LÝ SỰ KIỆN
  // =======================================
  const handleSeatClick = (
    seatId: string,
    isOccupied: boolean,
    isHeld: boolean
  ) => {
    console.log("[handleSeatClick] Được gọi với:", {
      seatId,
      isOccupied,
      isHeld,
    });
    const ticketId = getTicketId(seatId);
    if (!ticketId) {
      console.log("[handleSeatClick] Không tìm thấy ticketId cho ghế:", seatId);
      return;
    }

    // Nếu ghế đã được chọn bởi user hiện tại, cho phép bỏ chọn
    const isSelectedByCurrentUser = selectedSeats.includes(seatId);
    console.log(
      "[handleSeatClick] isSelectedByCurrentUser:",
      isSelectedByCurrentUser
    );

    if (isSelectedByCurrentUser) {
      // Luôn cho phép bỏ chọn nếu ghế được chọn bởi user hiện tại
      // Kiểm tra trực tiếp xem ghế có được giữ bởi người khác không (không dựa vào tham số isHeld)
      const isHeldByOther =
        userId && seatsByUser
          ? Array.from(seatsByUser.entries()).some(
              ([otherUserId, seats]) =>
                otherUserId !== userId && seats.has(ticketId)
            )
          : false;

      if (isHeldByOther) {
        // Không thể bỏ chọn ghế được giữ bởi người khác
        console.log("Không thể bỏ chọn: ghế được giữ bởi user khác");
        return;
      }

      // Kiểm tra xem ghế có bị đặt, bảo trì, hoặc chặn không - không thể bỏ chọn những ghế đó
      const seatFromData = seatData.find((t) => t.ticketId === ticketId);
      const backendStatus = seatFromData?.seatStatus || "AVAILABLE";
      if (
        backendStatus === "BOOKED" ||
        backendStatus === "UNAVAILABLE" ||
        backendStatus === "BLOCKED"
      ) {
        console.log("Không thể bỏ chọn: ghế đã được đặt, không khả dụng, hoặc bị chặn");
        return;
      }

      const newSelectedSeats = selectedSeats.filter((id) => id !== seatId);
      const newSelectedTicketIds = selectedTicketIds.filter(
        (id) => id !== ticketId
      );

      // Trigger sync TTL nếu có ghế được chọn
      if (newSelectedSeats.length > 0) {
        setSyncTrigger((prev) => prev + 1);
      } else {
        // Nếu không còn ghế nào, không cần trigger (TTL sẽ tự động hết)
        setSyncTrigger(0);
      }

      setSelectedSeats(newSelectedSeats);
      setSelectedTicketIds(newSelectedTicketIds);

      // Xóa khỏi sentSeatsRef khi user bỏ chọn
      // (sẽ được cleanup tự động bởi useEffect ở trên, nhưng xóa ngay để chắc chắn)
      sentSeatsRef.current.delete(ticketId);

      // Đánh dấu là đã giải phóng để bỏ qua backendStatus HELD cũ
      releasedSeatsRef.current.add(ticketId);

      // Bỏ chọn qua WebSocket - điều này sẽ giải phóng hold trên backend
      console.log(
        "[SeatSelection] Đang bỏ chọn ghế:",
        seatId,
        "ticketId:",
        ticketId,
        "isConnected:",
        isConnected
      );
      if (isConnected) {
        deselectSeats([ticketId]);
      } else {
        console.warn(
          "[SeatSelection] WebSocket chưa kết nối, không thể bỏ chọn qua WebSocket"
        );
      }
      return;
    }

    // Để chọn ghế mới, kiểm tra xem có bị chiếm hoặc giữ không
    if (isOccupied || isHeld) return;

    const seatType = getSeatType(seatId);

    const seatsOfSameType = selectedSeats.filter(
      (id) => getSeatType(id) === seatType
    );

    if (seatsOfSameType.length >= 8) {
      alert(
        `Bạn chỉ có thể chọn tối đa 8 ghế ${
          seatType === "vip" ? "VIP" : "thường"
        } cùng loại`
      );
      return;
    }

    const newSelectedSeats = [...selectedSeats, seatId];
    const newSelectedTicketIds = [...selectedTicketIds, ticketId];

    setSelectedSeats(newSelectedSeats);
    setSelectedTicketIds(newSelectedTicketIds);

    // Đánh dấu ghế này đã được chọn (sẽ được gửi qua WebSocket bởi useEffect)
    // KHÔNG gọi selectSeats trực tiếp ở đây để tránh duplicate calls
    // useEffect sẽ tự động gửi ghế mới qua WebSocket

    // Trigger sync TTL ngay khi user chọn ghế (backend sẽ tạo seatHold với TTL)
    setSyncTrigger((prev) => prev + 1);

    // Note: selectSeats sẽ được gọi tự động bởi useEffect khi selectedTicketIds thay đổi
    // Không cần gọi trực tiếp ở đây để tránh duplicate calls
  };

  const handleContinue = () => {
    if (selectedSeats.length > 0 && showtimeId) {
      router.push(`/booking/combo?showtimeId=${showtimeId}`);
    }
  };

  // =======================================
  // 🟢 HÀM LAYOUT & TÍNH TOÁN
  // =======================================
  const getSeatLayout = () => {
    if (seatData.length === 0) return [];

    const layout: Record<
      number,
      {
        row: string;
        seats: Array<{
          id: string;
          type: string;
          price: number;
          ticketId: number;
        }>;
      }
    > = {};

    seatData.forEach((ticket) => {
      const rowIndex = ticket.rowIdx;
      const rowLabel = String.fromCharCode(65 + rowIndex);

      if (!layout[rowIndex]) {
        layout[rowIndex] = { row: rowLabel, seats: [] };
      }

      const seatNumber = ticket.columnInx + 1;
      const seatId = `${rowLabel}${seatNumber}`;
      const seatType = ticket.seatType.toLowerCase();
      const price = ticket.ticketPrice;

      layout[rowIndex].seats.push({
        id: seatId,
        type: seatType,
        price,
        ticketId: ticket.ticketId,
      });
    });

    return Object.values(layout)
      .map((row) => ({
        ...row,
        seats: row.seats.sort(
          (a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1))
        ),
      }))
      .sort((a, b) => a.row.localeCompare(b.row));
  };

  const getSeatType = (seatId: string) => {
    if (seatData.length === 0) return "standard";

    const seat = seatData.find((ticket) => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx);
      const seatNumber = ticket.columnInx + 1;
      const expectedSeatId = `${rowLabel}${seatNumber}`;
      return expectedSeatId === seatId;
    });

    return seat ? seat.seatType.toLowerCase() : "standard";
  };

  const getSeatPrice = (seatId: string) => {
    if (seatData.length === 0) return 100000;

    const seat = seatData.find((ticket) => {
      const rowLabel = String.fromCharCode(65 + ticket.rowIdx);
      const seatNumber = ticket.columnInx + 1;
      const expectedSeatId = `${rowLabel}${seatNumber}`;
      return expectedSeatId === seatId;
    });

    return seat ? seat.ticketPrice : 100000;
  };

  const calculateTotal = () => {
    return selectedSeats.reduce(
      (total, seatId) => total + getSeatPrice(seatId),
      0
    );
  };

  const getSeatTypeCount = (type: string) => {
    return selectedSeats.filter((seatId) => getSeatType(seatId) === type)
      .length;
  };

  const isSeatTypeLimitReached = (type: string) => {
    return getSeatTypeCount(type) >= 8;
  };

  // =======================================
  // 🟢 useMemo — GIÁ TRỊ TÍNH TOÁN
  // =======================================
  const seatsInfo: SeatInfo[] = useMemo(() => {
    if (!selectedSeats.length || !seatData.length) {
      console.log("[seatsInfo] Empty:", {
        selectedSeatsLength: selectedSeats.length,
        seatDataLength: seatData.length,
      });
      return [];
    }

    const info = selectedSeats.map((seatId) => ({
      id: seatId,
      type: getSeatType(seatId),
      price: getSeatPrice(seatId),
    }));
    console.log("[seatsInfo] Calculated:", info);
    return info;
  }, [selectedSeats, seatData]);

  const movieInfo: MovieInfo | undefined = useMemo(() => {
    if (!movie) return undefined;
    return {
      title: movie.name,
      poster: movie.posterUrl,
    };
  }, [movie]);

  const seatsTotal = useMemo(() => {
    const total = calculateTotal();
    console.log(
      "[seatsTotal] Calculated:",
      total,
      "selectedSeats:",
      selectedSeats
    );
    return total;
  }, [selectedSeats, seatData]);

  // =======================================
  // 🟢 RETURN UI
  // =======================================
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* Decorative Border Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Seat Selection */}
          <div className="lg:col-span-3">
            <Card
              className="shadow-2xl border-2 bg-white hover:shadow-2xl transition-all duration-300"
              style={{ borderColor: "#B3E0FF" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#3BAEF0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#B3E0FF")
              }
            >
              <CardHeader
                className="border-b-2"
                style={{
                  background:
                    "linear-gradient(to right, #E6F5FF, white, #E6F5FF)",
                  borderColor: "#B3E0FF",
                }}
              >
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div
                    className="p-2 rounded-lg text-white shadow-lg"
                    style={{
                      background:
                        "linear-gradient(to bottom right, #3BAEF0, #38AAEC)",
                    }}
                  >
                    <Sofa className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold">Sơ đồ ghế</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Screen */}
                <div className="text-center mb-8">
                  <div className="relative">
                    <div
                      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-6 px-12 rounded-2xl mx-auto inline-block font-bold text-lg shadow-2xl border-4 border-primary/50 transform hover:scale-105 transition-all duration-300"
                      style={{
                        boxShadow:
                          "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 30px rgba(59, 130, 246, 0.4)",
                        background:
                          "linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #334155 75%, #1e293b 100%)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-cyan-500/40 rounded-2xl blur-sm animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-400/20 to-transparent rounded-2xl"></div>
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className="relative">
                          <Monitor className="h-7 w-7 text-blue-400 drop-shadow-lg animate-pulse" />
                          <div className="absolute inset-0 bg-blue-400/50 blur-lg animate-ping"></div>
                          <div className="absolute inset-0 bg-cyan-400/30 blur-md"></div>
                        </div>
                        <span className="text-white drop-shadow-lg tracking-wider font-extrabold text-xl">
                          MÀN HÌNH
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>
                      <div className="absolute inset-0 border-2 border-slate-500/50 rounded-2xl"></div>
                      <div className="absolute inset-1 border border-slate-400/30 rounded-xl"></div>
                    </div>
                    <div className="relative mx-auto mt-3">
                      <div className="w-16 h-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg shadow-lg border border-slate-500/50"></div>
                      <div className="w-20 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-md shadow-md mx-auto -mt-1 border border-slate-600/50"></div>
                      <div className="w-24 h-1 bg-gradient-to-b from-slate-800 to-black rounded-full mx-auto -mt-1 shadow-lg"></div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black/30 rounded-full blur-lg"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-md"></div>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-blue-500/10 rounded-full blur-xl"></div>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-36 h-4 bg-cyan-500/5 rounded-full blur-lg"></div>
                  </div>
                </div>

                {/* Seat Layout */}
                {loadingSeats ? (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl border-2"
                    style={{
                      backgroundColor: "#E6F5FF",
                      borderColor: "#B3E0FF",
                    }}
                  >
                    <Loader2
                      className="h-10 w-10 animate-spin mr-4"
                      style={{ color: "#3BAEF0" }}
                    />
                    <span className="text-lg text-gray-700 font-medium">
                      Đang tải sơ đồ ghế...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-5 flex flex-col items-center">
                    {getSeatLayout().map((row) => {
                      // Kiểm tra xem hàng có ghế VIP không
                      const hasVipSeat = row.seats.some(
                        (seat) => seat.type === "vip" || seat.type === "VIP"
                      );

                      // Nếu có VIP thì màu đỏ nhạt, nếu không thì màu blue như ban đầu
                      const rowColor = hasVipSeat
                        ? {
                            bg: "from-red-100 to-red-200",
                            border: "border-red-300",
                            text: "text-red-900",
                          }
                        : {
                            bg: "from-blue-100 to-blue-200",
                            border: "border-blue-300",
                            text: "text-blue-900",
                          };

                      return (
                        <div key={row.row} className="flex items-center gap-4">
                          <div
                            className={`w-10 text-center font-bold text-base ${rowColor.text} bg-gradient-to-br ${rowColor.bg} rounded-lg py-2 border-2 ${rowColor.border} shadow-md`}
                          >
                            {row.row}
                          </div>
                          <div className="flex gap-2 justify-center">
                            {row.seats.map((seat) => {
                              const ticketId = seat.ticketId;
                              const seatFromData = seatData.find(
                                (t) => t.ticketId === ticketId
                              );
                              const backendStatus =
                                seatFromData?.seatStatus || "AVAILABLE";
                              const isBooked = backendStatus === "BOOKED";
                              const isMaintenance =
                                backendStatus === "UNAVAILABLE";
                              const isBlocked = backendStatus === "BLOCKED";
                              const isSelected = selectedSeats.includes(
                                seat.id
                              );
                              // Nếu ghế được chọn bởi user hiện tại, kiểm tra xem có được giữ bởi user hiện tại không (có thể bỏ chọn)
                              // Ngược lại, kiểm tra xem có được giữ bởi người khác không
                              // Kiểm tra xem ghế có được giữ bởi người khác không (không phải user hiện tại)
                              const isHeldByOther =
                                !isSelected && userId && seatsByUser
                                  ? Array.from(seatsByUser.entries()).some(
                                      ([otherUserId, seats]) =>
                                        otherUserId !== userId &&
                                        seats.has(ticketId)
                                    )
                                  : false;

                              // WebSocket giữ - chỉ khi không được chọn bởi user hiện tại
                              const isHeldByWebSocket =
                                !isSelected && heldSeats.has(ticketId);

                              // Kiểm tra xem ghế này có vừa được giải phóng bởi user hiện tại không
                              // Nếu có, không tin tưởng backendStatus HELD vì có thể chưa được cập nhật
                              const isJustReleased =
                                releasedSeatsRef.current.has(ticketId);

                              // Trạng thái HELD từ backend - tin tưởng nếu:
                              // 1. Ghế không được chọn bởi user hiện tại
                              // 2. VÀ nó không vừa được giải phóng bởi user hiện tại (để tránh trạng thái HELD cũ sau khi giải phóng)
                              // Điều này cho phép hiển thị trạng thái HELD cho ghế được giữ bởi người khác (kể cả khi WebSocket chưa đồng bộ),
                              // nhưng ngăn hiển thị HELD cho ghế vừa được giải phóng bởi user hiện tại
                              const isHeldByBackend =
                                !isSelected &&
                                backendStatus === "HELD" &&
                                !isJustReleased;

                              // Nếu ghế được chọn bởi user hiện tại, nó không được coi là "held" (có thể bỏ chọn)
                              // Kể cả khi backendStatus là HELD, nếu nó được chọn bởi user hiện tại, cho phép bỏ chọn
                              const isHeld =
                                !isSelected &&
                                (isHeldByBackend ||
                                  isHeldByOther ||
                                  isHeldByWebSocket);
                              const isOccupied =
                                isBooked ||
                                isMaintenance ||
                                isBlocked ||
                                isHeld;
                              const seatType = getSeatType(seat.id);
                              const isLimitReached =
                                !isOccupied &&
                                !isSelected &&
                                isSeatTypeLimitReached(seatType);
                              const isDifferentType = false; // Đã bỏ hạn chế: cho phép chọn nhiều loại ghế

                              // Debug: kiểm tra trạng thái disabled
                              const buttonDisabled = isSelected
                                ? isBooked || isMaintenance || isBlocked // Nếu đã chọn, disable nếu đã đặt/bảo trì/chặn
                                : isOccupied ||
                                  isLimitReached ||
                                  isDifferentType; // Nếu chưa chọn, kiểm tra bình thường

                              return (
                                <button
                                  key={seat.id}
                                  onClick={(e) => {
                                    console.log(
                                      "[Button onClick] Seat clicked:",
                                      seat.id,
                                      "isSelected:",
                                      isSelected,
                                      "disabled:",
                                      buttonDisabled
                                    );
                                    if (!buttonDisabled) {
                                      handleSeatClick(
                                        seat.id,
                                        isBooked || isMaintenance || isBlocked,
                                        isHeld
                                      );
                                    } else {
                                      console.log(
                                        "[Button onClick] Button is disabled, click ignored"
                                      );
                                    }
                                  }}
                                  disabled={buttonDisabled}
                                  style={
                                    isBooked
                                      ? {
                                          backgroundColor: "#FD2802",
                                          borderColor: "#FD2802",
                                        }
                                      : isMaintenance
                                      ? {
                                          backgroundColor: "#9CA3AF",
                                          borderColor: "#9CA3AF",
                                        }
                                      : isBlocked || isHeld
                                      ? {
                                          backgroundColor: "#3FB7F9",
                                          borderColor: "#3FB7F9",
                                        }
                                      : isSelected
                                      ? {
                                          backgroundColor: "#03599D",
                                          borderColor: "#03599D",
                                        }
                                      : {
                                          backgroundColor: "#BABBC3",
                                          borderColor: "#BABBC3",
                                        }
                                  }
                                  className={`
                                  w-12 h-12 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center relative border-2
                                ${
                                  isBooked
                                    ? "text-white cursor-not-allowed shadow-xl"
                                    : isMaintenance
                                    ? "text-white cursor-not-allowed shadow-xl"
                                    : isBlocked || isHeld
                                    ? "text-white cursor-not-allowed shadow-xl"
                                    : isLimitReached
                                    ? "opacity-50 cursor-not-allowed"
                                    : isDifferentType
                                    ? "opacity-30 cursor-not-allowed"
                                    : isSelected
                                    ? "text-white scale-110 shadow-2xl ring-2 ring-[#03599D] ring-offset-1 font-extrabold"
                                    : "text-white hover:opacity-90 shadow-lg hover:shadow-xl hover:scale-110"
                                }
                                  active:scale-95
                                `}
                                >
                                  <span className="text-sm font-bold">
                                    {seat.id.slice(1)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-10 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-300 rounded-full"></div>
                    <h4 className="font-bold text-lg text-gray-900">
                      Chú thích ghế
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-md border-2 border-gray-200 hover:shadow-lg transition-all">
                      <div
                        className="w-6 h-6 rounded-lg shadow-md"
                        style={{ backgroundColor: "#BABBC3" }}
                      ></div>
                      <span className="text-gray-900 font-semibold">
                        Ghế trống
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-md border-2 border-gray-200 hover:shadow-lg transition-all">
                      <div
                        className="w-6 h-6 rounded-lg shadow-md ring-1 ring-[#03599D]"
                        style={{ backgroundColor: "#03599D" }}
                      ></div>
                      <span className="text-gray-900 font-semibold">
                        Đang chọn
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-md border-2 border-gray-200 hover:shadow-lg transition-all">
                      <div
                        className="w-6 h-6 rounded-lg shadow-md"
                        style={{ backgroundColor: "#FD2802" }}
                      ></div>
                      <span className="text-gray-900 font-semibold">
                        Đã bán
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-md border-2 border-gray-200 hover:shadow-lg transition-all">
                      <div
                        className="w-6 h-6 rounded-lg shadow-md"
                        style={{ backgroundColor: "#3FB7F9" }}
                      ></div>
                      <span className="text-gray-900 font-semibold">
                        Đang giữ
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <BookingOrderSummary
              movieInfo={movieInfo}
              seats={seatsInfo}
              seatsTotal={seatsTotal}
              total={seatsTotal}
              showtimeId={showtimeId}
              userId={userId}
              movieId={movie?.id?.toString() || null}
              triggerSync={syncTrigger}
              showSeatTypeStats={true}
              actionButton={
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={selectedSeats.length === 0}
                    style={{ backgroundColor: "#38AAEC" }}
                    className="flex-1 hover:opacity-90 text-white font-bold py-4 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">
                      {selectedSeats.length > 0
                        ? "Tiếp tục →"
                        : "Vui lòng chọn ghế"}
                    </span>
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
