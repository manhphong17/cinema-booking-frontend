"use client"

import { useState, useEffect, useMemo } from "react"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, RotateCw, AlertTriangle, Loader2, ExternalLink, Trash2  } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient }from "@/src/api/interceptor"


// ===================== Types & helpers =====================

type IdName = { id: number; name: string }

type BEItem = {
    movieId: number
    movieName: string
    roomTypeId: number
    roomTypeName: string
    roomId: number
    roomName: string
    /** Back-end có thể trả về một trong hai key; hỗ trợ cả hai để tránh vỡ UI */
    subtitleId?: number
    subtileId?: number
    subtitleName: string
    startTime: string // "YYYY-MM-DD HH:mm" (hoặc có T)
    endTime: string   // "YYYY-MM-DD HH:mm"
    /** Một số API có thể có id của suất chiếu */
    showtimeId?: number
    id?: number
}

type ApiResponse = { status: number; message?: string; data: BEItem[] }

/** View model cho FE */
interface ShowtimeView {
    key: string // khoá ổn định từ (movieId-roomId-start)
    showtimeId?: number // dùng để gọi API chi tiết
    movieId: number
    movieName: string
    roomTypeId: number
    roomTypeName: string
    roomId: number
    roomName: string
    subtitleId: number | undefined
    subtitleName: string
    startStr: string // giữ nguyên chuỗi local từ BE
    endStr: string
    start: Date | null // đã parse local
    end: Date | null
    durationMin?: number // có thể âm nếu end < start
    invalid?: boolean // true nếu end < start hoặc bằng nhau
}

/** parse local "YYYY-MM-DD HH:mm" hoặc "YYYY-MM-DDTHH:mm(:ss)?" */
const parseLocal = (s?: string): Date | null => {
    if (!s) return null

    // 1) Thử parse dạng local "YYYY-MM-DD HH:mm(:ss)?" hoặc "YYYY-MM-DDTHH:mm(:ss)?"
    const m = s
        // bỏ phần milliseconds nếu có (.123, .123456...)
        .replace(/\.\d{1,6}/, "")
        // bỏ timezone nếu có (Z, +07:00, -0300, ...)
        .replace(/(Z|[+-]\d{2}:?\d{2})$/, "")
        .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/)

    if (m) {
        const [, y, mo, d, h, mi, sec] = m
        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec || "0"))
    }

    // 2) Fallback: để JS tự parse ISO (có timezone vẫn OK)
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
}

const hhmm = (s?: string): string => {
    if (!s) return ""
    const d = parseLocal(s)
    if (!d) {
        const m = s.match(/[ T](\d{2}):(\d{2})/)
        return m ? `${m[1]}:${m[2]}` : ""
    }
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${h}:${m}`
}

const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return ""
    const sign = minutes < 0 ? "-" : ""
    const abs = Math.abs(minutes)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return `${sign}${h}h ${m}m`
}

const formatLocalDateYMD = (d: Date) => {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${mo}-${day}`
}

const MONTHS = [
    { value: 0, label: "January" },{ value: 1, label: "February" },{ value: 2, label: "March" },
    { value: 3, label: "April" },  { value: 4, label: "May" },      { value: 5, label: "June" },
    { value: 6, label: "July" },   { value: 7, label: "August" },   { value: 8, label: "September" },
    { value: 9, label: "October" },{ value:10, label: "November" }, { value:11, label: "December" },
]

const getDayAbbrev = (date: Date) => ["SUN","MON","TUE","WED","THU","FRI","SAT"][date.getDay()]
const formatSingleDate = (date: Date) =>
    `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "long" })} '${date.getFullYear().toString().slice(-2)}`

/** Map từ BE → View theo đúng payload bạn đưa */
const mapToView = (it: BEItem): ShowtimeView => {
    const start = parseLocal(it.startTime)
    const end = parseLocal(it.endTime)
    const durationMin = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : undefined
    const invalid = durationMin !== undefined && durationMin <= 0
    return {
        key: `${it.movieId}-${it.roomId}-${it.startTime}`,
        showtimeId: (it.showtimeId ?? it.id),
        movieId: it.movieId,
        movieName: it.movieName,
        roomTypeId: it.roomTypeId,
        roomTypeName: it.roomTypeName,
        roomId: it.roomId,
        roomName: it.roomName,
        subtitleId: (it.subtitleId ?? it.subtileId),
        subtitleName: it.subtitleName,
        startStr: it.startTime,
        endStr: it.endTime,
        start,
        end,
        durationMin,
        invalid,
    }
}

/** helpers cho modal create */
const addMinutes = (hhmmStr: string, minutes: number) => {
    const [h, m] = hhmmStr.split(":").map(Number)
    const total = h * 60 + m + minutes
    const eh = Math.floor(total / 60) % 24
    const em = total % 60
    return `${String(eh).padStart(2,"0")}:${String(em).padStart(2,"0")}`
}
const joinDateTimeT = (date: Date, hhmmStr: string) => `${formatLocalDateYMD(date)}T${hhmmStr}:00`

const extractYMD = (s?: string) => {
    const d = parseLocal(s)
    return d ? formatLocalDateYMD(d) : ""
}

const extractHHmm = (s?: string) => hhmm(s)

/** ghép local date + HH:mm -> 'YYYY-MM-DDTHH:mm:00' */
const joinLocalDateHHmm = (dateYMD: string, hhmmStr: string) =>
    `${dateYMD}T${hhmmStr}:00`

// ===================== API base =====================

const BASE = "http://localhost:8885/api/showtimes"

// ===================== Modal: CreateShowtimeDialog =====================

type CreateShowtimePayload = {
    movieId: number
    roomId: number
    subtitleId: number
    startTime: string
    endTime: string
}

type CreateShowtimeSuccess = {
    id: number
    movieId: number
    roomId: number
    subtitleId: number
    startTime: string
    endTime: string
}

type ProblemDetail = {
    title?: string
    status?: number
    message?: string
    instance?: string
    timestamp?: string
    code?: number
    [k: string]: any
}

type CreateShowtimeDialogProps = {
    open: boolean
    onOpenChange: (v: boolean) => void
    currentDate: Date
    movies: IdName[]
    rooms: IdName[]
    subtitles: IdName[]
    onCreated?: () => void
}

type CreateShowtimeResult =
    | { ok: true; data: CreateShowtimeSuccess; raw: any }
    | { ok: false; error: ProblemDetail; raw: any; httpStatus?: number; statusText?: string }

async function saveShowtime(payload: CreateShowtimePayload): Promise<CreateShowtimeResult> {
    try {
        // POST body JSON (chuẩn cho create)
        const res = await apiClient.post("/api/showtimes/createShowtime", payload)
        return { ok: true, data: res.data as CreateShowtimeSuccess, raw: res.data }
    } catch (e: any) {
        const d = e?.response?.data
        const err: ProblemDetail = {
            ...(typeof d === "object" ? d : {}),
            status: d?.status ?? e?.response?.status,
            title: d?.title ?? (e?.response?.status >= 500 ? "Server Error" : "Bad Request"),
            message: d?.message ?? d?.error ?? e?.message,
            instance: d?.instance ?? "/showtimes/createShowtime",
            timestamp: d?.timestamp,
            code: d?.code,
        }
        return { ok: false, error: err, raw: d, httpStatus: err.status, statusText: err.title }
    }
}

// [NEW] ===== API Update =====
type UpdateShowtimePayload = {
    movieId: number
    roomId: number
    subtitleId: number
    startTime: string
    endTime: string
}

type UpdateShowtimeResult =
    | { ok: true; data: any; raw: any }
    | { ok: false; error: ProblemDetail; raw: any; httpStatus?: number; statusText?: string }

async function updateShowtime(id: number, payload: UpdateShowtimePayload): Promise<UpdateShowtimeResult> {
    try {
        // PUT body JSON (chuẩn REST)
        const res = await apiClient.put(`/api/showtimes/${id}`, payload)
        return { ok: true, data: res.data, raw: res.data }
    } catch (e: any) {
        const d = e?.response?.data
        const err: ProblemDetail = {
            ...(typeof d === "object" ? d : {}),
            status: d?.status ?? e?.response?.status,
            title: d?.title ?? (e?.response?.status >= 500 ? "Server Error" : "Bad Request"),
            message: d?.message ?? d?.error ?? e?.message,
            instance: d?.instance ?? `/api/showtimes/${id}`,
            timestamp: d?.timestamp,
            code: d?.code,
        }
        return { ok: false, error: err, raw: d, httpStatus: err.status, statusText: err.title }
    }
}


async function deleteShowtime(id: number): Promise<{ ok: true; message: string } | { ok: false; message: string; httpStatus?: number }> {
    try {
        const res = await apiClient.delete(`/api/showtimes/${id}`)
        // BE trả {"status":200,"message":"Delete successfully"}
        const body = res?.data
        const msg = (body?.message ?? "Delete successfully") as string
        return { ok: true, message: msg }
    } catch (e: any) {
        const body = e?.response?.data
        return {
            ok: false,
            message: body?.message || e?.message || "Delete failed",
            httpStatus: e?.response?.status
        }
    }
}

function CreateShowtimeDialog({
                                  open,
                                  onOpenChange,
                                  currentDate,
                                  movies,
                                  rooms,
                                  subtitles,
                                  onCreated,
                              }: CreateShowtimeDialogProps) {
    const { toast } = useToast()
    const [movieId, setMovieId] = useState("")
    const [roomId, setRoomId] = useState("")
    const [subtitleId, setSubtitleId] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [startHHmm, setStartHHmm] = useState("") // "HH:mm"
    const [endHHmm, setEndHHmm] = useState("")     // "HH:mm"
    const [serverErr, setServerErr] = useState<ProblemDetail | null>(null)
    const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({})

    const parseHHmm = (s: string) => {
        const parts = s.split(":")
        if (parts.length !== 2) return null
        const hh = Number(parts[0])
        const mm = Number(parts[1])
        if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
        return hh * 60 + mm
    }

    const minutesDiff = useMemo(() => {
        const a = parseHHmm(startHHmm)
        const b = parseHHmm(endHHmm)
        if (a == null || b == null) return null
        return b - a // không cho qua ngày mới; nếu cần +24h thì tùy chỉnh
    }, [startHHmm, endHHmm])

    const invalidTime = minutesDiff != null && minutesDiff <= 0
    const canSubmit =
        !!movieId &&
        !!roomId &&
        !!subtitleId &&
        parseHHmm(startHHmm) != null &&
        parseHHmm(endHHmm) != null &&
        !invalidTime &&
        !submitting

    const resetForm = () => {
        setMovieId("")
        setRoomId("")
        setSubtitleId("")
        setStartHHmm("")
        setEndHHmm("")
        setServerErr(null)
        setFieldErrs({})
    }

    const handleClose = (v: boolean) => {
        if (!v) resetForm()
        onOpenChange(v)
    }

    const extractFieldErrors = (err: any): Record<string, string[]> => {
        const fe: Record<string, string[]> = {}
        if (!err) return fe
        // Kiểu 1: violations: [{ field|propertyPath|param, message }]
        const vio = Array.isArray(err.violations) ? err.violations : Array.isArray(err.errors) ? err.errors : null
        if (Array.isArray(vio)) {
            for (const v of vio) {
                const key = (v.field || v.propertyPath || v.param || 'global') as string
                const msg = (v.message || v.msg || String(v)) as string
                fe[key] = [...(fe[key] || []), msg]
            }
        }
        // Kiểu 2: errors: { field: [msg] | msg }
        if (err && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
            for (const [k, v] of Object.entries(err.errors)) {
                const arr = Array.isArray(v) ? (v as any[]).map(String) : [String(v)]
                fe[k] = [...(fe[k] || []), ...arr]
            }
        }
        return fe
    }

    const handleSubmit = async () => {
        if (!canSubmit) {
            toast({
                title: "Thiếu/không hợp lệ",
                description: invalidTime ? "Giờ kết thúc phải lớn hơn giờ bắt đầu." : "Vui lòng nhập đủ các trường bắt buộc.",
                variant: "destructive",
            })
            return
        }

        const payload: CreateShowtimePayload = {
            movieId: Number(movieId),
            roomId: Number(roomId),
            subtitleId: Number(subtitleId),
            startTime: joinDateTimeT(currentDate, startHHmm),
            endTime: joinDateTimeT(currentDate, endHHmm),
        }

        try {
            setSubmitting(true)
            setServerErr(null)
            setFieldErrs({})
            const result = await saveShowtime(payload)
            if (!result.ok) {
                const { error, httpStatus, statusText } = result
                const fe = extractFieldErrors(error)
                setFieldErrs(fe)
                setServerErr(error)
                const details = [
                    error?.message,
                    error?.title,
                    typeof error?.code === "number" ? `Code ${error.code}` : undefined,
                    typeof error?.status === "number" ? `HTTP ${error.status}` : httpStatus ? `HTTP ${httpStatus}` : undefined,
                    statusText,
                ].filter(Boolean).join(" • ")
                toast({ title: "Tạo suất chiếu thất bại", description: details || undefined, variant: "destructive" })
                return
            }

            toast({ title: "Thành công", description: "Đã tạo suất chiếu mới." })
            resetForm()
            onOpenChange(false)
            onCreated?.()
        } catch (e: any) {
            toast({ title: "Lỗi mạng", description: String(e?.message || e), variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    // Submit khi Enter ở bất kỳ input time nào
    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter") handleSubmit()
    }

    const fieldHasErr = (name: string) => !!fieldErrs[name]?.length
    const renderFieldError = (name: string) => fieldHasErr(name) ? (
        <p className="text-xs text-destructive mt-1">{fieldErrs[name].join(', ')}</p>
    ) : null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-card text-card-foreground border-border max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo suất chiếu mới</DialogTitle>
                </DialogHeader>

                {serverErr && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                        <div className="flex items-center gap-2 font-medium text-destructive">
                            <AlertTriangle className="w-4 h-4" /> {serverErr.title || 'Lỗi tạo suất chiếu'}
                        </div>
                        {serverErr.message && <div className="mt-1 text-foreground/80">{serverErr.message}</div>}
                        <div className="mt-1 text-xs text-muted-foreground">
                            {serverErr.code ? `Code ${serverErr.code} • ` : ''}{serverErr.status ? `HTTP ${serverErr.status}` : ''}{serverErr.timestamp ? ` • ${serverErr.timestamp}` : ''}
                        </div>
                        {!!Object.keys(fieldErrs).length && (
                            <ul className="mt-2 list-disc pl-5 text-foreground/80">
                                {Object.entries(fieldErrs).map(([k, arr]) =>
                                    (arr as string[]).map((msg, i) => <li key={`${k}-${i}`}><b>{k}:</b> {msg}</li>)
                                )}
                            </ul>
                        )}
                    </div>
                )}

                <div className="grid gap-6 py-2">
                    <div className="grid gap-2">
                        <Label>Phim <span className="text-destructive">*</span></Label>
                        <Select value={movieId} onValueChange={setMovieId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('movieId') ? 'border-destructive' : ''}`}>
                                <SelectValue placeholder="Chọn phim" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {movies.map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderFieldError('movieId')}
                    </div>

                    <div className="grid gap-2">
                        <Label>Phòng chiếu <span className="text-destructive">*</span></Label>
                        <Select value={roomId} onValueChange={setRoomId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('roomId') ? 'border-destructive' : ''}`}>
                                <SelectValue placeholder="Chọn phòng" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {rooms.map(r => (
                                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderFieldError('roomId')}
                    </div>

                    <div className="grid gap-2">
                        <Label>Subtitle <span className="text-destructive">*</span></Label>
                        <Select value={subtitleId} onValueChange={setSubtitleId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('subtitleId') ? 'border-destructive' : ''}`}>
                                <SelectValue placeholder="Chọn subtitle" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {subtitles.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderFieldError('subtitleId')}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Ngày chiếu</Label>
                            <Input value={formatLocalDateYMD(currentDate)} readOnly className="bg-muted/50 border-border" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Giờ bắt đầu <span className="text-destructive">*</span></Label>
                            <Input
                                type="time"
                                step={60}
                                placeholder="HH:mm"
                                value={startHHmm}
                                onChange={e => setStartHHmm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                                className={`bg-input border-border ${fieldHasErr('startTime') ? 'border-destructive' : ''}`}
                                disabled={submitting}
                                aria-invalid={fieldHasErr('startTime')}
                            />
                            {invalidTime && (
                                <p className="text-xs text-destructive mt-1">Giờ kết thúc phải lớn hơn giờ bắt đầu trong cùng ngày.</p>
                            )}
                            {renderFieldError('startTime')}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Giờ kết thúc <span className="text-destructive">*</span></Label>
                            <Input
                                type="time"
                                step={60}
                                placeholder="HH:mm"
                                value={endHHmm}
                                onChange={e => setEndHHmm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                                className={`bg-input border-border ${fieldHasErr('endTime') ? 'border-destructive' : ''}`}
                                disabled={submitting}
                                aria-invalid={fieldHasErr('endTime')}
                            />
                            {renderFieldError('endTime')}
                        </div>
                        <div className="grid gap-2">
                            <Label>Thông tin</Label>
                            <Input
                                readOnly
                                className="bg-muted/50 border-border"
                                value={
                                    minutesDiff != null && minutesDiff > 0
                                        ? `Thời lượng: ${Math.floor(minutesDiff/60)}h ${minutesDiff%60}m`
                                        : ""
                                }
                                placeholder="—"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button variant="outline" onClick={() => handleClose(false)} className="border-border" disabled={submitting}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit} className="bg-primary text-primary-foreground">
                        {submitting ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Đang lưu…</span>) : "Lưu suất chiếu"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ===================== Detail modal =====================

type ShowtimeDetail = {
    showtimeId: number
    movieId: number
    movieName: string
    roomTypeId: number
    roomTypeName: string
    roomId: number
    roomName: string
    subtitleId: number
    subtitleName: string
    startTime: string
    endTime: string

    poster_url?: string
    banner_url?: string
    moviePosterUrl?: string
    movieBannerUrl?: string
    posterUrl?: string
    bannerUrl?: string
}

async function fetchShowtimeDetail(id: number): Promise<ShowtimeDetail> {
    try {
        // baseURL đã là .../api  → chỉ cần "/showtimes/..."
        const res = await apiClient.get(`/api/showtimes/showtimeBy/${id}`)
        const data = res.data

        const raw =
            (data && typeof data === "object" && data.status === 200 && data.data)
                ? data.data
                : data

        if (!raw || typeof raw !== "object") {
            throw new Error("Unexpected detail response")
        }

        // Chuẩn hoá field ảnh
        const poster =
            raw.moviePosterUrl ?? raw.poster_url ?? raw.posterUrl ?? raw.moviePosterURL ?? null
        const banner =
            raw.movieBannerUrl ?? raw.banner_url ?? raw.bannerUrl ?? raw.movieBannerURL ?? null

        return {
            ...raw,
            poster_url: poster ?? undefined,
            banner_url: banner ?? undefined,
        } as ShowtimeDetail
    } catch (e: any) {
        const d = e?.response?.data
        const msg =
            d?.message ?? d?.error ?? e?.message ?? `Failed to load showtime #${id}`
        throw new Error(msg)
    }
}

function ShowtimeDetailDialog({
                                  open, onOpenChange, showtimeId, onRequestUpdate, onDeleted
                              }: {
    open: boolean
    onOpenChange: (v:boolean)=>void
    showtimeId: number | null
    onRequestUpdate?: (d: ShowtimeDetail) => void
    onDeleted?: () => void            // [NEW]
}) {
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [detail, setDetail] = useState<ShowtimeDetail | null>(null)
    const { toast } = useToast()
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        let active = true
        async function load() {
            if (!open || !showtimeId) return
            setLoading(true); setErr(null); setDetail(null)
            try {
                const d = await fetchShowtimeDetail(showtimeId)
                if (active) setDetail(d)
            } catch (e:any) {
                if (active) setErr(String(e?.message || e))
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        return () => { active = false }
    }, [open, showtimeId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chi tiết suất chiếu</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />Đang tải…
                    </div>
                )}

                {err && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <div className="font-medium mb-1">Không tải được chi tiết</div>
                        <div className="text-foreground/80">{err}</div>
                    </div>
                )}

                {detail && (
                    <>
                        {/* NEW: Poster/Banner preview */}
                        <div className="mb-3">
                            {(() => {
                                const imgUrl =
                                    detail.poster_url ||
                                    detail.moviePosterUrl ||
                                    detail.posterUrl ||
                                    detail.banner_url ||
                                    detail.movieBannerUrl ||
                                    detail.bannerUrl

                                if (!imgUrl) {
                                    return (
                                        <div className="w-full h-[180px] rounded-md bg-muted/40 border border-border flex items-center justify-center text-xs text-muted-foreground">
                                            No image available
                                        </div>
                                    )
                                }

                                return (
                                    <div className="rounded-md overflow-hidden border border-border">
                                        <img
                                            src={imgUrl}
                                            alt={`${detail.movieName} poster`}
                                            className="w-full h-[180px] object-cover"   // đã bỏ cursor-zoom-in
                                            loading="lazy"
                                            onError={(e) => {
                                                const el = e.currentTarget as HTMLImageElement
                                                el.onerror = null
                                                el.src =
                                                    'data:image/svg+xml;utf8,' +
                                                    encodeURIComponent(
                                                        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="18">
            Image not available
          </text>
        </svg>`
                                                    )
                                            }}
                                        />
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Phần thông tin chi tiết */}
                        <div className="grid gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Showtime ID:</span>{' '}
                                <span className="font-medium">{detail.showtimeId}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Movie:</span>{' '}
                                <span className="font-medium">
                {detail.movieName} (#{detail.movieId})
              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-muted-foreground">Room:</span>{' '}
                                    <span className="font-medium">
                  {detail.roomName} (#{detail.roomId})
                </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Type:</span>{' '}
                                    <span className="font-medium">{detail.roomTypeName}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-muted-foreground">Subtitle:</span>{' '}
                                    <span className="font-medium">{detail.subtitleName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Subtitle ID:</span>{' '}
                                    <span className="font-medium">{detail.subtitleId}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-muted-foreground">Start:</span>{' '}
                                    <span className="font-medium">{detail.startTime}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">End:</span>{' '}
                                    <span className="font-medium">{detail.endTime}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="bg-primary text-primary-foreground"
                                    onClick={() => onRequestUpdate?.(detail)}
                                >
                                    Update
                                </Button>


                                {/* DELETE with confirm */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="inline-flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-card text-card-foreground border-border">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Xoá suất chiếu?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bạn có chắc muốn xoá suất chiếu #{detail.showtimeId}? Hành động này không thể hoàn tác.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
                                            <AlertDialogAction
                                                disabled={deleting}
                                                onClick={async () => {
                                                    if (!detail?.showtimeId) return
                                                    try {
                                                        setDeleting(true)
                                                        const r = await deleteShowtime(detail.showtimeId)
                                                        if (!r.ok) {
                                                            toast({
                                                                title: "Xoá thất bại",
                                                                description: `${r.message}${r.httpStatus ? ` • HTTP ${r.httpStatus}` : ""}`,
                                                                variant: "destructive",
                                                            })
                                                            return
                                                        }
                                                        toast({ title: "Đã xoá", description: r.message || "Delete successfully" })
                                                        onOpenChange(false)
                                                        onDeleted?.()          // thông báo cha refresh list
                                                    } finally {
                                                        setDeleting(false)
                                                    }
                                                }}
                                            >
                                                {deleting ? "Đang xoá…" : "Xoá"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )

}

// [NEW] ===== Update dialog =====
function UpdateShowtimeDialog({
                                  open,
                                  onOpenChange,
                                  initial,
                                  movies,
                                  rooms,
                                  subtitles,
                                  onUpdated,
                              }: {
    open: boolean
    onOpenChange: (v:boolean)=>void
    initial: ShowtimeDetail | null
    movies: IdName[]
    rooms: IdName[]
    subtitles: IdName[]
    onUpdated?: () => void
}) {
    const { toast } = useToast()
    const [movieId, setMovieId] = useState("")
    const [roomId, setRoomId] = useState("")
    const [subtitleId, setSubtitleId] = useState("")
    const [dateYMD, setDateYMD] = useState("")
    const [startHHmm, setStartHHmm] = useState("")
    const [endHHmm, setEndHHmm] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [serverErr, setServerErr] = useState<ProblemDetail | null>(null)
    const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({})

    useEffect(() => {
        if (!open || !initial) return
        setMovieId(String(initial.movieId))
        setRoomId(String(initial.roomId))
        setSubtitleId(String(initial.subtitleId))
        setDateYMD(extractYMD(initial.startTime))
        setStartHHmm(extractHHmm(initial.startTime))
        setEndHHmm(extractHHmm(initial.endTime))
        setServerErr(null); setFieldErrs({})
    }, [open, initial])

    const parseHHmm = (s: string) => {
        const parts = s.split(":")
        if (parts.length !== 2) return null
        const hh = Number(parts[0]); const mm = Number(parts[1])
        if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh<0 || hh>23 || mm<0 || mm>59) return null
        return hh*60 + mm
    }

    const minutesDiff = useMemo(() => {
        const a = parseHHmm(startHHmm); const b = parseHHmm(endHHmm)
        if (a == null || b == null) return null
        return b - a
    }, [startHHmm, endHHmm])

    const invalidTime = minutesDiff != null && minutesDiff <= 0
    const canSubmitBase =
        !!movieId && !!roomId && !!subtitleId && !!dateYMD &&
        parseHHmm(startHHmm) != null && parseHHmm(endHHmm) != null && !invalidTime && !submitting

    const isChanged = initial ? (
        Number(movieId) !== initial.movieId ||
        Number(roomId) !== initial.roomId ||
        Number(subtitleId) !== initial.subtitleId ||
        joinLocalDateHHmm(dateYMD, startHHmm) !== initial.startTime.replace(" ", "T").slice(0,16)+":00" ||
        joinLocalDateHHmm(dateYMD, endHHmm)   !== initial.endTime.replace(" ", "T").slice(0,16)+":00"
    ) : false

    const canSubmit = canSubmitBase && isChanged

    const extractFieldErrors = (err: any): Record<string, string[]> => {
        const fe: Record<string, string[]> = {}
        const vio = Array.isArray(err?.violations) ? err.violations : Array.isArray(err?.errors) ? err.errors : null
        if (Array.isArray(vio)) {
            for (const v of vio) {
                const key = (v.field || v.propertyPath || v.param || 'global') as string
                const msg = (v.message || v.msg || String(v)) as string
                fe[key] = [...(fe[key] || []), msg]
            }
        }
        if (err && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
            for (const [k, v] of Object.entries(err.errors)) {
                const arr = Array.isArray(v) ? (v as any[]).map(String) : [String(v)]
                fe[k] = [...(fe[k] || []), ...arr]
            }
        }
        return fe
    }

    const handleSubmit = async () => {
        if (!canSubmit) {
            toast({
                title: "Thiếu/không hợp lệ",
                description: invalidTime
                    ? "Giờ kết thúc phải lớn hơn giờ bắt đầu."
                    : "Bạn chưa thay đổi gì hoặc thiếu dữ liệu.",
                variant: "destructive",
            })
            return
        }
        if (!initial) return

        const payload: UpdateShowtimePayload = {
            movieId: Number(movieId),
            roomId: Number(roomId),
            subtitleId: Number(subtitleId),
            startTime: joinLocalDateHHmm(dateYMD, startHHmm),
            endTime:   joinLocalDateHHmm(dateYMD, endHHmm),
        }

        try {
            setSubmitting(true); setServerErr(null); setFieldErrs({})
            const result = await updateShowtime(initial.showtimeId, payload)
            if (!result.ok) {
                const fe = extractFieldErrors(result.error)
                setFieldErrs(fe); setServerErr(result.error)
                toast({
                    title: "Cập nhật thất bại",
                    description: [result.error?.message, result.statusText, result.httpStatus && `HTTP ${result.httpStatus}`].filter(Boolean).join(" • "),
                    variant: "destructive",
                })
                return
            }
            toast({ title: "Thành công", description: "Đã cập nhật suất chiếu." })
            onOpenChange(false)
            onUpdated?.()
        } catch (e:any) {
            toast({ title: "Lỗi mạng", description: String(e?.message || e), variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const fieldHasErr = (name: string) => !!fieldErrs[name]?.length
    const renderFieldError = (name: string) => fieldHasErr(name) ? (
        <p className="text-xs text-destructive mt-1">{fieldErrs[name].join(', ')}</p>
    ) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card text-card-foreground border-border max-w-2xl">
                <DialogHeader><DialogTitle>Update suất chiếu</DialogTitle></DialogHeader>

                {serverErr && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                        <div className="font-medium text-destructive">Lỗi cập nhật</div>
                        <div className="text-foreground/80">{serverErr.message}</div>
                    </div>
                )}

                <div className="grid gap-6 py-2">
                    <div className="grid gap-2">
                        <Label>Phim</Label>
                        <Select value={movieId} onValueChange={setMovieId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('movieId')?'border-destructive':''}`}>
                                <SelectValue placeholder="Chọn phim"/>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {movies.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderFieldError('movieId')}
                    </div>

                    <div className="grid gap-2">
                        <Label>Phòng chiếu</Label>
                        <Select value={roomId} onValueChange={setRoomId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('roomId')?'border-destructive':''}`}>
                                <SelectValue placeholder="Chọn phòng"/>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {rooms.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderFieldError('roomId')}
                    </div>

                    <div className="grid gap-2">
                        <Label>Subtitle</Label>
                        <Select value={subtitleId} onValueChange={setSubtitleId} disabled={submitting}>
                            <SelectTrigger className={`bg-input border-border ${fieldHasErr('subtitleId')?'border-destructive':''}`}>
                                <SelectValue placeholder="Chọn subtitle"/>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {subtitles.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderFieldError('subtitleId')}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Ngày</Label>
                            <Input type="date" value={dateYMD} onChange={e=>setDateYMD(e.target.value)} disabled={submitting} className="bg-input border-border"/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Bắt đầu</Label>
                            <Input type="time" step={60} value={startHHmm} onChange={e=>setStartHHmm(e.target.value)} disabled={submitting} className={`bg-input border-border ${fieldHasErr('startTime')?'border-destructive':''}`}/>
                            {invalidTime && <p className="text-xs text-destructive">End phải &gt; Start.</p>}
                            {renderFieldError('startTime')}
                        </div>
                        <div className="grid gap-2">
                            <Label>Kết thúc</Label>
                            <Input type="time" step={60} value={endHHmm} onChange={e=>setEndHHmm(e.target.value)} disabled={submitting} className={`bg-input border-border ${fieldHasErr('endTime')?'border-destructive':''}`}/>
                            {renderFieldError('endTime')}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                        {minutesDiff!=null && minutesDiff>0 ? `Duration: ${Math.floor(minutesDiff/60)}h ${minutesDiff%60}m` : ''}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={submitting} className="border-border">Hủy</Button>
                        <Button onClick={handleSubmit} disabled={!canSubmit} className="bg-primary text-primary-foreground">
                            {submitting ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Đang lưu…</span>) : "Lưu cập nhật"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


// ===================== Component =====================

export function ShowtimeManagement() {
    const { toast } = useToast()
    const [updateOpen, setUpdateOpen] = useState(false)
    const [updateInitial, setUpdateInitial] = useState<ShowtimeDetail | null>(null)
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
    const [selectedMovie, setSelectedMovie] = useState<string>("all")

    const [rooms, setRooms] = useState<IdName[]>([])
    const [roomTypes, setRoomTypes] = useState<IdName[]>([])
    const [showtimes, setShowtimes] = useState<ShowtimeView[]>([])
    const [movies, setMovies] = useState<IdName[]>([])
    const [subtitles, setSubtitles] = useState<IdName[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Detail dialog state
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null)


    // Ẩn showtime chỉ trên UI, lưu localStorage
    const [hiddenKeys, setHiddenKeys] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem("hiddenShowtimes") || "[]")
        } catch { return [] }
    })
    useEffect(() => {
        localStorage.setItem("hiddenShowtimes", JSON.stringify(hiddenKeys))
    }, [hiddenKeys])

// Tạo key ổn định: ưu tiên id, fallback key tổng hợp
    const mkKey = (st: ShowtimeView) =>
        st.showtimeId != null ? `id:${st.showtimeId}` : `key:${st.key}`

    const isHidden = (st: ShowtimeView) => hiddenKeys.includes(mkKey(st))
    const hideShowtime = (st: ShowtimeView) =>
        setHiddenKeys(prev => (prev.includes(mkKey(st)) ? prev : [...prev, mkKey(st)]))

    const clearHidden = () => setHiddenKeys([])
    const openDetail = (id?: number) => {
        if (!id) {
            toast({ title: 'Thiếu showtimeId', description: 'Bản ghi không có showtimeId để xem chi tiết.', variant: 'destructive' })
            return
        }
        setSelectedShowtimeId(id)
        setDetailOpen(true)
    }

    // // Lookups (tuỳ backend có/không)
    // const loadRooms = async () => {
    //     try {
    //         const res = await apiClient.get("/showtimes/rooms/lookup/id-name")
    //         const data = res.data
    //         const rows: IdName[] =
    //             Array.isArray(data) ? data :
    //                 (typeof data?.status === "number" && Array.isArray(data?.data)) ? data.data : []
    //         if (rows.length) setRooms(rows)
    //     } catch {}
    // }
    const loadRooms = async () => {
        try {
            const response = await apiClient.get('/api/showtimes/rooms/lookup/id-name')
            setRooms(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch genres:", error)
        }
    }

    const loadSubtitles = async () => {
        try {
            const response = await apiClient.get('/api/showtimes/subtitles/lookup/id-name')
            setSubtitles(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch genres:", error)
        }
    }

    // const loadSubtitles = async () => {
    //     try {
    //         const res = await fetch(`${BASE}/subtitles/lookup/id-name`, { headers: { Accept: "application/json" } })
    //         if (!res.ok) return
    //         const data = await res.json()
    //         if (data?.status === 200 && Array.isArray(data.data)) setSubtitles(data.data)
    //     } catch {}
    // }
    const fetchRoomTypes = async () => {
        try {
            const res = await fetch(`${BASE}/room-types/lookup/id-name`)
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) setRoomTypes(data)
        } catch {}
    }
    // const fetchMovies = async () => {
    //     try {
    //         const res = await fetch(`${BASE}/lookup/id-name-movies`)
    //         if (!res.ok) throw new Error("Failed to fetch movies")
    //         const data = await res.json()
    //         return Array.isArray(data) ? data : []
    //     } catch {
    //         return []
    //     }
    // }
    // ✅ fetchMovies trả về Promise<IdName[]>
    const fetchMovies = async (): Promise<IdName[]> => {
        try {
            const res = await apiClient.get("/api/showtimes/lookup/active-id-name-movies")
            const data = res?.data
            const rows: IdName[] = Array.isArray(data) ? data
                : Array.isArray(data?.data) ? data.data
                    : []
            return rows
        } catch {
            return []
        }
    }

    // ====== Fetch showtimes theo đúng payload bạn gửi (status + data[]) ======
    const fetchShowtimes = async (date: Date = new Date()) => {
        setIsLoading(true)
        setError(null)

        try {
            const ymd = formatLocalDateYMD(date)
            const candidates = [
                { startTime: `${ymd} 00:00`,    endTime: `${ymd} 23:59`    },
                { startTime: `${ymd} 00:00:00`, endTime: `${ymd} 23:59:59` },
                { startTime: `${ymd}T00:00`,    endTime: `${ymd}T23:59`    },
                { startTime: `${ymd}T00:00:00`, endTime: `${ymd}T23:59:59` },
            ]

            let mapped: ShowtimeView[] | null = null
            let lastErr: any = null

            for (const params of candidates) {
                try {
                    // ✅ Đúng mẫu: GET + params
                    const res = await apiClient.get("/api/showtimes/filter", { params })
                    const body = res.data as ApiResponse

                    // Hỗ trợ cả 2 kiểu payload cho chắc ăn
                    const rows: BEItem[] =
                        Array.isArray(body)               ? body as any :
                            Array.isArray((body as any)?.data) ? (body as any).data :
                                []

                    if (!Array.isArray(rows) || rows.length === 0 && !(body as any)?.status) {
                        // nếu BE bắt buộc có {status:200,data:[...]} mà không đúng -> ném lỗi
                        if ((body as any)?.status !== 200) throw new Error("Invalid response body")
                    }

                    mapped = rows.map(mapToView)
                    break
                } catch (err) {
                    lastErr = err
                }
            }

            if (!mapped) throw lastErr || new Error("All date formats failed")

            setShowtimes(mapped)

            // Fallback danh sách phim từ data nếu /lookup/id-name-movies đang trống
            if (movies.length === 0) {
                const unique = Array.from(
                    new Map(mapped.map(m => [m.movieId, { id: m.movieId, name: m.movieName }])).values()
                )
                setMovies(prev => prev.length ? prev : unique)
            }
        } catch (e: any) {
            setError(e?.message || "Error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [moviesData] = await Promise.all([
                    fetchMovies(),
                    loadRooms(),
                    fetchRoomTypes(),
                    loadSubtitles(),
                ])
                setMovies(moviesData)
            } catch (e: any) {
                setError(e?.message || "Failed to load initial data")
            }
        }
        loadInitial()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        fetchShowtimes(currentDate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate])

    const uniqueMovies = useMemo(() => {
        const fromShowtimes = Array.from(
            new Map(showtimes.map(s => [s.movieId, { id: s.movieId, name: s.movieName }])).values()
        )
        const merged = new Map<number, IdName>()
        movies.forEach(m => merged.set(m.id, m))
        fromShowtimes.forEach(m => merged.set(m.id, m))
        return Array.from(merged.values())
    }, [showtimes, movies])

    const navigateDay = (direction: "prev" | "next") => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() + (direction === "next" ? 1 : -1))
        setCurrentDate(d)
    }

    const handleMonthChange = (value: string) => {
        const d = new Date(currentDate)
        d.setMonth(Number(value))
        setCurrentDate(d)
    }

    // ====== Dialog state ======
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // State lưu trạng thái sắp xếp
    const [sortKey, setSortKey] = useState<'start'|'end'|'movie'|'room'|'subtitles'|'type'|'duration'>('start')
    const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

    // Hàm chuyển đổi giữa các trạng thái sắp xếp
    const toggleSort = (k: 'start'|'end'|'movie'|'room'|'subtitles'|'type'|'duration') => {
        if (sortKey === k) {
            // Nếu đang sắp xếp cùng cột, đảo chiều sắp xếp
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            // Nếu chuyển sang cột khác, mặc định sắp xếp tăng dần
            setSortKey(k)
            setSortDir('asc')
        }
    }

    // Hàm trả về ký hiệu sắp xếp
    const indicator = (k: 'start'|'end'|'movie'|'room'|'subtitles'|'type'|'duration') =>
        sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

    // Thay thế hàm safeCompare
    const safeCompare = (a: any, b: any, isNumeric = false): number => {
        // Đẩy null/undefined xuống dưới
        if (a == null && b == null) return 0
        if (a == null) return 1
        if (b == null) return -1

        // So sánh số
        if (isNumeric || (typeof a === 'number' && typeof b === 'number')) {
            return Number(a) - Number(b)
        }

        // So sánh chuỗi "natural" (Room 2 < Room 10), không phân biệt hoa/thường/ dấu
        const as = String(a)
        const bs = String(b)
        const looksNumeric = /\d/.test(as) || /\d/.test(bs)
        return as.localeCompare(bs, 'vi-VN', {
            sensitivity: 'base',
            numeric: looksNumeric, // bật natural sort khi có số
        })
    }


    // ====== Filtered Table ======
    const filteredShowtimes = useMemo(() => {
        const ymd = formatLocalDateYMD(currentDate)
        const mvId = selectedMovie === 'all' ? null : Number(selectedMovie)

        const data = showtimes
            .filter(st => st.startStr.startsWith(ymd))
            .filter(st => !mvId || st.movieId === mvId)
            .sort((a, b) => {
                let compareResult = 0

                switch (sortKey) {
                    case 'start':
                        compareResult = safeCompare(a.start?.getTime(), b.start?.getTime(), true)
                        break

                    case 'end':
                        compareResult = safeCompare(a.end?.getTime(), b.end?.getTime(), true)
                        break

                    case 'movie':
                        compareResult = safeCompare(a.movieName, b.movieName)
                        break

                    case 'room':
                        compareResult =
                            safeCompare(a.roomId, b.roomId, true)
                        break

                    case 'subtitles':
                        compareResult =
                            safeCompare(a.subtitleId, b.subtitleId, true)
                        break

                    case 'type':
                        compareResult =
                            safeCompare(a.roomTypeId, b.roomTypeId, true)
                        break

                    case 'duration':
                        compareResult = safeCompare(a.durationMin, b.durationMin, true)
                        break

                    default:
                        // Mặc định sắp xếp theo thời gian bắt đầu nếu không có key nào khớp
                        compareResult = safeCompare(a.start?.getTime(), b.start?.getTime(), true)
                }

                // Áp dụng hướng sắp xếp
                return sortDir === 'asc' ? compareResult : -compareResult
            })

        return data
    }, [showtimes, selectedMovie, currentDate, sortKey, sortDir])

    // ===================== UI =====================
    return (
        <div className="space-y-6">
            {/* Header + Filters */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Movie/Event Scheduling</h1>
                        <p className="text-muted-foreground mt-1">Filter & print showtimes table from API payload</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Movie filter */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="movie-filter" className="text-sm text-muted-foreground whitespace-nowrap">Filter movie:</Label>
                        <Select value={selectedMovie} onValueChange={setSelectedMovie} disabled={isLoading}>
                            <SelectTrigger id="movie-filter" className="w-[220px] bg-input border-border text-foreground">
                                <SelectValue placeholder={isLoading ? "Loading..." : "All movies"} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">All movies</SelectItem>
                                {uniqueMovies.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isLoading && <div className="text-sm text-muted-foreground ml-2">Loading...</div>}
                        {error && <div className="text-sm text-destructive ml-2">{error}</div>}
                    </div>

                    {/* Month + Day nav */}
                    <div className="flex items-center gap-2">
                        <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                            <SelectTrigger className="w-[120px] bg-input border-border text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => navigateDay("prev")} className="border-border text-foreground hover:bg-muted">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-muted-foreground min-w-[150px] text-center">
              {formatSingleDate(currentDate)}
            </span>
                        <Button variant="outline" size="icon" onClick={() => navigateDay("next")} className="border-border text-foreground hover:bg-muted">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => fetchShowtimes(currentDate)} title="Reload" className="border-border text-foreground hover:bg-muted">
                            <RotateCw className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Create button + Modal */}
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />Create
                    </Button>
                    <CreateShowtimeDialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        currentDate={currentDate}
                        movies={movies}
                        rooms={rooms}
                        subtitles={subtitles}
                        onCreated={() => fetchShowtimes(currentDate)}
                    />
                </div>
            </div>

            {/* Bảng dữ liệu đã lọc để "in ra bảng" */}
            <Card className="bg-card/50 border-border">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Showtimes (Filtered)</h2>
                            <p className="text-sm text-muted-foreground">
                                Date: {formatLocalDateYMD(currentDate)} • Movie: {selectedMovie === 'all' ? 'All' : (uniqueMovies.find(m => String(m.id) === selectedMovie)?.name || selectedMovie)}
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">{filteredShowtimes.length} item(s)</div>
                    </div>

                    <div className="overflow-x-auto mt-3">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/30">
                            <tr>
                                <th onClick={() => toggleSort('start')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Start{indicator('start')}
                                </th>
                                <th onClick={() => toggleSort('end')} className="text-left p-2 border-b cursor-pointer select-none">
                                    End{indicator('end')}
                                </th>
                                <th onClick={() => toggleSort('movie')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Movie{indicator('movie')}
                                </th>
                                <th onClick={() => toggleSort('room')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Room{indicator('room')}
                                </th>
                                <th onClick={() => toggleSort('subtitles')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Subtitles{indicator('subtitles')}
                                </th>
                                <th onClick={() => toggleSort('type')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Type{indicator('type')}
                                </th>
                                <th onClick={() => toggleSort('duration')} className="text-left p-2 border-b cursor-pointer select-none">
                                    Duration{indicator('duration')}
                                </th>
                                <th className="text-left p-2 border-b">Details</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredShowtimes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-3 text-center text-muted-foreground">No data</td>
                                </tr>
                            ) : (
                                filteredShowtimes.map((st) => (
                                    <tr key={st.key} className="hover:bg-muted/20">
                                        <td className="p-2">{hhmm(st.startStr)}</td>
                                        <td className="p-2">{hhmm(st.endStr)}</td>
                                        <td className="p-2">{st.movieName}</td>
                                        <td className="p-2">{st.roomName}</td>
                                        <td className="p-2">{st.subtitleName}</td>
                                        <td className="p-2">{st.roomTypeName}</td>
                                        <td className="p-2">{formatDuration(st.durationMin)}</td>
                                        <td className="p-2">
                                            <Button variant="link" className="p-0 h-auto inline-flex items-center gap-1" onClick={() => openDetail(st.showtimeId)}>
                                                View details <ExternalLink className="w-3 h-3"/>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Detail dialog */}
            <ShowtimeDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                showtimeId={selectedShowtimeId}
                onRequestUpdate={(d) => {
                    setDetailOpen(false)
                    setUpdateInitial(d)
                    setUpdateOpen(true)
                }}
                onDeleted={() => {
                    setDetailOpen(false)
                    fetchShowtimes(currentDate)  // refresh bảng sau khi DELETE OK
                }}
            />

            <UpdateShowtimeDialog
                open={updateOpen}
                onOpenChange={setUpdateOpen}
                initial={updateInitial}
                movies={movies}
                rooms={rooms}
                subtitles={subtitles}
                onUpdated={() => {
                    setUpdateOpen(false)
                    fetchShowtimes(currentDate)  // refresh list sau khi PUT thành công
                }}
            />
        </div>
    )
}
