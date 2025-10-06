"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Showtime {
  id: string
  movie: string
  room: string
  startTime: string
  endTime: string
  price: number
  status: "pending" | "approved"
}

export function ShowtimeManagement() {
  const { toast } = useToast()
  const [showtimes, setShowtimes] = useState<Showtime[]>([
    {
      id: "1",
      movie: "Spider-Man: No Way Home",
      room: "Phòng 1 - Standard",
      startTime: "2024-12-15T14:00",
      endTime: "2024-12-15T16:30",
      price: 100000,
      status: "approved",
    },
    {
      id: "2",
      movie: "Top Gun: Maverick",
      room: "Phòng 2 - VIP",
      startTime: "2024-12-15T18:00",
      endTime: "2024-12-15T20:15",
      price: 150000,
      status: "pending",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null)
  const [formData, setFormData] = useState({
    movie: "",
    room: "",
    startTime: "",
    endTime: "",
    price: "",
  })

  const handleSubmit = () => {
    if (editingShowtime) {
      setShowtimes(
        showtimes.map((s) =>
          s.id === editingShowtime.id ? { ...editingShowtime, ...formData, price: Number(formData.price) } : s,
        ),
      )
      toast({ title: "Cập nhật thành công", description: "Suất chiếu đã được cập nhật" })
    } else {
      const newShowtime: Showtime = {
        id: Date.now().toString(),
        ...formData,
        price: Number(formData.price),
        status: "pending",
      }
      setShowtimes([...showtimes, newShowtime])
      toast({ title: "Thêm thành công", description: "Suất chiếu mới đã được thêm" })
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setShowtimes(showtimes.filter((s) => s.id !== id))
    toast({ title: "Xóa thành công", description: "Suất chiếu đã được xóa" })
  }

  const handleSendApproval = (id: string) => {
    setShowtimes(showtimes.map((s) => (s.id === id ? { ...s, status: "approved" as const } : s)))
    toast({ title: "Gửi phê duyệt", description: "Suất chiếu đã được gửi phê duyệt" })
  }

  const resetForm = () => {
    setFormData({ movie: "", room: "", startTime: "", endTime: "", price: "" })
    setEditingShowtime(null)
  }

  const openEditDialog = (showtime: Showtime) => {
    setEditingShowtime(showtime)
    setFormData({
      movie: showtime.movie,
      room: showtime.room,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      price: showtime.price.toString(),
    })
    setIsDialogOpen(true)
  }

  const ShowtimeTable = ({ showtimes }: { showtimes: Showtime[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-muted/50">
          <TableHead className="text-muted-foreground">Phim</TableHead>
          <TableHead className="text-muted-foreground">Phòng chiếu</TableHead>
          <TableHead className="text-muted-foreground">Giờ bắt đầu</TableHead>
          <TableHead className="text-muted-foreground">Giờ kết thúc</TableHead>
          <TableHead className="text-muted-foreground">Giá vé</TableHead>
          <TableHead className="text-muted-foreground">Trạng thái</TableHead>
          <TableHead className="text-muted-foreground">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {showtimes.map((showtime) => (
          <TableRow key={showtime.id} className="border-border hover:bg-muted/30">
            <TableCell className="font-medium text-foreground">{showtime.movie}</TableCell>
            <TableCell className="text-foreground">{showtime.room}</TableCell>
            <TableCell className="text-foreground">{new Date(showtime.startTime).toLocaleString("vi-VN")}</TableCell>
            <TableCell className="text-foreground">{new Date(showtime.endTime).toLocaleString("vi-VN")}</TableCell>
            <TableCell className="text-foreground">{showtime.price.toLocaleString("vi-VN")} ₫</TableCell>
            <TableCell>
              <Badge
                variant={showtime.status === "approved" ? "default" : "secondary"}
                className={
                  showtime.status === "approved"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              >
                {showtime.status === "approved" ? "Đã duyệt" : "Đang đợi"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(showtime)}
                  className="text-foreground hover:bg-muted"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(showtime.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {showtime.status === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSendApproval(showtime.id)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Suất chiếu</h1>
          <p className="text-muted-foreground mt-1">Quản lý lịch chiếu phim và giá vé</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tạo suất chiếu mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingShowtime ? "Sửa suất chiếu" : "Tạo suất chiếu mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="movie" className="text-foreground">
                  Phim
                </Label>
                <Select value={formData.movie} onValueChange={(value) => setFormData({ ...formData, movie: value })}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Chọn phim" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Spider-Man: No Way Home">Spider-Man: No Way Home</SelectItem>
                    <SelectItem value="Top Gun: Maverick">Top Gun: Maverick</SelectItem>
                    <SelectItem value="Jurassic World Dominion">Jurassic World Dominion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="room" className="text-foreground">
                  Phòng chiếu
                </Label>
                <Select value={formData.room} onValueChange={(value) => setFormData({ ...formData, room: value })}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Chọn phòng" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Phòng 1 - Standard">Phòng 1 - Standard</SelectItem>
                    <SelectItem value="Phòng 2 - VIP">Phòng 2 - VIP</SelectItem>
                    <SelectItem value="Phòng 3 - IMAX">Phòng 3 - IMAX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime" className="text-foreground">
                    Giờ bắt đầu
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime" className="text-foreground">
                    Giờ kết thúc
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-foreground">
                  Giá vé (VNĐ)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
                className="border-border text-foreground hover:bg-muted"
              >
                Hủy
              </Button>
              <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Lưu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <Tabs defaultValue="pending" className="w-full">
          <div className="border-b border-border px-6 pt-6">
            <TabsList className="bg-muted">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Đang đợi duyệt
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Đã duyệt
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="pending" className="p-6">
            <ShowtimeTable showtimes={showtimes.filter((s) => s.status === "pending")} />
          </TabsContent>
          <TabsContent value="approved" className="p-6">
            <ShowtimeTable showtimes={showtimes.filter((s) => s.status === "approved")} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
