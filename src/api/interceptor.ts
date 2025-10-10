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
        console.log("Attempting to refresh access token...")
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, {
            withCredentials: true
        })

        if (response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            console.log("Access token refreshed successfully")
            return newAccessToken
        }
        
        console.log("No access token in refresh response")
        return null
    } catch (error) {
        console.error("Refresh token failed:", error)
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

        // Skip auth for login/register endpoints
        if (config.url?.includes('/auth/') || config.url?.includes('/login') || config.url?.includes('/register')) {
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

        // Skip redirect for auth endpoints
        if (originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register')) {
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
