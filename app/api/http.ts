// app/api/http.ts
import { apiClient } from "@/src/api/interceptor"; // hoặc dùng path tương đối nếu bạn không có alias

export async function GET<T>(url: string, params?: any): Promise<T> {
    const { data } = await apiClient.get<T>(url, { params });
    return data as T;
}
export async function POST<T>(url: string, body?: any, config?: any): Promise<T> {
    const { data } = await apiClient.post<T>(url, body, config);
    return data as T;
}
export async function PUT<T>(url: string, body?: any): Promise<T> {
    const { data } = await apiClient.put<T>(url, body);
    return data as T;
}
export async function PATCH<T>(url: string, body?: any): Promise<T> {
    const { data } = await apiClient.patch<T>(url, body);
    return data as T;
}
export async function DEL(url: string): Promise<void> {
    await apiClient.delete(url);
}
