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
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, {
            withCredentials: true
        })

        if (response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        }
        
        throw new Error("No access token in response")
    } catch (error) {
        console.error("Refresh token failed:", error)
        // Redirect to appropriate login page
        if (typeof window !== 'undefined') {
            localStorage.removeItem("accessToken")
            const loginPage = getLoginPage()
            window.location.href = loginPage
        }
        return null
    }
}

// Request interceptor - tự động thêm token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken")

        if (token && !isTokenExpired(token)) {
            config.headers?.set?.("Authorization", `Bearer ${token}`)
        }

        return config
    },
    (error) => Promise.reject(error)
)



// Response interceptor - tự động xử lý token hết hạn
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const newToken = await refreshAccessToken()
                
                if (newToken) {
                    // Thử lại request với token mới
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return apiClient(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed, redirect to appropriate login page
                if (typeof window !== 'undefined') {
                    localStorage.removeItem("accessToken")
                    const loginPage = getLoginPage()
                    window.location.href = loginPage
                }
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
