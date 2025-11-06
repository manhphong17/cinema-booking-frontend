export type ApiEnvelope<T = unknown> = {
    status?: number;
    message?: string;
    code?: number | string;
    error?: string | { code?: number | string; message?: string };
    data?: any;
    errors?: Array<any>;
    // sẽ gắn thêm __headers khi ném lỗi từ fetch
    __headers?: Record<string, string | null>;
    [k: string]: any;
};

/** tìm key trong object lồng nhau theo 1 danh sách tên khả dĩ */
function deepPick(obj: any, keys: string[], maxDepth = 3): any {
    if (!obj || typeof obj !== "object" || maxDepth < 0) return undefined;
    for (const k of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
    }
    // duyệt các nhánh con
    for (const v of Object.values(obj)) {
        if (typeof v === "object") {
            const found = deepPick(v, keys, maxDepth - 1);
            if (found != null) return found;
        }
    }
    return undefined;
}

export const readServerCode = (p?: ApiEnvelope | null) => {
    if (!p) return undefined;
    // ưu tiên header
    const h = p.__headers || {};
    const headerCode = h["x-error-code"] || h["x-app-error-code"] || h["x-error"];
    if (headerCode) return headerCode;

    // tìm trong nhiều vị trí (sâu)
    return (
        p.code ??
        (typeof p.error === "object" ? (p.error as any).code : undefined) ??
        p.errorCode ??
        deepPick(p.data, ["code", "errorCode"]) ??
        deepPick(p, ["errorCode"])
    );
};

export const readServerMessage = (p?: ApiEnvelope | null) => {
    if (!p) return undefined;
    const h = p.__headers || {};
    const headerMsg = h["x-error-message"] || h["x-app-error-message"];
    if (headerMsg) return headerMsg?.toString();

    return (
        p.message ||
        (typeof p.error === "object" ? (p.error as any).message : undefined) ||
        p.error_description ||
        deepPick(p.data, ["message"]) ||
        deepPick(p, ["defaultMessage"])
    )?.toString();
};

/** Map code → thông điệp thân thiện */
const ERROR_TEXT: Record<string | number, string> = {
    1006: "Không tìm thấy OTP",
    1007: "Mã OTP không hợp lệ",
    1008: "Mã OTP đã hết hạn",
    1015: "Gửi OTP thất bại",
    1019: "Tài khoản không tồn tại",
    1033: "Token đặt lại không tồn tại",
    1034: "Token đặt lại không hợp lệ hoặc đã hết hạn",
    1021: "Tham số không hợp lệ",
    1020: "Mật khẩu quá yếu",

    OTP_NOT_FOUND: "Không tìm thấy OTP",
    OTP_INVALID: "Mã OTP không hợp lệ",
    OTP_EXPIRED: "Mã OTP đã hết hạn",
    OTP_SEND_FAILED: "Gửi OTP thất bại",
    ACCOUNT_NOT_FOUND: "Tài khoản không tồn tại",
    PASSWORD_RESET_TOKEN_NOT_FOUND: "Token đặt lại không tồn tại",
    PASSWORD_RESET_TOKEN_INVALID: "Token đặt lại không hợp lệ hoặc đã hết hạn",
    INVALID_PARAMETER: "Tham số không hợp lệ",
    PASSWORD_TOO_WEAK: "Mật khẩu quá yếu",
};

const MESSAGE_TO_CODE: Array<[RegExp, string | number]> = [
    [/invalid\s*otp/i, "OTP_INVALID"],
    [/otp.*expired/i, "OTP_EXPIRED"],
    [/otp.*not\s*found/i, "OTP_NOT_FOUND"],
    [/account.*not\s*found/i, "ACCOUNT_NOT_FOUND"],
    [/reset\s*token.*not\s*found/i, "PASSWORD_RESET_TOKEN_NOT_FOUND"],
    [/reset\s*token.*(invalid|expired)/i, "PASSWORD_RESET_TOKEN_INVALID"],
    [/tham số không hợp lệ|invalid parameter/i, "INVALID_PARAMETER"],
    [/mật khẩu.*(yếu|quá yếu)|password.*weak/i, "PASSWORD_TOO_WEAK"],
];



export function friendlyFromPayload(p?: ApiEnvelope | null, fallback?: string) {
    const code = readServerCode(p);
    if (code != null && ERROR_TEXT[code] != null) return ERROR_TEXT[code];

    const msg = readServerMessage(p);
    if (msg) {
        for (const [re, mapped] of MESSAGE_TO_CODE) {
            if (re.test(msg)) return ERROR_TEXT[mapped] ?? msg;
        }
        return msg;
    }
    // nếu có errors[] từ Bean Validation, ưu tiên ghép thông điệp theo field
    if (p?.errors && Array.isArray(p.errors) && p.errors.length) {
        const label = (f: string) => {
            switch (f) {
                case "email": return "Email";
                case "otp":
                case "otpCode":
                case "otpInput": return "Mã OTP";
                case "newPassword": return "Mật khẩu mới";
                case "resetToken": return "Mã khôi phục";
                default: return f;
            }
        };
        const lines = p.errors.map((e: any) => {
            const field = (e?.field || e?.propertyPath || "").toString();
            const msg = (e?.defaultMessage || e?.message || "").toString();
            // Chuẩn hoá “must not be blank” -> “không được để trống”
            const nice = /must not be blank/i.test(msg) ? "không được để trống" : msg || "không hợp lệ";
            return field ? `${label(field)} ${nice}` : nice;
        });
        return lines.join("\n");
    }

    return fallback || "Yêu cầu không thành công";
}
