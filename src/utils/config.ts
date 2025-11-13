/**
 * Centralized configuration for backend URL
 * Only one environment variable is needed: NEXT_PUBLIC_BACKEND_BASE_URL
 */

export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080'

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BACKEND_BASE_URL) {
    console.warn('[Config] NEXT_PUBLIC_BACKEND_BASE_URL is not set, using default:', BACKEND_BASE_URL)
}




