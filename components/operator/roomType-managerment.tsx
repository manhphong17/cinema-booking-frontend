"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roomTypesApi } from "@/app/api/room/room-types"
import type { RoomTypeDto } from "@/app/api/room/rooms"

type Status = "active" | "inactive"

// CHANGED: helpers to convert between FE Status and BE boolean
const toBool = (s: Status): boolean => s === "active" // CHANGED
const toStatus = (b: boolean): Status => (b ? "active" : "inactive") // CHANGED

export default function RoomTypesManager() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const [items, setItems] = useState<RoomTypeDto[]>([])
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | Status>("all")

    const [form, setForm] = useState<{ id?: number; name: string; description: string; status: Status }>({
        name: "",
        description: "",
        status: "active",
    })

    // load list
    const fetchList = async () => {
        setLoading(true)
        try {
            // CHANGED: list() expects boolean | undefined
            const onlyActive =
                statusFilter === "all" ? undefined : statusFilter === "active" // CHANGED
            const data = await roomTypesApi.list(onlyActive) // CHANGED
            setItems(data)
        } catch (e: any) {
            toast({ title: "Lỗi tải dữ liệu / Load error", description: e.message })
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchList()
    }, [statusFilter]) // CHANGED

    const resetForm = () => setForm({ id: undefined, name: "", description: "", status: "active" })

    const onSubmit = async () => {
        if (!form.name.trim()) {
            toast({ title: "Thiếu tên", description: "Vui lòng nhập tên loại phòng" })
            return
        }
        try {
            if (form.id != null) {
                await roomTypesApi.update(form.id, {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    active: toBool(form.status), // CHANGED: boolean for BE
                } as any) // keep cast if DTO differs
                toast({ title: "Đã cập nhật", description: "Loại phòng đã được cập nhật" })
            } else {
                await roomTypesApi.create({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: toBool(form.status), // CHANGED
                } as any)
                toast({ title: "Đã thêm", description: "Loại phòng mới đã được thêm" })
            }
            await fetchList()
            resetForm()
        } catch (e: any) {
            toast({ title: "Lỗi thao tác", description: e.message })
        }
    }

    const onEdit = (it: RoomTypeDto) =>
        setForm({
            id: it.id,
            name: it.name,
            description: it.description || "",
            status: toStatus((it as any).active ?? (it as any).status === "active"), // CHANGED: tolerate both shapes
        })

    const onDelete = async (id: number) => {
        try {
            await roomTypesApi.delete(id)
            toast({ title: "Đã xóa", description: "Đã xóa loại phòng" })
            fetchList()
        } catch (e: any) {
            toast({ title: "Lỗi xóa", description: e.message })
        }
    }

    const onToggle = async (id: number, currentActive: boolean) => { // CHANGED
        try {
            if (currentActive) await roomTypesApi.deactivate(id)
            else await roomTypesApi.activate(id)
            fetchList()
        } catch (e: any) {
            toast({ title: "Lỗi cập nhật trạng thái", description: e.message })
        }
    }

    const filtered = useMemo(() => {
        return items.filter(it => {
            const q = search.toLowerCase()
            const matchText = it.name.toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q)
            const active = (it as any).active ?? ((it as any).status === "active") // CHANGED
            const matchStatus = statusFilter === "all" || toStatus(active) === statusFilter // CHANGED
            return matchText && matchStatus
        })
    }, [items, search, statusFilter])

    return (
        <div className="space-y-6 overflow-x-hidden">
            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-4 space-y-2 min-w-0">
                        <Label className="text-foreground">Tên</Label>
                        <Input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="bg-input border-border text-foreground w-full"
                            placeholder="VD: Standard, VIP..."
                        />
                    </div>
                    <div className="lg:col-span-6 space-y-2 min-w-0">
                        <Label className="text-foreground">Mô tả</Label>
                        <Input
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="bg-input border-border text-foreground w-full"
                            placeholder="Mô tả ngắn"
                        />
                    </div>
                    <div className="lg:col-span-2 flex flex-wrap items-end gap-2 justify-end">
                        <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onSubmit} disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" />
                            {form.id ? "Cập nhật" : "Thêm mới"}
                        </Button>
                        {form.id && (
                            <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                                Hủy
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 min-w-0">
                        <Label className="text-sm text-foreground">Tìm kiếm</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc mô tả..."
                                className="pl-10 bg-input border-border text-foreground w-full"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-foreground">Trạng thái</Label>
                        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                            <SelectTrigger className="bg-input border-border text-foreground">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Không hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="hidden md:flex items-end gap-2 text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        <span>{loading ? "Đang tải…" : "Lọc kết quả"}</span>
                    </div>
                </div>
            </Card>

            <Card className="bg-card border border-border/60 rounded-md shadow-sm p-4">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Tên</TableHead>
                            <TableHead className="text-muted-foreground">Mô tả</TableHead>
                            <TableHead className="text-muted-foreground">Trạng thái</TableHead>
                            <TableHead className="text-muted-foreground">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(it => {
                                const active = (it as any).active ?? ((it as any).status === "active") // CHANGED
                                return (
                                    <TableRow key={it.id} className="border-border">
                                        <TableCell className="text-foreground break-words">{it.name}</TableCell>
                                        <TableCell className="text-foreground break-words">{it.description || "-"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={active ? "default" : "secondary"} // CHANGED
                                                className={active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} // CHANGED
                                            >
                                                {active ? "Hoạt động" : "Không hoạt động"} {/* CHANGED */}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(it)} className="hover:bg-muted">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onToggle(it.id, active)} // CHANGED
                                                    className="hover:bg-muted"
                                                >
                                                    {active ? "Tắt" : "Bật"} {/* CHANGED */}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onDelete(it.id)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
