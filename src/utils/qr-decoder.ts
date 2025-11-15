/**
 * QR Code Decoder Utilities
 * 
 * Utility functions để decode JSON từ QR code và extract thông tin
 * Hỗ trợ cả JWT token và JSON trực tiếp
 */

/**
 * Decode JWT token (chỉ lấy payload, không verify signature)
 * @param jwtToken - JWT token string
 * @returns Decoded payload object hoặc null nếu lỗi
 */
export function decodeJWT(jwtToken: string | null): any | null {
  if (!jwtToken) return null;
  
  try {
    // JWT format: header.payload.signature
    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    // Decode payload (base64url)
    const payload = parts[1];
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * QR Payload Structure - JSON Format (đơn giản, dễ đọc)
 */
export interface QRPayloadJSON {
  orderId: number;                // ID đơn hàng
  orderCode: string;             // Mã đơn hàng
  reservationCode: string;       // Mã đặt chỗ
  status: string;                 // Trạng thái đơn hàng
  movie: string;                  // Tên phim
  room: string;                   // Tên phòng
  start: string;                  // Giờ bắt đầu (ISO format)
  end: string;                   // Giờ kết thúc (ISO format)
  seats: string[];               // Danh sách ghế
  userName?: string;             // Tên khách hàng (optional)
  userId?: number;               // ID khách hàng (optional)
}

/**
 * QR Payload Structure - JWT Format (legacy, vẫn hỗ trợ)
 */
export interface QRPayload {
  ver: number;                    // Version
  nonce: string;                  // Nonce để prevent replay attacks
  exp: number;                     // Expiration timestamp (Unix)
  orderCode: string;              // Mã đơn hàng
  order: {
    orderId: number;              // ID đơn hàng
    orderCode: string;            // Mã đơn hàng
    reservationCode: string;      // Mã đặt chỗ
    status: string;               // Trạng thái đơn hàng
  };
  showtime: {
    movie: string;                // Tên phim
    room: string;                 // Tên phòng
    start: string;                // Giờ bắt đầu (ISO format)
    end: string;                  // Giờ kết thúc (ISO format)
  };
  seats: string[];                // Danh sách ghế
  userName?: string;             // Tên khách hàng
  userId?: number;                // ID khách hàng
}

/**
 * Extract thông tin từ QR JWT token
 * @param qrJwt - QR JWT token string
 * @returns Object chứa userName, orderId, và các thông tin khác
 */
export function extractQRInfo(qrJwt: string | null): {
  userName: string | null;
  userId: number | null;
  orderId: number | null;
  orderCode: string | null;
  payload: QRPayload | null;
} {
  if (!qrJwt) {
    return {
      userName: null,
      userId: null,
      orderId: null,
      orderCode: null,
      payload: null,
    };
  }
  
  const decoded = decodeJWT(qrJwt);
  if (!decoded) {
    return {
      userName: null,
      userId: null,
      orderId: null,
      orderCode: null,
      payload: null,
    };
  }
  
  const payload = decoded as QRPayload;
  
  return {
    userName: payload.userName ?? null,
    userId: payload.userId ?? null,
    orderId: payload.order?.orderId ?? null,
    orderCode: payload.orderCode ?? payload.order?.orderCode ?? null,
    payload: payload,
  };
}

/**
 * Parse JSON từ QR code string (hỗ trợ cả JSON trực tiếp và JWT)
 * @param qrString - QR code string (có thể là JSON hoặc JWT)
 * @returns Parsed object hoặc null nếu lỗi
 */
export function parseQRString(qrString: string | null): QRPayloadJSON | QRPayload | null {
  if (!qrString) return null;
  
  try {
    // Thử parse như JSON trước (format mới - đơn giản)
    const json = JSON.parse(qrString);
    return json as QRPayloadJSON;
  } catch {
    // Nếu không phải JSON, thử decode như JWT (format cũ)
    return decodeJWT(qrString);
  }
}

/**
 * Extract thông tin từ QR string (hỗ trợ cả JSON và JWT)
 * @param qrString - QR code string (JSON hoặc JWT)
 * @returns Object chứa userName, orderId, và các thông tin khác
 */
export function extractQRInfoFromString(qrString: string | null): {
  userName: string | null;
  userId: number | null;
  orderId: number | null;
  orderCode: string | null;
  movie: string | null;
  room: string | null;
  start: string | null;
  end: string | null;
  seats: string[];
  payload: QRPayloadJSON | QRPayload | null;
} {
  if (!qrString) {
    return {
      userName: null,
      userId: null,
      orderId: null,
      orderCode: null,
      movie: null,
      room: null,
      start: null,
      end: null,
      seats: [],
      payload: null,
    };
  }
  
  const parsed = parseQRString(qrString);
  if (!parsed) {
    return {
      userName: null,
      userId: null,
      orderId: null,
      orderCode: null,
      movie: null,
      room: null,
      start: null,
      end: null,
      seats: [],
      payload: null,
    };
  }
  
  // Check if it's new JSON format (QRPayloadJSON)
  if ('orderId' in parsed && 'movie' in parsed) {
    const jsonPayload = parsed as QRPayloadJSON;
    return {
      userName: jsonPayload.userName ?? null,
      userId: jsonPayload.userId ?? null,
      orderId: jsonPayload.orderId ?? null,
      orderCode: jsonPayload.orderCode ?? null,
      movie: jsonPayload.movie ?? null,
      room: jsonPayload.room ?? null,
      start: jsonPayload.start ?? null,
      end: jsonPayload.end ?? null,
      seats: jsonPayload.seats ?? [],
      payload: jsonPayload,
    };
  }
  
  // Old JWT format (QRPayload)
  const jwtPayload = parsed as QRPayload;
  return {
    userName: jwtPayload.userName ?? null,
    userId: jwtPayload.userId ?? null,
    orderId: jwtPayload.order?.orderId ?? null,
    orderCode: jwtPayload.orderCode ?? jwtPayload.order?.orderCode ?? null,
    movie: jwtPayload.showtime?.movie ?? null,
    room: jwtPayload.showtime?.room ?? null,
    start: jwtPayload.showtime?.start ?? null,
    end: jwtPayload.showtime?.end ?? null,
    seats: jwtPayload.seats ?? [],
    payload: jwtPayload,
  };
}

/**
 * Extract thông tin từ payloadJson (nếu có)
 * @param payloadJson - JSON string của payload
 * @returns Object chứa userName, orderId, và các thông tin khác
 */
export function extractQRInfoFromJSON(payloadJson: string | null | undefined): {
  userName: string | null;
  userId: number | null;
  orderId: number | null;
  orderCode: string | null;
  movie: string | null;
  room: string | null;
  start: string | null;
  end: string | null;
  seats: string[];
  payload: QRPayloadJSON | QRPayload | null;
} {
  if (!payloadJson) {
    return {
      userName: null,
      userId: null,
      orderId: null,
      orderCode: null,
      movie: null,
      room: null,
      start: null,
      end: null,
      seats: [],
      payload: null,
    };
  }
  
  return extractQRInfoFromString(payloadJson);
}

/**
 * Tạo QR code string - chỉ chứa orderCode (đơn giản nhất)
 * @param orderCode - Order code string
 * @returns Order code string để encode vào QR
 */
export function createQRCode(orderCode: string): string {
  return orderCode.trim();
}

