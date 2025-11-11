// app/api/theater/theater-history.ts
import { apiClient } from "@/src/api/interceptor";

// Response types
export interface ResponseData<T> {
    status: number;
    message: string;
    data: T;
}

export interface TheaterUpdateHistory {
    id: number;
    theaterId: number;
    updatedField: string;
    oldValue: string;
    newValue: string;
    updatedBy: string;
    updatedAt: string;
}

export interface TheaterHistoryResponse {
    history: TheaterUpdateHistory[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startDate?: string;
    endDate?: string;
}

export interface GetHistoryParams {
    theaterId?: number;
    page?: number;
    size?: number;
}

export interface GetHistoryByDateRangeParams extends GetHistoryParams {
    startDate: string; // ISO format
    endDate: string;   // ISO format
}

// API functions
export async function fetchTheaterHistory(params: GetHistoryParams = {}): Promise<TheaterHistoryResponse> {
    const { theaterId = 1, page = 1, size = 20 } = params;
    
    console.log('🔍 Fetching theater history:', { theaterId, page, size });
    
    const { data } = await apiClient.get<ResponseData<TheaterHistoryResponse>>(
        "http://localhost:8885/api/theater_history",
        {
            params: { theaterId, page, size }
        }
    );
    
    console.log('✅ History Response:', data);
    return data.data;
}

export async function fetchTheaterHistoryByDateRange(
    params: GetHistoryByDateRangeParams
): Promise<TheaterHistoryResponse> {
    const { theaterId = 1, startDate, endDate, page = 1, size = 20 } = params;
    
    console.log('🔍 Fetching theater history by date range:', { theaterId, startDate, endDate, page, size });
    
    const { data } = await apiClient.get<ResponseData<TheaterHistoryResponse>>(
        "http://localhost:8885/api/theater_history/by-date-range",
        {
            params: { theaterId, startDate, endDate, page, size }
        }
    );
    
    console.log('✅ History by date range Response:', data);
    return data.data;
}
