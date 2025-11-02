import { apiClient } from "@/src/api/interceptor" // hoặc: import { apiClient } from "../../../src/api/interceptor"
import type { ResponseData, SeatTypeDto } from "./rooms"

export interface SeatCellDto {
    id: number | null
    rowIndex: number
    columnIndex: number
    rowLabel?: string | null
    number?: number | null
    seatType?: SeatTypeDto | null
    status?: string | null
    isBlocked?: boolean | null
    note?: string | null
}

export interface SeatMatrixResponse {
    room: {
        id: number
        name: string
        rows: number
        columns: number
        capacity: number
    }
    matrix: (SeatCellDto | null)[][]
}

export interface SeatInitRequest {
    rows: number
    columns: number
    defaultSeatTypeId: number
}

export interface SeatMatrixRequest {
    matrix: Array<
        Array<{
            id: number | null
            rowIndex: number
            columnIndex: number
            seatTypeId: number
            status: string
            isBlocked?: boolean
            note?: string | null
        } | null>
    >
}

export async function initSeats(roomId: number, body: SeatInitRequest) {
    const { data } = await apiClient.post<ResponseData<{ created: number }>>(`/rooms/${roomId}/seats/init`, body)
    return data
}

export async function fetchSeatMatrix(roomId: number) {
    const { data } = await apiClient.get<ResponseData<SeatMatrixResponse>>(`/rooms/${roomId}/seats/matrix`)
    return data
}

export async function saveSeatMatrix(roomId: number, body: SeatMatrixRequest) {
    const { data } = await apiClient.put<ResponseData<{ updated: number; created: number; deleted: number }>>(
        `/rooms/${roomId}/seats/matrix`,
        body,
    )
    return data
}

export async function bulkUpdateSeatType(
    roomId: number,
    body: { targets: { rowIndex: number; columnIndex: number }[]; seatTypeId: number },
) {
    const { data } = await apiClient.patch<ResponseData<{ affected: number }>>(
        `/rooms/${roomId}/seats/bulk-type`,
        body,
    )
    return data
}

export async function bulkBlockSeats(
    roomId: number,
    body: { targets: { rowIndex: number; columnIndex: number }[]; blocked: boolean },
) {
    const { data } = await apiClient.patch<ResponseData<{ affected: number }>>(
        `/rooms/${roomId}/seats/bulk-block`,
        body,
    )
    return data
}
