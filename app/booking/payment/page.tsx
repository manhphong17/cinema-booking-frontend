"use client"

import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, Smartphone, QrCode, CheckCircle, Clock, MapPin, Users, Calendar, Tag, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

// Mock data
const movieData = {
  id: 1,
  title: "Avengers: Endgame",
  poster: "/generic-superhero-team-poster.png",
  time: "20:00",
  date: "2024-12-20",
  hall: "Hall 1"
}

const paymentMethods = [
  {
    id: "credit-card",
    name: "Thẻ tín dụng/ghi nợ",
    icon: CreditCard,
    description: "Visa, Mastercard, JCB"
  },
  {
    id: "momo",
    name: "Ví MoMo",
    icon: Smartphone,
    description: "Thanh toán qua MoMo"
  },
  {
    id: "vnpay",
    name: "VNPay",
    icon: QrCode,
    description: "Quét QR code VNPay"
  }
]

const vouchers = [
  {
    id: 1,
    code: "WELCOME10",
    name: "Giảm 10% cho khách hàng mới",
    discount: 10,
    type: "percentage",
    minAmount: 100000,
    maxDiscount: 50000,
    validUntil: "2024-12-31"
  },
  {
    id: 2,
    code: "SAVE20K",
    name: "Giảm 20,000 VNĐ",
    discount: 20000,
    type: "fixed",
    minAmount: 150000,
    maxDiscount: 20000,
    validUntil: "2024-12-25"
  },
  {
    id: 3,
    code: "WEEKEND15",
    name: "Giảm 15% cuối tuần",
    discount: 15,
    type: "percentage",
    minAmount: 200000,
    maxDiscount: 100000,
    validUntil: "2024-12-30"
  }
]

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieId = searchParams.get('movieId')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const hall = searchParams.get('hall')
  const seats = searchParams.get('seats')?.split(',') || []
  const combosParam = searchParams.get('combos')
  
  const [selectedPayment, setSelectedPayment] = useState("credit-card")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)

  // Combos (mock)
  const combos = useMemo(() => ([
    { id: 'combo1', name: 'Combo 1', desc: '1 Bắp + 1 Nước', price: 69000 },
    { id: 'combo2', name: 'Combo 2', desc: '1 Bắp + 2 Nước', price: 99000 },
    { id: 'combo3', name: 'Combo VIP', desc: 'Bắp Caramel + 2 Nước lớn', price: 129000 },
  ]), [])
  const [comboQty, setComboQty] = useState<Record<string, number>>({})

  // Initialize comboQty from URL parameters if they exist
  useEffect(() => {
    if (combosParam) {
      try {
        const parsedCombos = JSON.parse(combosParam)
        const comboMap: Record<string, number> = {}
        parsedCombos.forEach((combo: {comboId: string, quantity: number}) => {
          const comboData = combos.find(c => c.id === combo.comboId)
          if (comboData) {
            comboMap[comboData.id] = combo.quantity
          }
        })
        setComboQty(comboMap)
      } catch (e) {
        console.error('Error parsing combos from URL:', e)
      }
    }
  }, [combosParam])

  const combosTotal = useMemo(() => {
    return combos.reduce((sum, c) => sum + (comboQty[c.id] || 0) * c.price, 0)
  }, [combos, comboQty])

  const calculateTicketTotal = () => {
    return seats.reduce((total, seatId) => {
      const row = seatId[0]
      if (row === 'H') return total + 200000
      if (['E', 'F', 'G'].includes(row)) return total + 150000
      return total + 100000
    }, 0)
  }

  const calculateVoucherDiscount = () => {
    if (!appliedVoucher) return 0
    const subtotal = calculateTicketTotal() + combosTotal
    if (subtotal < appliedVoucher.minAmount) return 0
    
    if (appliedVoucher.type === 'percentage') {
      const discount = (subtotal * appliedVoucher.discount) / 100
      return Math.min(discount, appliedVoucher.maxDiscount)
    } else {
      return Math.min(appliedVoucher.discount, appliedVoucher.maxDiscount)
    }
  }

  const calculateTotal = () => {
    const subtotal = calculateTicketTotal() + combosTotal
    const discount = calculateVoucherDiscount()
    return subtotal - discount
  }

  const getSeatType = (seatId: string) => {
    const row = seatId[0]
    if (row === 'H') return 'Premium'
    if (['E', 'F', 'G'].includes(row)) return 'VIP'
    return 'Thường'
  }

  const applyVoucher = () => {
    if (!voucherCode.trim()) {
      alert("Vui lòng nhập mã voucher")
      return
    }
    
    const voucher = vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase())
    if (!voucher) {
      alert("Mã voucher không hợp lệ")
      return
    }
    
    const subtotal = calculateTicketTotal() + combosTotal
    if (subtotal < voucher.minAmount) {
      alert(`Đơn hàng tối thiểu ${voucher.minAmount.toLocaleString('vi-VN')} VNĐ để sử dụng voucher này`)
      return
    }
    
    setAppliedVoucher(voucher)
    setVoucherCode("")
  }

  const removeVoucher = () => {
    setAppliedVoucher(null)
  }

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert("Vui lòng điền đầy đủ thông tin khách hàng")
      return
    }

    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      const bookingId = `BK${Date.now()}`
      router.push(`/booking/confirmation?bookingId=${bookingId}`)
    }, 2000)
  }

  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Thanh toán
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Payment Form */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin khách hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>
                </div>

                {/* Combo Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Chọn combo (tuỳ chọn)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {combos.map((c) => (
                      <div key={c.id} className="border rounded-lg p-4 bg-white">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.desc}</div>
                        <div className="mt-2 text-primary font-bold">{c.price.toLocaleString()}đ</div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setComboQty((q) => ({ ...q, [c.id]: Math.max(0, (q[c.id] || 0) - 1) }))}
                          >
                            -
                          </Button>
                          <div className="w-10 text-center font-semibold">{comboQty[c.id] || 0}</div>
                          <Button
                            variant="outline"
                            onClick={() => setComboQty((q) => ({ ...q, [c.id]: (q[c.id] || 0) + 1 }))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voucher Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Mã giảm giá</h3>
                  {!appliedVoucher ? (
                    <div className="flex gap-2">
                      <Input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Nhập mã voucher"
                        className="flex-1"
                      />
                      <Button onClick={applyVoucher} variant="outline">
                        <Tag className="h-4 w-4 mr-2" />
                        Áp dụng
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800">{appliedVoucher.name}</div>
                          <div className="text-sm text-green-600">Mã: {appliedVoucher.code}</div>
                        </div>
                      </div>
                      <Button onClick={removeVoucher} variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Available Vouchers */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Voucher có sẵn:</div>
                    <div className="grid grid-cols-1 gap-2">
                      {vouchers.map((voucher) => (
                        <div key={voucher.id} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                          <div>
                            <div className="font-medium text-sm">{voucher.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {voucher.type === 'percentage' 
                                ? `Giảm ${voucher.discount}% (tối đa ${voucher.maxDiscount.toLocaleString('vi-VN')} VNĐ)`
                                : `Giảm ${voucher.discount.toLocaleString('vi-VN')} VNĐ`
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Đơn tối thiểu: {voucher.minAmount.toLocaleString('vi-VN')} VNĐ
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setVoucherCode(voucher.code)
                              applyVoucher()
                            }}
                            disabled={appliedVoucher?.id === voucher.id}
                          >
                            {appliedVoucher?.id === voucher.id ? 'Đã áp dụng' : 'Chọn'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Phương thức thanh toán</h3>
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                          <method.icon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">{method.description}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Bằng việc thanh toán, bạn đồng ý với các điều khoản và điều kiện của chúng tôi. 
                    Vé điện tử sẽ được gửi đến email của bạn sau khi thanh toán thành công.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary Sidebar */}
            <Card className="lg:col-span-1 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                        <span>{time || movieData.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{date || movieData.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{hall || movieData.hall}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Seats */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Ghế đã chọn</h4>
                  <div className="space-y-1">
                    {seats.map(seatId => (
                      <div key={seatId} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span>Ghế {seatId}</span>
                          <Badge variant="outline" className="text-xs">
                            {getSeatType(seatId)}
                          </Badge>
                        </div>
                        <span className="font-medium">
                          {(() => {
                            const row = seatId[0]
                            if (row === 'H') return '200,000đ'
                            if (['E', 'F', 'G'].includes(row)) return '150,000đ'
                            return '100,000đ'
                          })()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combo Totals */}
                {Object.values(comboQty).some(qty => qty > 0) && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Combo đã chọn</h4>
                    <div className="space-y-1">
                      {combos.map(combo => {
                        const qty = comboQty[combo.id] || 0
                        if (qty === 0) return null
                        return (
                          <div key={combo.id} className="flex justify-between items-center text-sm">
                            <span>{combo.name} x{qty}</span>
                            <span className="font-medium">{(combo.price * qty).toLocaleString()}đ</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Subtotal and Discount */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Tạm tính:</span>
                    <span>{(calculateTicketTotal() + combosTotal).toLocaleString()}đ</span>
                  </div>
                  
                  {appliedVoucher && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Giảm giá ({appliedVoucher.code}):</span>
                      <span>-{calculateVoucherDiscount().toLocaleString()}đ</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    `Thanh toán ${calculateTotal().toLocaleString()}đ`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
