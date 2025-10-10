import { apiClient } from './interceptor'

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

// Auth guard function to check token on page load
export const checkAuthAndRedirect = () => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem("accessToken")
    const currentPath = window.location.pathname

    // Skip check for login/register pages
    if (currentPath.includes('/login') || 
        currentPath.includes('/register') || 
        currentPath.includes('/forgot-password') ||
        currentPath.includes('/reset-password') ||
        currentPath.includes('/verify-otp')) {
        return
    }

    // If no token or token expired, redirect to login
    if (!token || isTokenExpired(token)) {
        console.log("Auth guard - No valid token, redirecting to login")
        const loginPage = getLoginPage()
        console.log("Auth guard - Redirecting to:", loginPage)
        window.location.replace(loginPage)
    }
}

// Hook for React components
export const useAuthGuard = () => {
    if (typeof window !== 'undefined') {
        checkAuthAndRedirect()
    }
}
