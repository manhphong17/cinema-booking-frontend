// app/api/room/room-types.ts
import { GET, POST, PUT, PATCH, DEL } from "@/app/api/http";
import type { RoomTypeDto } from "./rooms";

export interface RoomTypeCreateRequest {
    name: string;
    description?: string | null;
    status?: "ACTIVE" | "INACTIVE";
}
export type RoomTypeUpdateRequest = Partial<RoomTypeCreateRequest>;

export const roomTypesApi = {
    list: (onlyActive?: boolean) =>
        GET<RoomTypeDto[]>("/api/room-types", { onlyActive }),

    get: (id: number) =>
        GET<RoomTypeDto>(`/api/room-types/${id}`),

    create: (body: RoomTypeCreateRequest) =>
        POST<RoomTypeDto>("/api/room-types", body),

    update: (id: number, body: RoomTypeUpdateRequest) =>
        PUT<RoomTypeDto>(`/api/room-types/${id}`, body),

    patch: (id: number, body: RoomTypeUpdateRequest) =>
        PATCH<RoomTypeDto>(`/api/room-types/${id}`, body),

    delete: (id: number) =>
        DEL(`/api/room-types/${id}`),

    activate: (id: number) =>
        POST<RoomTypeDto>(`/api/room-types/${id}/activate`),

    deactivate: (id: number) =>
        POST<RoomTypeDto>(`/api/room-types/${id}/deactivate`),
};
