"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Ticket, Home, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import apiClient from "@/src/api/interceptor"
import { getOrderDetail } from "@/src/api/orders"

// Helper function to get user role
const getUserRole = (): string | null => {
    if (typeof window === 'undefined') return null

    try {
        const token = localStorage.getItem("accessToken")
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const roles = payload.roles || payload.authorities
            if (roles && Array.isArray(roles) && roles.length > 0) {
                return roles[0].toUpperCase()
            }
        }

        const roleName = localStorage.getItem("roleName")
        if (roleName) {
            try {
                const roles = JSON.parse(roleName)
                if (Array.isArray(roles) && roles.length > 0) {
                    return roles[0].toUpperCase()
                }
            } catch {
                return roleName.toUpperCase()
            }
        }
    } catch (error) {
        console.error('Error getting user role:', error)
    }

    return null
}

// Helper function to get home page based on role
const getHomePage = (): string => {
    const role = getUserRole()
    if (!role) return "/"
    
    const roleUpper = role.toUpperCase()
    if (roleUpper.includes('STAFF')) {
        return "/staff"
    } else if (roleUpper.includes('CUSTOMER')) {
        return "/home"
    }
    
    return "/"
}

export default function ConfirmationPage() {
    const router = useRouter()
    const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">("PENDING")
    const [loading, setLoading] = useState(true)
    const [orderId, setOrderId] = useState<number | null>(null)
    const [orderDetail, setOrderDetail] = useState<any>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    // Get user role on mount
    useEffect(() => {
        setUserRole(getUserRole())
    }, [])

    //  Call backend API to verify payment result
    useEffect(() => {
        const fetchReturn = async () => {
            try {
                const query = window.location.search
                const data = await apiClient.get(`/payment/return${query}`)
                const responseData = data.data?.data
                
                if (responseData?.status === "SUCCESS") {
                    setStatus("SUCCESS")
                    
                    // Try to get orderId from response or URL params
                    const params = new URLSearchParams(query)
                    // Try to get orderId from URL params first
                    const orderIdParam = params.get('orderId')
                    if (orderIdParam) {
                        setOrderId(Number(orderIdParam))
                    } else if (responseData?.orderId) {
                        setOrderId(responseData.orderId)
                    } else if (responseData?.orderCode) {
                        // If we only have orderCode, we might need to search for order
                        // For now, we'll try to get it from the response
                        // Backend might include orderId in response
                        console.log("OrderCode from response:", responseData.orderCode)
                    }
                } else {
                    setStatus("FAILED")
                }

            } catch (error) {
                console.error("Error verifying VNPay return:", error)
                setStatus("FAILED")
            } finally {
                setLoading(false)
            }
        }
        fetchReturn()
    }, [])

    // Fetch order detail when orderId is available (for printing)
    useEffect(() => {
        const fetchOrderDetail = async () => {
            if (orderId && status === "SUCCESS") {
                try {
                    const detail = await getOrderDetail(orderId)
                    // getOrderDetail returns OrderDetail directly, but check if it's wrapped
                    setOrderDetail(detail?.data?.data || detail?.data || detail)
                } catch (error: any) {
                    console.error("Error fetching order detail:", error)
                    // If orderId is not available, we might need orderCode to search
                    const query = window.location.search
                    const params = new URLSearchParams(query)
                    const orderCode = params.get('orderCode') || params.get('vnp_TxnRef')
                    if (orderCode) {
                        console.log("OrderCode available but orderId fetch failed:", orderCode)
                        // Note: Backend might need an API to get order by code
                    }
                }
            }
        }
        fetchOrderDetail()
    }, [orderId, status])

    const handleGoHome = () => {
        const homePage = getHomePage()
        router.push(homePage)
    }

    const handlePrintTicket = () => {
        if (!orderDetail) {
            alert("Không thể tải thông tin vé để in. Vui lòng thử lại sau.")
            return
        }

        // Create print window
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert("Vui lòng cho phép popup để in vé")
            return
        }

        const printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>In vé - ${orderDetail.orderCode || 'Vé xem phim'}</title>
    <style>
        @media print {
            @page {
                size: A5;
                margin: 10mm;
            }
            body {
                margin: 0;
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .ticket {
            border: 2px dashed #333;
            padding: 20px;
            border-radius: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .ticket-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            padding-bottom: 15px;
        }
        .ticket-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .ticket-header h2 {
            margin: 5px 0 0 0;
            font-size: 18px;
            font-weight: normal;
            opacity: 0.9;
        }
        .ticket-body {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        .ticket-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .ticket-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .ticket-label {
            font-weight: 600;
            opacity: 0.9;
        }
        .ticket-value {
            font-weight: bold;
            text-align: right;
        }
        .ticket-seats {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .seat-badge {
            background: rgba(255,255,255,0.2);
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        .ticket-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid rgba(255,255,255,0.3);
            font-size: 12px;
            opacity: 0.8;
        }
        .print-button {
            text-align: center;
            margin-top: 20px;
        }
        .print-button button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
        }
        .print-button button:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="ticket-header">
            <h1>PHT CINEMA</h1>
            <h2>VÉ XEM PHIM</h2>
        </div>
        
        <div class="ticket-body">
            <div class="ticket-row">
                <span class="ticket-label">Mã đơn hàng:</span>
                <span class="ticket-value">${orderDetail.orderCode || 'N/A'}</span>
            </div>
            
            ${orderDetail.movieName ? `
            <div class="ticket-row">
                <span class="ticket-label">Phim:</span>
                <span class="ticket-value">${orderDetail.movieName}</span>
            </div>
            ` : ''}
            
            ${orderDetail.roomName ? `
            <div class="ticket-row">
                <span class="ticket-label">Phòng chiếu:</span>
                <span class="ticket-value">${orderDetail.roomName}</span>
            </div>
            ` : ''}
            
            ${orderDetail.showtimeStart ? `
            <div class="ticket-row">
                <span class="ticket-label">Ngày chiếu:</span>
                <span class="ticket-value">${new Date(orderDetail.showtimeStart).toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label">Giờ chiếu:</span>
                <span class="ticket-value">${new Date(orderDetail.showtimeStart).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}</span>
            </div>
            ` : ''}
            
            ${orderDetail.seats && orderDetail.seats.length > 0 ? `
            <div class="ticket-row">
                <div style="width: 100%;">
                    <span class="ticket-label">Ghế ngồi:</span>
                    <div class="ticket-seats">
                        ${orderDetail.seats.map((seat: string) => `<span class="seat-badge">${seat}</span>`).join('')}
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${orderDetail.userName ? `
            <div class="ticket-row">
                <span class="ticket-label">Khách hàng:</span>
                <span class="ticket-value">${orderDetail.userName}</span>
            </div>
            ` : ''}
            
            <div class="ticket-row">
                <span class="ticket-label">Tổng tiền:</span>
                <span class="ticket-value">${orderDetail.totalPrice?.toLocaleString('vi-VN') || '0'} ₫</span>
            </div>
            
            ${orderDetail.reservationCode ? `
            <div class="ticket-row">
                <span class="ticket-label">Mã đặt chỗ:</span>
                <span class="ticket-value">${orderDetail.reservationCode}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="ticket-footer">
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Vui lòng đến sớm 15 phút trước giờ chiếu</p>
            <p>${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>
    
    <div class="print-button no-print">
        <button onclick="window.print()">In vé</button>
    </div>
</body>
</html>
        `

        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Auto print after content loads
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-500 bg-gradient-to-b from-background to-gray-50/50">
                Đang xác minh giao dịch...
            </div>
        )
    }

    const isSuccess = status === "SUCCESS"

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-background to-gray-50/50">
            <div className="container mx-auto px-4 pt-10 pb-8 flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-8">
                    <div
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                            isSuccess ? "bg-green-100" : "bg-red-100"
                        }`}
                    >
                        {isSuccess ? (
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        ) : (
                            <XCircle className="h-10 w-10 text-red-600" />
                        )}
                    </div>

                    <h1
                        className={`text-2xl font-semibold mb-3 ${
                            isSuccess ? "text-green-700" : "text-red-700"
                        }`}
                    >
                        {isSuccess ? "Thanh toán thành công 🎉" : "Thanh toán không thành công 😢"}
                    </h1>

                    <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
                        {isSuccess
                            ? "Cảm ơn bạn đã hoàn tất thanh toán! Vé điện tử của bạn đã sẵn sàng xem trong mục 'Đơn hàng của tôi'."
                            : "Rất tiếc, giao dịch của bạn chưa được hoàn tất. Vui lòng kiểm tra lại hoặc thử thanh toán lại sau."}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {isSuccess ? (
                        <>
                            <Button
                                onClick={handleGoHome}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Home className="h-4 w-4 mr-2" /> Về trang chủ
                            </Button>
                            {userRole && userRole.includes('STAFF') ? (
                                <Button
                                    variant="outline"
                                    onClick={handlePrintTicket}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                    <Printer className="h-4 w-4 mr-2" /> In vé
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/customer?section=orders")}
                                >
                                    <Ticket className="h-4 w-4 mr-2" /> Xem vé điện tử
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            onClick={handleGoHome}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Home className="h-4 w-4 mr-2" /> Về trang chủ
                        </Button>
                    )}
                </div>
            </div>
        </div>

    )
}
