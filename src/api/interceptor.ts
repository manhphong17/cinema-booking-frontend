import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

// Tạo axios instance
export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

// Token management utilities
const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp < currentTime
    } catch {
        return true
    }
}

// Helper function to determine login page based on user role
const getLoginPage = (): string => {
    if (typeof window === 'undefined') return "/login"
    
    const currentPath = window.location.pathname
    
    // Nếu đang ở admin/operator pages thì redirect đến admin login
    if (currentPath.startsWith('/admin') || 
        currentPath.startsWith('/operator-manager') || 
        currentPath.startsWith('/business-manager')) {
        return "/login/admin"
    }
    
    // Mặc định redirect đến customer login
    return "/login"
}

const refreshAccessToken = async (): Promise<string | null> => {
    try {
        console.log("🔄 Attempting to refresh access token...")
        console.log("🔄 Base URL:", BASE_URL)
        console.log("🔄 Cookies:", document.cookie)
        
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, {
            withCredentials: true
        })

        console.log("🔄 Refresh response status:", response.status)
        console.log("🔄 Refresh response data:", response.data)

        if (response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            console.log("✅ Access token refreshed successfully: " + newAccessToken)
            return newAccessToken
        }
        
        console.log("❌ No access token in refresh response")
        return null
    } catch (error) {
        console.error("❌ Refresh token failed:", error)
        // Don't redirect here, let the interceptor handle it
        return null
    }
}

// Request interceptor - tự động thêm token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken")
        console.log("Request interceptor - Token exists:", !!token)
        console.log("Request interceptor - Token expired:", token ? isTokenExpired(token) : "N/A")
        console.log("Request interceptor - URL:", config.url)

        // Skip auth for login/register endpoints (except refresh-token)
        if ((config.url?.includes('/auth/') && !config.url?.includes('/auth/refresh-token')) || 
            config.url?.includes('/login') || 
            config.url?.includes('/register')) {
            console.log("Request interceptor - Skipping auth for auth endpoints")
            return config
        }

        if (token && !isTokenExpired(token)) {
            config.headers?.set?.("Authorization", `Bearer ${token}`)
            console.log("Request interceptor - Authorization header added")
        } else {
            console.log("Request interceptor - No valid token, proceeding without auth")
            // Don't redirect here, let the response interceptor handle 401
        }

        return config
    },
    (error) => {
        console.error("Request interceptor error:", error)
        return Promise.reject(error)
    }
)



// Response interceptor - tự động xử lý token hết hạn
apiClient.interceptors.response.use(
    (response) => {
        console.log("Response interceptor - Success:", response.status, response.config.url)
        return response
    },
    async (error) => {
        console.log("Response interceptor - Error:", error.response?.status, error.config?.url)
        const originalRequest = error.config

        // Skip redirect for auth endpoints (except refresh-token)
        if ((originalRequest.url?.includes('/auth/') && !originalRequest.url?.includes('/auth/refresh-token')) || 
            originalRequest.url?.includes('/login') || 
            originalRequest.url?.includes('/register')) {
            console.log("Response interceptor - Skipping redirect for auth endpoints")
            return Promise.reject(error)
        }

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log("Response interceptor - 401 error detected, attempting refresh...")
            originalRequest._retry = true

            try {
                const newToken = await refreshAccessToken()
                
                if (newToken) {
                    // Thử lại request với token mới
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    console.log("Response interceptor - Retrying request with new token")
                    return apiClient(originalRequest)
                } else {
                    // Refresh token trả về null, redirect đến login
                    console.log("Refresh token returned null, redirecting to login")
                    redirectToLogin()
                }
            } catch (refreshError) {
                // Refresh failed, redirect to appropriate login page
                console.error("Refresh error in interceptor:", refreshError)
                redirectToLogin()
            }
        } else if (error.response?.status === 401) {
            // 401 error but already retried or not retryable
            console.log("Response interceptor - 401 error, redirecting to login")
            redirectToLogin()
        }

        return Promise.reject(error)
    }
)

// Helper function to redirect to login
const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("accessToken")
        const loginPage = getLoginPage()
        console.log("Redirecting to:", loginPage)
        // Use replace instead of href to prevent back button issues
        window.location.replace(loginPage)
    }
}

export default apiClient


// ====== RoomType & SeatType DTOs ======
export type CommonStatus = "active" | "inactive"

export interface RoomTypeDto {
    id: number
    name: string
    description?: string
    status: CommonStatus
}

export interface SeatTypeDto {
    id: number
    name: string
    description?: string
    status: CommonStatus
}

export interface RoomTypeCreateRequest {
    name: string
    description?: string
}

export interface RoomTypeUpdateRequest {
    name?: string
    description?: string
    status?: CommonStatus
}

export interface SeatTypeCreateRequest {
    name: string
    description?: string
}

export interface SeatTypeUpdateRequest {
    name?: string
    description?: string
    status?: CommonStatus
}



// ====== Tiny wrappers (cho đỡ lặp đi lặp lại) ======
async function GET<T>(url: string, params?: any): Promise<T> {
    const { data } = await apiClient.get<T>(url, { params })
    return data as T
}
async function POST<T>(url: string, body?: any, config?: any): Promise<T> {
    const { data } = await apiClient.post<T>(url, body, config)
    return data as T
}
async function PUT<T>(url: string, body?: any): Promise<T> {
    const { data } = await apiClient.put<T>(url, body)
    return data as T
}
async function PATCH<T>(url: string, body?: any): Promise<T> {
    const { data } = await apiClient.patch<T>(url, body)
    return data as T
}
async function DEL(url: string): Promise<void> {
    await apiClient.delete(url)
}



// ====== Room Types API ======
export const roomTypesApi = {
    list: (onlyActive?: boolean) =>
        GET<RoomTypeDto[]>("/api/room-types", { onlyActive }),

    get: (id: number) =>
        GET<RoomTypeDto>(`/api/room-types/${id}`),

    create: (body: RoomTypeCreateRequest) =>
        POST<RoomTypeDto>("/api/room-types", body),

    update: (id: number, body: RoomTypeUpdateRequest) =>
        PUT<RoomTypeDto>(`/api/room-types/${id}`, body),

    patch: (id: number, body: RoomTypeUpdateRequest) =>
        PATCH<RoomTypeDto>(`/api/room-types/${id}`, body),

    delete: (id: number) =>
        DEL(`/api/room-types/${id}`),

    activate: (id: number) =>
        POST<RoomTypeDto>(`/api/room-types/${id}/activate`),

    deactivate: (id: number) =>
        POST<RoomTypeDto>(`/api/room-types/${id}/deactivate`),
}

// ====== Seat Types API ======
export const seatTypesApi = {
    list: (onlyActive?: boolean) =>
        GET<SeatTypeDto[]>("/api/seat-types", { onlyActive }),

    get: (id: number) =>
        GET<SeatTypeDto>(`/api/seat-types/${id}`),

    create: (body: SeatTypeCreateRequest) =>
        POST<SeatTypeDto>("/api/seat-types", body),

    update: (id: number, body: SeatTypeUpdateRequest) =>
        PUT<SeatTypeDto>(`/api/seat-types/${id}`, body),

    patch: (id: number, body: SeatTypeUpdateRequest) =>
        PATCH<SeatTypeDto>(`/api/seat-types/${id}`, body),

    delete: (id: number) =>
        DEL(`/api/seat-types/${id}`),

    activate: (id: number) =>
        POST<SeatTypeDto>(`/api/seat-types/${id}/activate`),

    deactivate: (id: number) =>
        POST<SeatTypeDto>(`/api/seat-types/${id}/deactivate`),
}
