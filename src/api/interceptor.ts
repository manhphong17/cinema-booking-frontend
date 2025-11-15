// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

// ===============================
// 2️⃣ AXIOS INSTANCE
// ===============================
export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true, // Bật gửi cookies (refresh token) với requests
})

// ===============================
// 3️⃣ HELPER FUNCTIONS
// ===============================
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

const getLoginPage = (): string => {
    if (typeof window === 'undefined') return "/login"
    
    const currentPath = window.location.pathname
    
    // Nếu đang ở admin/operator/staff pages thì redirect đến admin login
    if (currentPath.startsWith('/admin') || 
        currentPath.startsWith('/operator-manager') || 
        currentPath.startsWith('/business-manager') ||
        currentPath.startsWith('/staff')) {
        return "/login/admin"
    }
    
    // Mặc định redirect đến customer login
    return "/login"
}

const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("accessToken")
        const loginPage = getLoginPage()
        // Sử dụng replace thay vì href để tránh vấn đề với nút back
        window.location.replace(loginPage)
    }
}

// ===============================
// 4️⃣ REFRESH TOKEN FUNCTION
// ===============================
const refreshAccessToken = async (): Promise<string | null> => {
    try {
        const response = await apiClient.post(
            '/auth/refresh-token',
            {},
            {  withCredentials: true }
        )

        if (response.data?.status === 200 && response.data?.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            localStorage.setItem("accessToken", newAccessToken)
            return newAccessToken
        }

        return null
    } catch {
        return null
    }
}

// ===============================
// 5️⃣ REQUEST INTERCEPTOR
// ===============================
apiClient.interceptors.request.use(
    (config: any) => {
        // Bỏ qua auth nếu flag được set (cho refresh token request)
        if (config.skipAuth) {
            return config
        }

        const token = localStorage.getItem("accessToken")

        // Bỏ qua auth cho login/register/logout endpoints (trừ refresh-token)
        if ((config.url?.includes('/auth/') && !config.url?.includes('/auth/refresh-token')) || 
            config.url?.includes('/login') || 
            config.url?.includes('/register')) {
            return config
        }
        
        // Bỏ qua auth cho logout endpoint
        if (config.url?.includes('/auth/log-out')) {
            return config
        }

        // Gửi token nếu có, không kiểm tra expired (để backend tự xử lý)
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

// ===============================
// 6️⃣ RESPONSE INTERCEPTOR
// ===============================
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Bỏ qua redirect cho auth endpoints (trừ refresh-token)
        if ((originalRequest.url?.includes('/auth/') && !originalRequest.url?.includes('/auth/refresh-token')) || 
            originalRequest.url?.includes('/login') || 
            originalRequest.url?.includes('/register')) {
            return Promise.reject(error)
        }

        // Bỏ qua refresh token nếu logout endpoint được gọi
        if (originalRequest.url?.includes('/auth/log-out')) {
            return Promise.reject(error)
        }

        // Bỏ qua redirect cho public endpoints (theater details nên công khai)
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
                }
            } catch (refreshError) {
                // Refresh thất bại, redirect đến trang login phù hợp
                redirectToLogin()
            }
        } else if (error.response?.status === 401) {
            // Lỗi 401 nhưng đã retry hoặc không thể retry
            redirectToLogin()
        }

        return Promise.reject(error)
    }
)

// ===============================
// 7️⃣ LOGOUT FUNCTION
// ===============================
export const logout = async () => {
    try {
        // Set flag để chỉ ra đang từ logout (ngăn auto-login)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem("fromLogout", "true")
        }

        // Gọi endpoint logout để xóa refresh token trong database và xóa cookie
        await apiClient.post('/auth/log-out', {}, { withCredentials: true })
    } catch (error) {
        // Bỏ qua lỗi - vẫn muốn xóa local storage và redirect
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

// ===============================
// 8️⃣ EXPORT DEFAULT
// ===============================
export default apiClient
