import apiClient from "./interceptor"

export interface ResponseData<T> {
  status: number
  message: string
  data: T
}

export interface PageResponse<T> {
  pageNo: number
  pageSize: number
  totalPages: number
  totalItems: number
  items: T
}

export interface RoomTypeDto {
  id: number
  name: string
  description?: string | null
}

export interface SeatTypeDto {
  id: number
  name: string
  description?: string | null
}

export interface RoomDto {
  id: number
  name: string
  roomType?: RoomTypeDto | null
  rows: number
  columns: number
  capacity: number
  status: "ACTIVE" | "INACTIVE"
  description?: string | null
  screenType?: string | null
}

export interface RoomPayload {
  name: string
  roomTypeId: number
  rows: number
  columns: number
  status: "ACTIVE" | "INACTIVE"
  description?: string
  screenType?: string
}

export async function fetchRooms(params?: {
  page?: number
  size?: number
  keyword?: string
  roomTypeId?: number
  status?: string
  sort?: string
}) {
  const { data } = await apiClient.get<ResponseData<PageResponse<RoomDto[]>>>("/rooms", { params })
  return data
}

export async function fetchRoomMeta() {
  const { data } = await apiClient.get<ResponseData<{ roomTypes: RoomTypeDto[]; seatTypes: SeatTypeDto[] }>>(
    "/rooms/meta",
  )
  return data
}

export async function fetchRoomDetail(roomId: number) {
  const { data } = await apiClient.get<ResponseData<RoomDto>>(`/rooms/${roomId}`)
  return data
}

export async function createRoom(payload: RoomPayload) {
  const { data } = await apiClient.post<ResponseData<RoomDto>>("/rooms", payload)
  return data
}

export async function updateRoom(roomId: number, payload: RoomPayload) {
  const { data } = await apiClient.put<ResponseData<RoomDto>>(`/rooms/${roomId}`, payload)
  return data
}

export async function deleteRoom(roomId: number) {
  const { data } = await apiClient.delete<ResponseData<unknown>>(`/rooms/${roomId}`)
  return data
}
