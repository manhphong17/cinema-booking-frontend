import { apiClient } from "./interceptor";

export type OrderStatus = "COMPLETED" | "UPCOMING" | "CANCELLED" | string;

export type CustomerOrder = {
  id: string;
  date: string; // ISO string (createdAt)
  movie?: string;
  showtime?: string; // ISO string
  seats: string[]; // e.g. ["A12","A13"]
  total: number; // totalPrice
  status: OrderStatus;
  code?: string | null;
  roomName?: string | null;
  userName?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type ListOrdersParams = {
  email?: string; // optional, will fallback to access token user on backend
  page?: number; // 1-based
  size?: number; // page size
};

export type SearchOrdersByDatePayload = {
  userId?: number; // optional, will be auto-filled from localStorage
  date: string; // yyyy-MM-dd
  page?: number; // 0-based per backend
  size?: number;
  sort?: string[];
};

export type OrderDetail = {
  orderId: number;
  createdAt: string;
  userName: string;
  orderCode: string;
  bookingCode: string | null;
  movieName: string | null;
  roomName: string | null;
  showtimeStart: string | null;
  showtimeEnd: string | null;
  seats: string[];
  totalPrice: number;
  orderStatus: string;
  reservationCode: string | null;
  paymentMethods: string[];
  qrAvailable: boolean;
  qrExpired: boolean;
  regenerateAllowed: boolean;
  qrJwt: string | null;
  qrImageUrl: string | null;
  graceMinutes: number | null;
  qrExpiryAt: string | null;
  payloadJson?: string;
  nonce?: string;
  version?: number;
};

// Normalize backend response to frontend shape
const normalizeOrder = (raw: any): CustomerOrder => {
  return {
    id: String(raw?.id ?? raw?.orderId ?? ""),
    date: raw?.date ?? raw?.createdAt ?? raw?.orderDate ?? new Date().toISOString(),
    movie: raw?.movie ?? raw?.movieTitle ?? raw?.movieName ?? raw?.title ?? "",
    showtime: raw?.showtime ?? raw?.showTime ?? raw?.startTime ?? raw?.showtimeStart ?? raw?.screeningTime ?? undefined,
    seats: Array.isArray(raw?.seats)
      ? raw.seats.map((s: any) => String(s))
      : (typeof raw?.seats === "string" ? raw.seats.split(/[\,\s]+/).filter(Boolean) : []),
    total: Number(raw?.total ?? raw?.totalAmount ?? raw?.totalPrice ?? 0),
    status: String(raw?.status ?? raw?.orderStatus ?? "").toUpperCase(),
    code: raw?.code ?? raw?.orderCode ?? null,
    roomName: raw?.roomName ?? null,
    userName: raw?.userName ?? raw?.user_name ?? null,
  };
};

export async function listMyOrders(params: ListOrdersParams = {}): Promise<PaginatedResponse<CustomerOrder>> {
  const { email, page = 1, size = 5 } = params;
  // Expected backend endpoints (adjust if needed):
  // - GET /orders/my?email=...&page=1&size=5
  // - or GET /orders?mine=true&page=1&size=5
  const response = await apiClient.get("/orders/my", {
    params: { email, page, size },
  });

  // Try common envelope formats
  const data = response?.data;
  const payload = data?.data ?? data;

  // If backend returns paginated structure
  if (payload && (Array.isArray(payload.items) || Array.isArray(payload.content))) {
    const items = (payload.items ?? payload.content ?? []).map(normalizeOrder);
    const total = Number(payload.total ?? payload.totalElements ?? items.length);
    const pageNum = Number(payload.page ?? payload.pageNumber ?? page);
    const sizeNum = Number(payload.size ?? payload.pageSize ?? size);
    return { items, total, page: pageNum, size: sizeNum };
  }

  // If backend returns an array directly
  if (Array.isArray(payload)) {
    const items = payload.map(normalizeOrder);
    return { items, total: items.length, page, size };
  }

  // Fallback empty
  return { items: [], total: 0, page, size };
}

export async function searchOrdersByDate(payload: SearchOrdersByDatePayload): Promise<PaginatedResponse<CustomerOrder>> {
  const { date, page = 0, size = 5, sort = [] } = payload;
  
  // Tự động lấy userId từ localStorage nếu không được truyền vào
  let userId = payload.userId;
  if (!userId && typeof window !== 'undefined') {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      userId = Number(storedUserId);
    }
  }
  
  const response = await apiClient.post("/orders/search-by-date", { 
    userId, 
    date, 
    page, 
    size, 
    sort 
  });
  const data = response?.data;
  const items = (data?.items ?? []).map(normalizeOrder);
  const total = Number(data?.totalElements ?? data?.total ?? items.length);
  const pageNum = Number(data?.page ?? page);
  const sizeNum = Number(data?.size ?? size);
  return { items, total, page: pageNum, size: sizeNum };
}

export async function getOrderDetail(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
}

export async function generateQRCode(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.get(`/orders/${orderId}/qr-payload`);
  return response.data;
}
