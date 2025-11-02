import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

// Tạo axios instance
export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true, // Enable sending cookies (refresh token) with requests
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
        // Use apiClient to ensure withCredentials: true is set
        // Skip request interceptor to avoid adding expired Authorization header
        const response = await apiClient.post('/auth/refresh-token', {}, {
            skipAuth: true // Custom flag to skip auth in interceptor
        })

        // Backend response format: ResponseData<SignInResponse>
        // ResponseData structure: { status: 200, message: "...", data: { accessToken, userId, email, roleName } }
        if (response.data?.status === 200 && response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        }
        
        return null
    } catch (error: any) {
        // If refresh token is invalid/expired, cookie might be missing
        // Backend might return 401 or 403 if refresh token is invalid
        return null
    }
}

// Request interceptor - tự động thêm token
apiClient.interceptors.request.use(
    (config: any) => {
        // Skip auth if flag is set (for refresh token request)
        if (config.skipAuth) {
            return config
        }

        const token = localStorage.getItem("accessToken")

        // Skip auth for login/register endpoints (except refresh-token)
        if ((config.url?.includes('/auth/') && !config.url?.includes('/auth/refresh-token')) || 
            config.url?.includes('/login') || 
            config.url?.includes('/register')) {
            return config
        }

        if (token && !isTokenExpired(token)) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - tự động xử lý token hết hạn
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Skip redirect for auth endpoints (except refresh-token)
        if ((originalRequest.url?.includes('/auth/') && !originalRequest.url?.includes('/auth/refresh-token')) || 
            originalRequest.url?.includes('/login') || 
            originalRequest.url?.includes('/register')) {
            return Promise.reject(error)
        }

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const newToken = await refreshAccessToken()
                
                if (newToken) {
                    // Thử lại request với token mới
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return apiClient(originalRequest)
                } else {
                    // Refresh token trả về null, redirect đến login
                    redirectToLogin()
                }
            } catch (refreshError) {
                // Refresh failed, redirect to appropriate login page
                redirectToLogin()
            }
        } else if (error.response?.status === 401) {
            // 401 error but already retried or not retryable
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
        // Use replace instead of href to prevent back button issues
        window.location.replace(loginPage)
    }
}

export default apiClient
