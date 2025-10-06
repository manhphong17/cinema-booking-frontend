"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface News {
  id: string
  title: string
  content: string
  publishDate: string
  status: "published" | "draft"
  image: string
}

export function NewsManagement() {
  const { toast } = useToast()
  const [newsList, setNewsList] = useState<News[]>([
    {
      id: "1",
      title: "Khuyến mãi đặc biệt tháng 12",
      content: "Giảm giá 20% cho tất cả các suất chiếu vào thứ 3 hàng tuần",
      publishDate: "2024-12-01",
      status: "published",
      image: "/placeholder.svg",
    },
    {
      id: "2",
      title: "Ra mắt phòng chiếu IMAX mới",
      content: "Trải nghiệm điện ảnh đỉnh cao với công nghệ IMAX hiện đại nhất",
      publishDate: "2024-12-10",
      status: "draft",
      image: "/placeholder.svg",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    publishDate: "",
    status: "draft" as "published" | "draft",
    image: "",
  })

  const handleSubmit = () => {
    if (editingNews) {
      setNewsList(newsList.map((n) => (n.id === editingNews.id ? { ...editingNews, ...formData } : n)))
      toast({ title: "Cập nhật thành công", description: "Tin tức đã được cập nhật" })
    } else {
      const newNews: News = {
        id: Date.now().toString(),
        ...formData,
        image: formData.image || "/placeholder.svg",
      }
      setNewsList([...newsList, newNews])
      toast({ title: "Thêm thành công", description: "Tin tức mới đã được thêm" })
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setNewsList(newsList.filter((n) => n.id !== id))
    toast({ title: "Xóa thành công", description: "Tin tức đã được xóa" })
  }

  const resetForm = () => {
    setFormData({ title: "", content: "", publishDate: "", status: "draft", image: "" })
    setEditingNews(null)
  }

  const openEditDialog = (news: News) => {
    setEditingNews(news)
    setFormData({
      title: news.title,
      content: news.content,
      publishDate: news.publishDate,
      status: news.status,
      image: news.image,
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Tin tức</h1>
          <p className="text-muted-foreground mt-1">Quản lý tin tức và thông báo</p>
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
              Thêm tin tức mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingNews ? "Sửa tin tức" : "Thêm tin tức mới"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-foreground">
                  Tiêu đề
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content" className="text-foreground">
                  Nội dung
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-input border-border text-foreground min-h-32"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="publishDate" className="text-foreground">
                  Ngày đăng
                </Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image" className="text-foreground">
                  URL ảnh minh họa
                </Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/path/to/image.jpg"
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

      <Card className="bg-card border-border p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Tiêu đề</TableHead>
              <TableHead className="text-muted-foreground">Ngày đăng</TableHead>
              <TableHead className="text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="text-muted-foreground">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsList.map((news) => (
              <TableRow key={news.id} className="border-border hover:bg-muted/30">
                <TableCell className="font-medium text-foreground">{news.title}</TableCell>
                <TableCell className="text-foreground">
                  {new Date(news.publishDate).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={news.status === "published" ? "default" : "secondary"}
                    className={
                      news.status === "published"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {news.status === "published" ? "Đã đăng" : "Nháp"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(news)}
                      className="text-foreground hover:bg-muted"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(news.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
