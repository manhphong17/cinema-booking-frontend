// src/utils/server-error.ts

/**
 * Định nghĩa cấu trúc của payload lỗi được trả về từ backend.
 * Dựa trên class `ErrorResponse` và `GlobalExceptionHandler` trong code Java.
 */
export interface BackendErrorResponse {
    title?: string;
    status?: number; // Đây là mã lỗi nghiệp vụ từ ErrorCode enum (ví dụ: 1040)
    message?: string;
    instance?: string;
    timestamp?: string;
    // Các trường khác có thể có
    [k: string]: any;
}

/**
 * Map mã lỗi từ backend (ErrorCode) sang thông điệp thân thiện với người dùng trên UI.
 * Bạn nên cập nhật danh sách này để bao gồm tất cả các mã lỗi quan trọng từ `ErrorCode.java`.
 */
const ERROR_TEXT: Record<number, string> = {
    // Lỗi chung & người dùng
    1001: "Người dùng đã tồn tại",
    1002: "Email đã tồn tại",
    1005: "Email hoặc mật khẩu không hợp lệ",
    1019: "Tài khoản không tồn tại",
    1020: "Mật khẩu quá yếu",
    1021: "Tham số không hợp lệ",

    // Lỗi nghiệp vụ phòng & ghế
    1030: "Không tìm thấy loại ghế",
    1031: "Không tìm thấy loại phòng",
    1038: "Tên loại ghế này đã tồn tại",
    1039: "Loại ghế đang được sử dụng, không thể xóa",
    1040: "Tên loại phòng này đã tồn tại",
    1041: "Loại phòng đang được sử dụng, không thể xóa",
    1042: "Tên phòng này đã tồn tại",
    1043: "Phòng đang được sử dụng, không thể xóa",
    1044: "Kích thước phòng vượt quá giới hạn cho phép (tối đa 12 hàng/cột)",
    2003: "Không tìm thấy phòng",
    2033: "Phòng đang ở trạng thái không hoạt động",

    // Lỗi nghiệp vụ suất chiếu
    2036: "Suất chiếu bị trùng lặp trong cùng một phòng",
    3001: "Không tìm thấy suất chiếu",

    // Thêm các mã lỗi khác bạn muốn hiển thị thông báo thân thiện ở đây...
};

/**
 * Chuyển đổi payload lỗi từ server (trong `error.response.data`) thành một thông báo thân thiện.
 * @param errorPayload - Object lỗi được trả về từ backend.
 * @param fallback - Thông báo mặc định nếu không thể dịch lỗi.
 * @returns Một chuỗi thông báo lỗi dễ hiểu cho người dùng.
 */
export function friendlyFromPayload(errorPayload?: BackendErrorResponse | null, fallback?: string): string {
    // Nếu không có payload lỗi, trả về thông báo mặc định.
    if (!errorPayload) {
        return fallback || "Yêu cầu không thành công";
    }

    // Backend trả về mã lỗi nghiệp vụ trong trường `status` của `ErrorResponse`.
    const errorCode = errorPayload.status;
    const serverMessage = errorPayload.message;

    // 1. Ưu tiên tra cứu mã lỗi trong danh sách đã định nghĩa sẵn.
    if (errorCode != null && ERROR_TEXT[errorCode]) {
        return ERROR_TEXT[errorCode];
    }

    // 2. Nếu không có mã lỗi trong danh sách, sử dụng message trực tiếp từ server.
    if (serverMessage) {
        return serverMessage;
    }

    // 3. Nếu không có gì cả, trả về thông báo mặc định.
    return fallback || "Đã xảy ra lỗi không xác định";
}
