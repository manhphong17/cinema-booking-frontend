'use client'

import { useState } from 'react'
import apiClient from '@/api/interceptor'

export default function DebugRefreshPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    const testRefreshToken = async () => {
        setIsLoading(true)
        addLog("🔄 Testing refresh token...")
        
        try {
            const response = await apiClient.post('/auth/refresh-token', {}, {
                withCredentials: true
            })
            
            addLog(`✅ Refresh successful: ${JSON.stringify(response.data)}`)
        } catch (error: any) {
            addLog(`❌ Refresh failed: ${error.message}`)
            addLog(`❌ Error status: ${error.response?.status}`)
            addLog(`❌ Error data: ${JSON.stringify(error.response?.data)}`)
        }
        
        setIsLoading(false)
    }

    const testProtectedAPI = async () => {
        setIsLoading(true)
        addLog("🔄 Testing protected API...")
        
        try {
            const response = await apiClient.get('/api/user/profile')
            addLog(`✅ Protected API success: ${JSON.stringify(response.data)}`)
        } catch (error: any) {
            addLog(`❌ Protected API failed: ${error.message}`)
            addLog(`❌ Error status: ${error.response?.status}`)
        }
        
        setIsLoading(false)
    }

    const clearLogs = () => {
        setLogs([])
    }

    const checkCookies = () => {
        addLog(`🍪 Current cookies: ${document.cookie}`)
        addLog(`🔑 Access token: ${localStorage.getItem('accessToken') ? 'EXISTS' : 'NOT FOUND'}`)
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Debug Refresh Token</h1>
            
            <div className="space-y-4 mb-6">
                <button 
                    onClick={checkCookies}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                    Check Cookies & Token
                </button>
                
                <button 
                    onClick={testRefreshToken}
                    disabled={isLoading}
                    className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                >
                    Test Refresh Token
                </button>
                
                <button 
                    onClick={testProtectedAPI}
                    disabled={isLoading}
                    className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
                >
                    Test Protected API
                </button>
                
                <button 
                    onClick={clearLogs}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Clear Logs
                </button>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Debug Logs:</h2>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
