"use client";

// ===============================
// 1️⃣ IMPORT & CONFIG CHUNG
// ===============================
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { BACKEND_BASE_URL } from "@/src/utils/config";

// ===============================
// 2️⃣ TYPE DEFINITIONS
// ===============================
export type SeatAction = "SELECT_SEAT" | "DESELECT_SEAT";

export type SeatTicketDTO = {
  ticketId: number;
  rowIdx: number;
  columnIdx: number;
  seatType: string;
  status: string;
};

export type SeatUpdateMessage = {
  seats: SeatTicketDTO[];
  status: string; // 'HELD' | 'RELEASED' | 'FAILED' | 'EXPIRED' | 'BOOKED'
  userId?: number; // Optional - có thể không có cho trạng thái BOOKED
  showtimeId: number;
};

export type SeatSelectRequest = {
  action: SeatAction;
  showtimeId: number;
  userId: number;
  ticketIds: number[];
};

// ===============================
// 3️⃣ WEBSOCKET CONNECTION
// ===============================
export async function connectSeatSocket(
  showtimeId: number,
  onSeatUpdate: (message: SeatUpdateMessage) => void,
  onError?: (error: any) => void
) {
  const socket = new SockJS(`${BACKEND_BASE_URL}/ws`);

  const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      // Subscribe để nhận cập nhật ghế cho showtime này
      client.subscribe(`/topic/seat/${showtimeId}`, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body) as SeatUpdateMessage;
          onSeatUpdate(data);
        } catch (error) {
          onError?.(error);
        }
      });
    },
    onStompError: (frame) => {
      // Xử lý lỗi ở tầng STOMP protocol (khác với lỗi WebSocket cơ bản)
      // Ví dụ: lỗi khi subscribe, publish, authentication, authorization
      onError?.(frame);
    },
    onWebSocketError: (event) => {
      // Xử lý lỗi ở tầng WebSocket cơ bản (kết nối mạng, timeout, v.v.)
      onError?.(event);
    },
    onDisconnect: () => {
      // Disconnected
    },
  });

  client.activate();
  return client;
}

// ===============================
// 4️⃣ SEND SEAT ACTION
// ===============================
export function sendSeatAction(client: Client, request: SeatSelectRequest) {
  if (!client.connected) {
    return;
  }

  client.publish({
    destination: "/app/seat/select",
    body: JSON.stringify(request),
  });
}
