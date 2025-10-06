import API from "./axios";

export type UserProfile = {
    id?: string;
    name: string;
    gender?: string;
    dateOfBirth?: string;
    email: string;
    address?: string;
    phoneNumber?: string;
    loyaltyPoints?: number;
};

export type UpdateUserRequest = {
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
};

export type ForgotPasswordResponse = {
    status: number;
    message: string;
};

export type ResetPasswordPayload = {
    email: string;
    otp: string;
    newPassword: string;
};

export type ChangePasswordPayload = {
    email: string;
    oldPassword: string;
    newPassword: string;
    otp: string;
    confirmPassword?: string;
};

export async function getMe(email: string) {
    // Debug log
    // eslint-disable-next-line no-console
    console.log("[userApi] GET /users/me params:", { email });
    const response = await API.get(`/users/me`, { params: { email } });
    // eslint-disable-next-line no-console
    console.log("[userApi] GET /users/me response:", response?.data);
    const raw = response.data?.data as any;
    // Normalize backend fields -> frontend shape
    const normalized: UserProfile = {
        id: String(raw?.id ?? ""),
        name: raw?.name ?? "",
        email: raw?.email ?? email,
        address: raw?.address ?? "",
        phoneNumber: raw?.phoneNumber ?? raw?.phone ?? "",
        loyaltyPoints: raw?.loyaltyPoints ?? raw?.loyalPoint ?? 0,
        // gender and dateOfBirth are client-managed when backend lacks them
    };
    return normalized;
}

export async function updateMe(email: string, payload: UpdateUserRequest) {
    // eslint-disable-next-line no-console
    console.log("[userApi] PUT /users/me", { email, payload });
    const response = await API.put(`/users/me`, payload, { params: { email } });
    // eslint-disable-next-line no-console
    console.log("[userApi] PUT /users/me response:", response?.data);
    return response.data?.data as UserProfile;
}

export async function requestPasswordOtp(email: string) {
    // eslint-disable-next-line no-console
    console.log("[userApi] POST /auth/forgot-password", { email });
    const response = await API.post("/auth/forgot-password", { email });
    // eslint-disable-next-line no-console
    console.log("[userApi] POST /auth/forgot-password response:", response?.data);
    return response.data as ForgotPasswordResponse;
}

export async function resetPassword(payload: ResetPasswordPayload) {
    // eslint-disable-next-line no-console
    console.log("[userApi] POST /auth/reset-password", payload);
    const response = await API.post("/auth/reset-password", payload);
    // eslint-disable-next-line no-console
    console.log("[userApi] POST /auth/reset-password response:", response?.data);
    return response.data as ForgotPasswordResponse;
}

export async function changePassword(payload: ChangePasswordPayload) {
    // eslint-disable-next-line no-console
    console.log("[userApi] PUT /auth/change-password", payload);
    const response = await API.put("/auth/change-password", payload);
    // eslint-disable-next-line no-console
    console.log("[userApi] PUT /auth/change-password response:", response?.data);
    return response.data as ForgotPasswordResponse;
}


