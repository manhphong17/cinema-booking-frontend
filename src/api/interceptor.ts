import axios from 'axios'
import { BACKEND_BASE_URL } from '@/src/utils/config'

// Tạo axios instance
export const apiClient = axios.create({
    baseURL: BACKEND_BASE_URL,
    timeout: 30000,
    withCredentials: true, // Enable sending cookies (refresh token) with requests
})

// Helper function to get user role from token or localStorage
const getUserRole = (): string | null => {
    if (typeof window === 'undefined') return null

    try {
        // Try to get role from token first
        const token = localStorage.getItem("accessToken")
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const roles = payload.roles || payload.authorities
            if (roles && Array.isArray(roles) && roles.length > 0) {
                return roles[0] // Return first role
            }
        }

        // Fallback to localStorage
        const roleName = localStorage.getItem("roleName")
        if (roleName) {
            try {
                const roles = JSON.parse(roleName)
                if (Array.isArray(roles) && roles.length > 0) {
                    return roles[0]
                }
            } catch {
                return roleName
            }
        }
    } catch (error) {
        console.error('Error getting user role:', error)
    }

    return null
}

// Helper function to determine login page based on user role
const getLoginPage = (): string => {
    if (typeof window === 'undefined') return "/login"

    const currentPath = window.location.pathname
    const userRole = getUserRole()

    // Determine login page based on role
    if (userRole) {
        const roleLower = userRole.toLowerCase()
        if (roleLower.includes('admin') || 
            roleLower.includes('operator') || 
            roleLower.includes('business')) {
            return "/login/admin"
        }
    }

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
        // Use skipAuth flag to prevent adding Authorization header
        const response = await apiClient.post(
            '/auth/refresh-token',
            {},
            { 
                withCredentials: true,
                skipAuth: true // Skip adding Authorization header
            }
        )

        if (response.data?.status === 200 && response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        }

        return null
    } catch (error) {
        console.error('Refresh token error:', error)
        return null
    }
}


// Request interceptor - tự động thêm token
apiClient.interceptors.request.use(
    (config: any) => {
        // Skip auth if flag is set or for auth endpoints
        if (config.skipAuth ||
            config.url?.includes('/auth/') ||
            config.url?.includes('/login') ||
            config.url?.includes('/register')) {
            return config
        }

        const token = localStorage.getItem("accessToken")
        if (token) {
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

        // Skip redirect for refresh-token endpoint to prevent infinite loop
        if (originalRequest.url?.includes('/auth/refresh-token')) {
            return Promise.reject(error)
        }

        // Skip redirect for auth endpoints (login, register, logout)
        if (originalRequest.url?.includes('/auth/') ||
            originalRequest.url?.includes('/login') ||
            originalRequest.url?.includes('/register')) {
            return Promise.reject(error)
        }

        // Skip redirect for public endpoints (theater details should be publicly accessible)
        if ((originalRequest.url?.includes('/theater_details') || originalRequest.url?.includes('/api/theater_details')) && 
            originalRequest.method?.toLowerCase() === 'get') {
            return Promise.reject(error)
        }

        // Skip redirect for public endpoints (theater details should be publicly accessible)
        if ((originalRequest.url?.includes('/theater_details') || originalRequest.url?.includes('/api/theater_details')) && 
            originalRequest.method?.toLowerCase() === 'get') {
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
                    return Promise.reject(error)
                }
            } catch (refreshError) {
                // Refresh failed, redirect to appropriate login page
                redirectToLogin()
                return Promise.reject(error)
            }
        } else if (error.response?.status === 401) {
            // 401 error but already retried or not retryable
            redirectToLogin()
        }

        return Promise.reject(error)
    }
)

// Helper function to redirect to login with notification
const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        const loginPage = getLoginPage()
        
        // Set notification message in sessionStorage
        sessionStorage.setItem("tokenExpired", "true")
        sessionStorage.setItem("expiredMessage", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        
        // Clear token and related data
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        
        // Use replace instead of href to prevent back button issues
        window.location.replace(loginPage)
    }
}

// Logout function - call backend to delete refresh token and clear cookies
export const logout = async () => {
    try {
        // Set flag to indicate coming from logout (prevent auto-login)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem("fromLogout", "true")
        }

        // Gọi endpoint logout để xóa refresh token trong database và xóa cookie
        await apiClient.post('/auth/log-out', {}, { withCredentials: true })
    } catch (error) {
        // Ignore errors - we still want to clear local storage and redirect
        console.error('Logout error:', error)
    } finally {
        // Xóa tất cả localStorage data
        if (typeof window !== 'undefined') {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("roleName")
            localStorage.removeItem("auth")
            localStorage.removeItem("email")
            localStorage.removeItem("userEmail")
            localStorage.removeItem("userName")
            localStorage.removeItem("customerName")
            localStorage.removeItem("userGender")
            localStorage.removeItem("userDob")
            localStorage.removeItem("userAddress")
            localStorage.removeItem("userPhone")
            localStorage.removeItem("userId")

            const loginPage = getLoginPage()
            window.location.replace(loginPage)
        }
    }
}

export default apiClient
