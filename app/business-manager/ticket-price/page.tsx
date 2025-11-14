    "use client"

    import { useState, useEffect } from "react"
    import { BusinessManagerLayout } from "@/components/layouts/business-manager-layout"
    import { DynamicPriceTable } from "@/components/business-manager/ticket-price/DynamicPriceTable"
    import { HolidayCalendar } from "@/components/business-manager/ticket-price/HolidayCalendar"
    import type { Holiday } from "@/components/business-manager/ticket-price/HolidayCalendar"
    import apiClient from "@/src/api/interceptor";
    import {toast} from "sonner";


    interface RoomType {
        id: number
        name: string
    }

    interface SeatType {
        id: number
        name: string
    }

    interface TicketPrice {
        roomTypeId: number
        seatTypeId: number
        normalDayPrice: number
        weekendPrice: number
    }

    export default function TicketPricePage() {
        const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
        const [seatTypes, setSeatTypes] = useState<SeatType[]>([])

        const [prices, setPrices] = useState<TicketPrice[]>([])
        const [holidays, setHolidays] = useState<Holiday[]>([])
        const [loading, setLoading] = useState(false)
        const [filterType, setFilterType] = useState("recurring")
        const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
        const handleRefreshHolidays = () => {
            fetchHolidays(filterType, currentYear);
        };


        //  Hàm thay đổi filter
        const onFilterTypeChange = (type: string) => {
            setFilterType(type)
        }

    // 🟢 Fetch holidays theo filterType
        const fetchHolidays = async (type: string, year?: number) => {
            try {
                setLoading(true);
                const res = await apiClient.get(`/holidays`, {
                    params: {
                        filterType: type,
                        page: 1,
                        limit: 100,
                        year: year,
                    },
                });

                const data = res.data.data;
                if (data?.holidays) {
                    setHolidays(data.holidays);
                } else {
                    setHolidays([]);
                }
            } catch (err) {
                console.error("Lỗi khi fetch holidays:", err);
                toast.error("Không thể tải danh sách ngày lễ");
            } finally {
                setLoading(false);
            }
        };
        useEffect(() => {
              fetchHolidays(filterType, currentYear)
        }, [filterType, currentYear]) // 🟢 Gọi lại mỗi khi đổi dropdown


        useEffect(() => {
            const fetchData = async () => {
                try {
                    const [roomRes, seatRes] = await Promise.all([
                        apiClient.get("/api/room-types"),
                        apiClient.get("/api/seat-types"),

                    ])

                    const roomList = roomRes.data.data || roomRes.data
                    const seatListRaw = seatRes.data.data || seatRes.data
                    const seatList = seatListRaw.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                    }))

                    setRoomTypes(roomList)
                    setSeatTypes(seatList)
                } catch (error) {
                    toast.error("Không thể tải dữ liệu bảng giá vé.")
                    console.error(error)
                } finally {
                    setLoading(false)
                }
            }

            fetchData()
        }, [])

        const fetchPrices = async () => {
            try {
                const res = await apiClient.get("/ticket-prices");
                setPrices(res.data.data);
            } catch (err) {
                console.error("Lỗi khi fetch bảng giá vé:", err);
                toast.error("Không thể tải bảng giá vé");
            }
        };
        useEffect(() => {
            fetchPrices();
        }, []);


        return (
            <BusinessManagerLayout activeSection="ticket-price">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý Giá Vé</h1>
                        <p className="text-gray-600 mt-2">Quản lý giá vé theo loại phòng, loại ghế và ngày chiếu</p>
                    </div>

                    {/* Price Table Section */}
                    <DynamicPriceTable roomTypes={roomTypes} seatTypes={seatTypes} prices={prices} onPricesChange={setPrices} />

                    {/* Holiday Calendar Section */}
                    <HolidayCalendar
                        holidays={holidays}
                        onHolidaysChange={setHolidays}
                        loading={loading}
                        filterType={filterType}                // 🟢 thêm prop này
                        onFilterTypeChange={onFilterTypeChange}// 🟢 thêm prop này
                        onYearChange={(year) => {
                       setCurrentYear(year);
                       fetchHolidays(filterType, year);
                     }}
                        onRefresh={handleRefreshHolidays}
                    />


                </div>
            </BusinessManagerLayout>
        )
    }
