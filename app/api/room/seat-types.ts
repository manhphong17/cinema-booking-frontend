// app/api/room/seat-types.ts
import { GET, POST, PUT, PATCH, DEL } from "@/app/api/http";
import type { SeatTypeDto } from "./rooms"; // đã có trong rooms.ts

export interface SeatTypeCreateRequest {
    name: string;
    description?: string | null;
    status?: "ACTIVE" | "INACTIVE";
}
export type SeatTypeUpdateRequest = Partial<SeatTypeCreateRequest>;

export const seatTypesApi = {
    list: (onlyActive?: boolean) =>
        GET<SeatTypeDto[]>("/api/seat-types", { onlyActive }),

    get: (id: number) =>
        GET<SeatTypeDto>(`/api/seat-types/${id}`),

    create: (body: SeatTypeCreateRequest) =>
        POST<SeatTypeDto>("/api/seat-types", body),

    update: (id: number, body: SeatTypeUpdateRequest) =>
        PUT<SeatTypeDto>(`/api/seat-types/${id}`, body),

    patch: (id: number, body: SeatTypeUpdateRequest) =>
        PATCH<SeatTypeDto>(`/api/seat-types/${id}`, body),

    delete: (id: number) =>
        DEL(`/api/seat-types/${id}`),

    activate: (id: number) =>
        POST<SeatTypeDto>(`/api/seat-types/${id}/activate`),

    deactivate: (id: number) =>
        POST<SeatTypeDto>(`/api/seat-types/${id}/deactivate`),
};
