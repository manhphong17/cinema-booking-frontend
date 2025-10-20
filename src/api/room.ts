import { GET, POST, PUT, DEL } from "./interceptor";

export type RoomStatus = "ACTIVE" | "INACTIVE";
export type RoomsQuery = {
    pageNo?: number; pageSize?: number; keyword?: string;
    roomTypeId?: number; status?: RoomStatus; sortBy?: string;
};

export function getRooms(q: RoomsQuery){
    return GET<{ data:any[]; total:number }>("/rooms", q);
}
export function getRoom(id: number){
    return GET<{ data:any }>(`/rooms/${id}`);
}
export function createRoom(payload: {
    name:string; roomTypeId:number; rows:number; columns:number;
    status:RoomStatus; description?:string; screenType?:string;
}){
    return POST<{ data:any }>("/rooms", payload);
}
export function updateRoom(id:number, payload: Partial<{
    name:string; roomTypeId:number; rows:number; columns:number;
    status:RoomStatus; description?:string; screenType?:string;
}>){
    return PUT<{ data:any }>(`/rooms/${id}`, payload);
}
export function deleteRoom(id:number){
    return DEL(`/rooms/${id}`);
}
export function getRoomMeta(){
    return GET<{ roomTypes:any[]; seatTypes:any[] }>("/rooms/meta");
}
