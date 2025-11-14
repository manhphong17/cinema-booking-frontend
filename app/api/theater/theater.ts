// app/api/theater/theater.ts
import { apiClient } from "@/src/api/interceptor";

// Response types
export interface ResponseData<T> {
    status: number;
    message: string;
    data: T;
}

export interface TheaterDetails {
    id: number;
    name: string;
    address: string;
    hotline: string;
    contactEmail: string;
    googleMapUrl: string;
    openTime: string;
    closeTime: string;
    overnight: boolean;
    information: string;
    representativeName: string;
    representativeTitle: string;
    representativePhone: string;
    representativeEmail: string;
    createdBy: string;
    updatedBy: string;
}

export interface UpdateTheaterRequest {
    name?: string;
    address?: string;
    hotline?: string;
    contactEmail?: string;
    googleMapUrl?: string;
    openTime?: string;
    closeTime?: string;
    overnight?: boolean;
    information?: string;
    representativeName?: string;
    representativeTitle?: string;
    representativePhone?: string;
    representativeEmail?: string;
}


// API functions
export async function fetchTheaterDetails(): Promise<TheaterDetails> {
    console.log('🔍 Calling API: GET /api/theater_details');
    console.log('🔑 Token in localStorage:', typeof window !== 'undefined' && localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
    console.log('👤 Role in localStorage:', typeof window !== 'undefined' && localStorage.getItem('roleName'));
    
    const { data } = await apiClient.get<ResponseData<TheaterDetails>>("/api/theater_details");
    console.log('✅ API Response:', data);
    return data.data;
}



export async function updateTheaterDetails(payload: UpdateTheaterRequest): Promise<TheaterDetails> {
    console.log('💾 Updating theater details:', payload);
    const { data } = await apiClient.put<ResponseData<TheaterDetails>>("/api/theater_details", payload);
    console.log('✅ Update Response:', data);
    return data.data;
}


