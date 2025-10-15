import { HomeLayout } from "@/components/layouts/home-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Percent, Calendar, Users } from "lucide-react"

const vouchers = [
  {
    id: 1,
    title: "Giảm 20% Combo Bắp Nước",
    description: "Áp dụng cho combo bắp nước bất kỳ",
    discount: "20%",
    code: "COMBO20",
    validUntil: "31/12/2024",
    minOrder: "100,000đ",
    type: "combo"
  },
  {
    id: 2,
    title: "Mua 2 Tặng 1 Vé",
    description: "Mua 2 vé bất kỳ, tặng 1 vé cùng loại",
    discount: "50%",
    code: "BUY2GET1",
    validUntil: "15/01/2025",
    minOrder: "200,000đ",
    type: "ticket"
  },
  {
    id: 3,
    title: "Giảm 30% Vé IMAX",
    description: "Áp dụng cho tất cả suất chiếu IMAX",
    discount: "30%",
    code: "IMAX30",
    validUntil: "28/02/2025",
    minOrder: "150,000đ",
    type: "imax"
  },
  {
    id: 4,
    title: "Combo Gia Đình",
    description: "4 vé + 2 bắp + 2 nước",
    discount: "25%",
    code: "FAMILY25",
    validUntil: "20/03/2025",
    minOrder: "300,000đ",
    type: "family"
  }
]

export default function VouchersPage() {
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Voucher & Ưu đãi
              </span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
            <p className="text-lg text-muted-foreground mt-4">
              Khám phá những ưu đãi hấp dẫn dành cho bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher) => (
              <Card key={voucher.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-white border-0 shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`${
                        voucher.type === 'combo' ? 'bg-orange-100 text-orange-700' :
                        voucher.type === 'ticket' ? 'bg-blue-100 text-blue-700' :
                        voucher.type === 'imax' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}
                    >
                      {voucher.type === 'combo' ? 'Combo' :
                       voucher.type === 'ticket' ? 'Vé phim' :
                       voucher.type === 'imax' ? 'IMAX' : 'Gia đình'}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{voucher.discount}</div>
                      <div className="text-xs text-muted-foreground">Giảm giá</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                      {voucher.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{voucher.description}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{voucher.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>HSD: {voucher.validUntil}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Đơn tối thiểu: {voucher.minOrder}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-primary/20 rounded-lg">
                    Sử dụng ngay
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}
