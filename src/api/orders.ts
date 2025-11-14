import { apiClient } from "./interceptor";

export type OrderStatus = "COMPLETED" | "UPCOMING" | "CANCELLED" | string;

export type CustomerOrder = {
  id: string;
  date: string;
  movie?: string;
  showtime?: string;
  seats: string[];
  total: number;
  status: OrderStatus;
  code?: string | null;
  roomName?: string | null;
  userName?: string | null;

  concessions?: Concession[];
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

export type Concession = {
  name: string;
  quantity: number;
  unitPrice: number;
  urlImage: string;
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
  concessions?: Concession[];
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

    // ✅ THÊM DÒNG NÀY
    concessions: Array.isArray(raw?.concessions) ? raw.concessions : []
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

// Normalize backend order detail response to frontend shape
const normalizeOrderDetail = (raw: any): OrderDetail => {
  const concessionsRaw =
      raw?.concessions ??
      raw?.orderConcessions ??
      raw?.concessionItems ??
      raw?.concessionList;

  console.log("🔥 Raw order detail từ API:", raw);
  console.log("🔥 Concessions raw:", concessionsRaw);

  return {
    orderId: raw?.orderId ?? raw?.id ?? 0,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    userName: raw?.userName ?? raw?.user_name ?? "",
    orderCode: raw?.orderCode ?? raw?.code ?? "",
    bookingCode: raw?.bookingCode ?? null,
    movieName: raw?.movieName ?? raw?.movie ?? null,
    roomName: raw?.roomName ?? null,
    showtimeStart: raw?.showtimeStart ?? null,
    showtimeEnd: raw?.showtimeEnd ?? null,
    seats: Array.isArray(raw?.seats)
        ? raw.seats.map((s: any) => String(s))
        : (typeof raw?.seats === "string" ? raw.seats.split(/[\,\s]+/).filter(Boolean) : []),

    // ✅ chỗ quan trọng
    concessions: Array.isArray(concessionsRaw) ? concessionsRaw : [],

    totalPrice: Number(raw?.totalPrice ?? raw?.total ?? 0),
    orderStatus: raw?.orderStatus ?? raw?.status ?? "",
    reservationCode: raw?.reservationCode ?? null,
    paymentMethods: Array.isArray(raw?.paymentMethods) ? raw.paymentMethods : [],
    qrAvailable: Boolean(raw?.qrAvailable ?? false),
    qrExpired: Boolean(raw?.qrExpired ?? false),
    regenerateAllowed: Boolean(raw?.regenerateAllowed ?? false),
    qrJwt: raw?.qrJwt ?? null,
    qrImageUrl: raw?.qrImageUrl ?? null,
    graceMinutes: raw?.graceMinutes ?? null,
    qrExpiryAt: raw?.qrExpiryAt ?? null,
    payloadJson: raw?.payloadJson,
    nonce: raw?.nonce,
    version: raw?.version,
  };
};


export async function getOrderDetail(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.get(`/orders/${orderId}`);
  return normalizeOrderDetail(response.data); // ✅ nhớ gọi normalizer
}

export async function generateQRCode(orderId: number): Promise<OrderDetail> {
  const response = await apiClient.get(`/orders/${orderId}/qr-payload`);
  return normalizeOrderDetail(response.data); // ✅ không trả raw nữa
}

// Staff ticket checking types
export type TicketCheckResult = {
  orderId: number;
  orderCode: string;
  bookingCode: string | null;
  movieName: string | null;
  roomName: string | null;
  showtimeStart: string | null;
  showtimeEnd: string | null;
  seats: string[];
  customerName: string;
  purchaseDate: string;
  totalAmount: number;
  status: "valid" | "used" | "expired" | "invalid";
  orderStatus: string;
  qrExpired: boolean;
  qrExpiryAt: string | null;
  concessions?: Concession[];
};

// Normalize ticket check response
const normalizeTicketCheck = (raw: any): TicketCheckResult => {
  const orderStatus = String(raw?.orderStatus ?? raw?.status ?? "").toUpperCase();
  
  // Determine ticket status based on order status and other factors
  let status: "valid" | "used" | "expired" | "invalid" = "invalid";
  
  if (orderStatus === "COMPLETED" || orderStatus === "PAID") {
    const qrExpired = Boolean(raw?.qrExpired ?? false);
    const showtimeStart = raw?.showtimeStart ?? raw?.showtime ?? null;
    
    // Check if showtime has passed (expired)
    if (showtimeStart) {
      const showtimeDate = new Date(showtimeStart);
      const now = new Date();
      if (showtimeDate < now) {
        status = "expired";
      } else if (qrExpired) {
        status = "expired";
      } else {
        // Check if already used (you may need to add a used flag from backend)
        // For now, assume valid if order is completed and not expired
        status = "valid";
      }
    } else {
      status = qrExpired ? "expired" : "valid";
    }
  } else if (orderStatus === "CANCELLED" || orderStatus === "REFUNDED") {
    status = "invalid";
  }

  return {
    orderId: raw?.orderId ?? raw?.id ?? 0,
    orderCode: raw?.orderCode ?? raw?.code ?? "",
    bookingCode: raw?.bookingCode ?? null,
    movieName: raw?.movieName ?? raw?.movie ?? null,
    roomName: raw?.roomName ?? null,
    showtimeStart: raw?.showtimeStart ?? raw?.showtime ?? null,
    showtimeEnd: raw?.showtimeEnd ?? null,
    seats: Array.isArray(raw?.seats)
      ? raw.seats.map((s: any) => String(s))
      : (typeof raw?.seats === "string" ? raw.seats.split(/[\,\s]+/).filter(Boolean) : []),
    customerName: raw?.userName ?? raw?.customerName ?? raw?.user_name ?? "",
    purchaseDate: raw?.createdAt ?? raw?.purchaseDate ?? new Date().toISOString(),
    totalAmount: Number(raw?.totalPrice ?? raw?.totalAmount ?? raw?.total ?? 0),
    status,
    orderStatus,
    qrExpired: Boolean(raw?.qrExpired ?? false),
    qrExpiryAt: raw?.qrExpiryAt ?? null,
    concessions: Array.isArray(raw?.concessions) ? raw.concessions : [],
  };
};

/**
 * Verify/check a ticket by QR code or ticket code
 * @param ticketCode - QR code JWT token or order code
 */
export async function verifyTicket(ticketCode: string): Promise<TicketCheckResult> {
  try {
    // Try to verify as QR JWT token first
    const response = await apiClient.post("/orders/verify", {
      qrToken: ticketCode,
    });
    
    const data = response?.data;
    const payload = data?.data ?? data;
    return normalizeTicketCheck(payload);
  } catch (error: any) {
    // If QR verification fails, try to get order by code
    if (error?.response?.status === 404 || error?.response?.status === 400) {
      try {
        // Try to get order by order code
        const orderResponse = await apiClient.get(`/orders/code/${ticketCode}`);
        const orderData = orderResponse?.data;
        const orderPayload = orderData?.data ?? orderData;
        return normalizeTicketCheck(orderPayload);
      } catch (orderError) {
        // If both fail, return invalid ticket
        throw new Error("Không tìm thấy vé với mã này");
      }
    }
    throw error;
  }
}

/**
 * Mark a ticket as used (check-in)
 * @param orderId - Order ID to mark as used
 */
export async function markTicketAsUsed(orderId: number): Promise<TicketCheckResult> {
  const response = await apiClient.post(`/orders/${orderId}/check-in`, {});
  const data = response?.data;
  const payload = data?.data ?? data;
  return normalizeTicketCheck(payload);
}