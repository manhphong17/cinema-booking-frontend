"use client"
import { useEffect, useState } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { BACKEND_BASE_URL } from "@/src/utils/config"

export default function WebSocketTestPage() {
    const [messages, setMessages] = useState<string[]>([])
    const [stompClient, setStompClient] = useState<Client | null>(null)

    // @ts-ignore
    useEffect(() => {
        const socket = new SockJS(`${BACKEND_BASE_URL}/ws`)
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("✅ Connected")
                client.subscribe("/topic/chat-test", (msg) => {
                    console.log("📩 Nhận phản hồi:", msg.body)
                    setMessages((prev) => [...prev, "Server: " + msg.body])
                })
            },
        })

        client.activate()
        setStompClient(client)
        return () => client.deactivate()
    }, [])

    const sendMessage = () => {
        if (stompClient?.connected) {
            const text = "hello from client"
            stompClient.publish({ destination: "/app/chat-test", body: text })
            setMessages((prev) => [...prev, "Client: " + text])
        }
    }

    return (
        <div className="p-6">
            <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded">
                Gửi tin nhắn
            </button>
            <div className="mt-4 border p-3 bg-gray-50 h-48 overflow-y-auto">
                {messages.map((m, i) => (
                    <div key={i}>{m}</div>
                ))}
            </div>
        </div>
    )
}
