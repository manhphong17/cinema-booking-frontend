"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Shield, Users, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** 🔧 BACKEND CONFIG */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8885";
const PAGE_SIZE = 20;

/** ===================== Role constants (khớp DB) ===================== */
type RoleCode = "ADMIN" | "CUSTOMER" | "OPERATION" | "STAFF" | "BUSINESS";

const ROLE_OPTIONS: { id: number; code: RoleCode; label: string }[] = [
    { id: 1, code: "ADMIN", label: "Quản trị viên" },
    { id: 5, code: "BUSINESS", label: "Quản lý kinh doanh" },
    { id: 3, code: "OPERATION", label: "Quản lý vận hành" },
    { id: 4, code: "STAFF", label: "Nhân viên bán vé" },
    { id: 2, code: "CUSTOMER", label: "Khách hàng" },
];

const ROLE_LABEL_BY_CODE: Record<RoleCode, string> = ROLE_OPTIONS.reduce((m, r) => {
    m[r.code] = r.label;
    return m;
}, {} as Record<RoleCode, string>);

const ROLE_ID_BY_CODE: Record<RoleCode, number> = ROLE_OPTIONS.reduce((m, r) => {
    m[r.code] = r.id;
    return m;
}, {} as Record<RoleCode, number>);

/** ===================== Types (khớp với backend) ===================== */
type RoleItemFromApi = {
    id: number;
    name: RoleCode; // BE trả name = ADMIN/CUSTOMER/...
};

type AccountStatusUI = "active" | "inactive";
type AccountStatusBE = "ACTIVE" | "DEACTIVATED" | string;

export type Account = {
    id: number;
    name: string;
    email: string;
    roles?: RoleItemFromApi[];
    roleCode?: RoleCode;
    roleLabel?: string;
    roleId?: number;
    status: AccountStatusUI;
    [k: string]: any;
};

type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
};

type ResponseData<T> = {
    status?: number;
    code?: number;
    message?: string;
    desc?: string;
    data?: T;
    result?: T;
    payload?: T;
};

/** ===================== Helpers ===================== */
function unwrap<T = unknown>(raw: ResponseData<T> | T): T | undefined {
    if (raw && typeof raw === "object" && ("data" in raw || "result" in raw || "payload" in raw)) {
        const r = raw as ResponseData<T>;
        return (r.data ?? r.result ?? r.payload) as T;
    }
    return raw as T;
}

function authHeaders(): Record<string, string> {
    const token = (typeof window !== "undefined" && localStorage.getItem("accessToken")) || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(init?.headers || {}),
        },
    });
    let body: any = null;
    try {
        body = await res.json();
    } catch {}
    if (!res.ok) {
        const msg = (body && (body.message || body.error || body.desc)) || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return body as T;
}

function normalizeStatusUI(statusFromBE: any): AccountStatusUI {
    const s = String(statusFromBE ?? "").toUpperCase();
    return s === "ACTIVE" ? "active" : "inactive";
}
function mapStatusUItoBE(s: AccountStatusUI): AccountStatusBE {
    return s === "active" ? "ACTIVE" : "DEACTIVATED";
}
function normalizeName(acc: any): string {
    // BE nay đã trả name phẳng từ users -> AccountResponse.name
    return acc.name ?? acc.user?.name ?? acc.fullName ?? acc.email ?? `#${acc.id ?? "?"}`;
}
function normalizeRoleInfo(acc: any): { roleLabel?: string; roleId?: number; roleCode?: RoleCode } {
    if (Array.isArray(acc.roles) && acc.roles.length > 0) {
        const r = acc.roles[0] as RoleItemFromApi;
        const code = r.name as RoleCode;
        return {
            roleLabel: ROLE_LABEL_BY_CODE[code] ?? code,
            roleId: r.id,
            roleCode: code,
        };
    }
    return {};
}

/** ===================== Component ===================== */
function AccountManagement() {
    // server data
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // ui state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    // dialogs
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // form states
    const [editingUser, setEditingUser] = useState<Account | null>(null);

    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
        roleId: undefined as number | undefined,
        password: "",
        confirmPassword: "",
        showNew: false,
        showConfirm: false,
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
        showNew: false,
        showConfirm: false,
    });
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const mounted = useRef(false);

    /** ===================== Load list ===================== */
    const loadAccounts = async (p = 0) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE_URL}/accounts?page=${p}&size=${PAGE_SIZE}`;
            const raw = await fetchJson<ResponseData<Page<any>>>(url, {
                method: "GET",
                credentials: "include",
            });
            const pageObj = unwrap<Page<any>>(raw);

            const content = (pageObj?.content ?? []).map((acc: any) => {
                const name = normalizeName(acc);
                const { roleLabel, roleId, roleCode } = normalizeRoleInfo(acc);
                const status = normalizeStatusUI(acc.status);
                return {
                    ...acc,
                    name,
                    roleLabel,
                    roleId,
                    roleCode,
                    status,
                } as Account;
            });

            setAccounts(content);
            setTotalPages(pageObj?.totalPages ?? 0);
            setTotalElements(pageObj?.totalElements ?? content.length);
            setPage(pageObj?.number ?? p);
        } catch (e: any) {
            setError(e.message || "Không tải được danh sách tài khoản");
            setAccounts([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        loadAccounts(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** ===================== Derived ===================== */
    const filteredAccounts = useMemo(() => {
        return accounts.filter((acc) => {
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch = !q ? true : (acc.name ?? "").toLowerCase().includes(q) || (acc.email ?? "").toLowerCase().includes(q);

            const matchesRole = selectedRole === "all" || String(acc.roleCode ?? "").toUpperCase() === String(selectedRole ?? "").toUpperCase();

            const matchesStatus = selectedStatus === "all" || String(acc.status ?? "").toLowerCase() === String(selectedStatus ?? "").toLowerCase();

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [accounts, searchTerm, selectedRole, selectedStatus]);

    const totalTicketStaff = useMemo(() => accounts.filter((a) => a.roleCode === "STAFF").length, [accounts]);
    const totalManagers = useMemo(() => accounts.filter((a) => ["BUSINESS", "OPERATION"].includes(String(a.roleCode))).length, [accounts]);

    /** ===================== CRUD: CREATE ===================== */
    const handleCreate = async () => {
        if (!createForm.name || !createForm.email || !createForm.roleId) {
            setError("Vui lòng nhập họ tên, email và vai trò");
            return;
        }
        if (!createForm.password || !createForm.confirmPassword) {
            setError("Vui lòng nhập mật khẩu và xác nhận mật khẩu");
            return;
        }
        if (createForm.password !== createForm.confirmPassword) {
            setError("Mật khẩu và xác nhận mật khẩu không khớp");
            return;
        }

        try {
            setError(null);
            setLoading(true);

            // DTO AccountCreateRequest
            const body = {
                name: createForm.name,
                email: createForm.email,
                password: createForm.password,
                roleIds: [createForm.roleId],
            };

            await fetchJson(`${API_BASE_URL}/accounts`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            await loadAccounts(0);
            setIsCreateDialogOpen(false);
            setCreateForm({
                name: "",
                email: "",
                roleId: undefined,
                password: "",
                confirmPassword: "",
                showNew: false,
                showConfirm: false,
            });
        } catch (e: any) {
            setError(e.message || "Không tạo được tài khoản");
        } finally {
            setLoading(false);
        }
    };

    /** ===================== CRUD: EDIT OPEN ===================== */
    const handleEditClick = (acc: Account) => {
        setEditingUser({ ...acc });
        setShowPasswordFields(false);
        setPasswordForm({
            newPassword: "",
            confirmPassword: "",
            showNew: false,
            showConfirm: false,
        });
        setIsEditDialogOpen(true);
    };

    /** ===================== CRUD: SAVE INFO (PUT /accounts/{id}) ===================== */
    const handleSaveEdit = async () => {
        if (!editingUser) return;
        if (!editingUser.name) {
            setError("Tên không được để trống");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const statusBE = mapStatusUItoBE(editingUser.status);

            let roleId = editingUser.roleId;
            if (!roleId && editingUser.roleCode) {
                roleId = ROLE_ID_BY_CODE[editingUser.roleCode];
            }

            // ✅ KHÔNG gửi newPassword ở đây
            const payload: any = {
                name: editingUser.name,
                status: statusBE,
                roleIds: roleId != null ? [roleId] : [], // [] => clear hết role
            };

            await fetchJson(`${API_BASE_URL}/accounts/${editingUser.id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            const updated = { ...editingUser };
            setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setIsEditDialogOpen(false);
            setEditingUser(null);
        } catch (e: any) {
            setError(e.message || "Không cập nhật được tài khoản");
        } finally {
            setLoading(false);
        }
    };

    /** ===================== ADMIN CHANGE PASSWORD (POST /accounts/{id}/admin-change-password) ===================== */
    const handleAdminChangePassword = async () => {
        if (!editingUser) return;

        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError("Vui lòng nhập và xác nhận mật khẩu mới");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // DTO AccountChangePasswordRequest
            const body = {
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            };

            await fetchJson(
                `${API_BASE_URL}/accounts/${editingUser.id}/admin-change-password`,
                {
                    method: "POST",
                    body: JSON.stringify(body),
                }
            );

            // reset UI
            setShowPasswordFields(false);
            setPasswordForm({
                newPassword: "",
                confirmPassword: "",
                showNew: false,
                showConfirm: false,
            });
        } catch (e: any) {
            setError(e.message || "Không đổi được mật khẩu");
        } finally {
            setLoading(false);
        }
    };


    /** ===================== UI helpers ===================== */
    const getStatusBadge = (status: string) =>
        status === "active" ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
        ) : (
            <Badge variant="secondary">Inactive</Badge>
        );

    /** ===================== Render ===================== */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
                    <p className="text-gray-600 mt-2">Quản lý tài khoản nhân viên và quản lý trên toàn hệ thống</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Tạo tài khoản
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tạo tài khoản mới</DialogTitle>
                            <DialogDescription>Thêm tài khoản nhân viên hoặc quản lý mới</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và tên</Label>
                                <Input
                                    id="name"
                                    placeholder="Nhập họ và tên"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Nhập địa chỉ email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Vai trò</Label>
                                <Select value={createForm.roleId?.toString() ?? ""} onValueChange={(v) => setCreateForm((p) => ({ ...p, roleId: Number(v) }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={createForm.showNew ? "text" : "password"}
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                                        placeholder="Nhập mật khẩu"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setCreateForm((p) => ({ ...p, showNew: !p.showNew }))}
                                    >
                                        {createForm.showNew ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={createForm.showConfirm ? "text" : "password"}
                                        value={createForm.confirmPassword}
                                        onChange={(e) => setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                        placeholder="Nhập lại mật khẩu"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setCreateForm((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                                    >
                                        {createForm.showConfirm ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                                <p className="text-xs text-blue-700">
                                    • Mật khẩu cần có ít nhất 8 ký tự
                                    <br />• Khuyến nghị gồm chữ hoa, chữ thường và số
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Tạo tài khoản
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Errors */}
            {error ? <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">{error}</div> : null}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900">Khách Hàng</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{accounts.filter((a) => a.roleCode === "CUSTOMER").length}</div>
                        <p className="text-xs text-gray-600 mt-2">Bao gồm tất cả người dùng đã đăng ký tài khoản.</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900">Nhân Viên Bán Vé</CardTitle>
                        <Shield className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{accounts.filter((a) => a.roleCode === "STAFF").length}</div>
                        <p className="text-xs text-gray-600 mt-2">Nhân viên bán vé tại các rạp phim.</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900">Quản Lí</CardTitle>
                        <Shield className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{accounts.filter((a) => ["BUSINESS", "OPERATION"].includes(String(a.roleCode))).length}</div>
                        <p className="text-xs text-gray-600 mt-2">Gồm các Business & Operator Manager.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white border-blue-100 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Tất cả vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả vai trò</SelectItem>
                                {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r.id} value={r.code}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="active">Đang hoạt động</SelectItem>
                                <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-white border-blue-100 shadow-md">
                <CardHeader>
                    <CardTitle className="text-gray-900">Danh sách tài khoản</CardTitle>
                    <CardDescription className="text-gray-600">Quản lý tài khoản và quyền truy cập</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={cn("relative", loading && "opacity-60")}>
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        ) : null}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAccounts.map((acc) => (
                                    <TableRow key={acc.id}>
                                        <TableCell>
                                            <p className="font-medium text-gray-900">{acc.name || acc.email || `#${acc.id}`}</p>
                                        </TableCell>
                                        <TableCell className="text-gray-600">{acc.email ?? "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{acc.roleLabel ?? "—"}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(String(acc.status ?? "inactive"))}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(acc)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {/* Không có nút xóa theo yêu cầu */}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filteredAccounts.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                                            Không có tài khoản nào phù hợp.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                            Trang {page + 1}/{Math.max(totalPages, 1)} • Tổng {totalElements} bản ghi
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => loadAccounts(Math.max(0, page - 1))} disabled={page <= 0 || loading}>
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadAccounts(Math.min(Math.max(totalPages - 1, 0), page + 1))}
                                disabled={page >= Math.max(totalPages - 1, 0) || loading}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-white border-blue-100 shadow-lg sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 text-xl">Chỉnh sửa tài khoản</DialogTitle>
                        <DialogDescription className="text-gray-600">Cập nhật thông tin và cài đặt người dùng</DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <div className="space-y-6 py-2">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {String(editingUser.name)
                                        .split(" ")
                                        .map((n) => (n ? n[0] : ""))
                                        .join("")}
                                </div>
                                <div>
                                    <p className="text-gray-900 font-semibold">{editingUser.name}</p>
                                    <p className="text-gray-600 text-sm">{editingUser.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name" className="text-gray-900 font-medium">
                                        Họ và tên
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-email" className="text-gray-900 font-medium">
                                        Email (Chỉ đọc)
                                    </Label>
                                    <Input id="edit-email" value={editingUser.email} disabled className="bg-gray-50 text-gray-500" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-900 font-medium">Vai trò</Label>
                                        <Select
                                            value={String(editingUser.roleId ?? (editingUser.roleCode ? ROLE_ID_BY_CODE[editingUser.roleCode] : "") ?? "")}
                                            onValueChange={(value) => {
                                                const id = Number(value);
                                                const role = ROLE_OPTIONS.find((r) => r.id === id);
                                                setEditingUser({
                                                    ...editingUser,
                                                    roleId: id,
                                                    roleCode: role?.code,
                                                    roleLabel: role?.label,
                                                });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLE_OPTIONS.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-900 font-medium">Trạng thái</Label>
                                        <Select value={editingUser.status} onValueChange={(value) => setEditingUser({ ...editingUser, status: value as AccountStatusUI })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Đang hoạt động</SelectItem>
                                                <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Admin change password */}
                            <div className="border-t pt-4">
                                <Button variant="outline" onClick={() => setShowPasswordFields(!showPasswordFields)} className="w-full justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span>{showPasswordFields ? "Ẩn" : "Đổi"} mật khẩu</span>
                                    </div>
                                </Button>

                                {showPasswordFields && (
                                    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="space-y-2">
                                            <Label className="text-gray-900 font-medium">Mật khẩu mới</Label>
                                            <div className="relative">
                                                <Input
                                                    type={passwordForm.showNew ? "text" : "password"}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    placeholder="Nhập mật khẩu mới"
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                    onClick={() => setPasswordForm((p) => ({ ...p, showNew: !p.showNew }))}
                                                >
                                                    {passwordForm.showNew ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-900 font-medium">Xác nhận mật khẩu mới</Label>
                                            <div className="relative">
                                                <Input
                                                    type={passwordForm.showConfirm ? "text" : "password"}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    placeholder="Xác nhận mật khẩu mới"
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                    onClick={() => setPasswordForm((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                                                >
                                                    {passwordForm.showConfirm ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setShowPasswordFields(false)}>
                                                Hủy
                                            </Button>
                                            <Button onClick={handleAdminChangePassword} disabled={loading}>
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Đổi mật khẩu
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Đóng
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export { AccountManagement };
export default AccountManagement;
