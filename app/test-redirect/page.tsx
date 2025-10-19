'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestRedirectPage() {
    const [debugInfo, setDebugInfo] = useState<any>({})
    const router = useRouter()

    useEffect(() => {
        const info = {
            token: localStorage.getItem('accessToken'),
            userId: localStorage.getItem('userId'),
            roleName: localStorage.getItem('roleName'),
            email: localStorage.getItem('email'),
            cookies: document.cookie,
            currentPath: window.location.pathname,
            timestamp: new Date().toISOString()
        }
        setDebugInfo(info)
        console.log('Test redirect debug info:', info)
    }, [])

    const testCustomerRedirect = () => {
        console.log('Testing customer redirect')
        router.push('/customer')
    }

    const testAdminRedirect = () => {
        console.log('Testing admin redirect')
        router.push('/admin')
    }

    const testOperatorRedirect = () => {
        console.log('Testing operator redirect')
        router.push('/operator-manager')
    }

    const testBusinessRedirect = () => {
        console.log('Testing business redirect')
        router.push('/business-manager')
    }

    const testStaffRedirect = () => {
        console.log('Testing staff redirect')
        router.push('/staff')
    }

    const clearStorage = () => {
        localStorage.clear()
        setDebugInfo({})
        console.log('Storage cleared')
    }

    const simulateLogin = (role: string) => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzM0NzQ4MDAwLCJleHAiOjE3MzQ3NTUyMDB9.mock'
        localStorage.setItem('accessToken', mockToken)
        localStorage.setItem('userId', '1')
        localStorage.setItem('roleName', JSON.stringify([role]))
        localStorage.setItem('email', 'test@example.com')
        
        const info = {
            token: localStorage.getItem('accessToken'),
            userId: localStorage.getItem('userId'),
            roleName: localStorage.getItem('roleName'),
            email: localStorage.getItem('email'),
            cookies: document.cookie,
            currentPath: window.location.pathname,
            timestamp: new Date().toISOString()
        }
        setDebugInfo(info)
        console.log('Simulated login for role:', role)
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Test Redirect Page</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Test Redirects:</h2>
                    <div className="space-y-2">
                        <button 
                            onClick={testCustomerRedirect}
                            className="w-full bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Test Customer Redirect (/customer)
                        </button>
                        
                        <button 
                            onClick={testAdminRedirect}
                            className="w-full bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Test Admin Redirect (/admin)
                        </button>
                        
                        <button 
                            onClick={testOperatorRedirect}
                            className="w-full bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Test Operator Redirect (/operator-manager)
                        </button>
                        
                        <button 
                            onClick={testBusinessRedirect}
                            className="w-full bg-purple-500 text-white px-4 py-2 rounded"
                        >
                            Test Business Redirect (/business-manager)
                        </button>
                        
                        <button 
                            onClick={testStaffRedirect}
                            className="w-full bg-orange-500 text-white px-4 py-2 rounded"
                        >
                            Test Staff Redirect (/staff)
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Simulate Login:</h2>
                    <div className="space-y-2">
                        <button 
                            onClick={() => simulateLogin('CUSTOMER')}
                            className="w-full bg-blue-100 text-blue-800 px-4 py-2 rounded"
                        >
                            Simulate CUSTOMER Login
                        </button>
                        
                        <button 
                            onClick={() => simulateLogin('ADMIN')}
                            className="w-full bg-red-100 text-red-800 px-4 py-2 rounded"
                        >
                            Simulate ADMIN Login
                        </button>
                        
                        <button 
                            onClick={() => simulateLogin('OPERATION')}
                            className="w-full bg-green-100 text-green-800 px-4 py-2 rounded"
                        >
                            Simulate OPERATION Login
                        </button>
                        
                        <button 
                            onClick={() => simulateLogin('BUSINESS')}
                            className="w-full bg-purple-100 text-purple-800 px-4 py-2 rounded"
                        >
                            Simulate BUSINESS Login
                        </button>
                        
                        <button 
                            onClick={() => simulateLogin('STAFF')}
                            className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded"
                        >
                            Simulate STAFF Login
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <button 
                    onClick={clearStorage}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Clear Storage
                </button>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
                <pre className="text-sm overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>
        </div>
    )
}
