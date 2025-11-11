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
    bannerUrl: string;
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
    bannerUrl?: string;
    information?: string;
    representativeName?: string;
    representativeTitle?: string;
    representativePhone?: string;
    representativeEmail?: string;
}

// API functions
export async function fetchTheaterDetails(): Promise<TheaterDetails> {
    console.log('🔍 Calling API: GET /theater_details');
    console.log('🔑 Token in localStorage:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
    console.log('👤 Role in localStorage:', localStorage.getItem('roleName'));
    
    const { data } = await apiClient.get<ResponseData<TheaterDetails>>("http://localhost:8885/api/theater_details");
    console.log('✅ API Response:', data);
    return data.data;
}

export async function updateTheaterDetails(payload: UpdateTheaterRequest): Promise<TheaterDetails> {
    console.log('💾 Updating theater details:', payload);
    const { data } = await apiClient.put<ResponseData<TheaterDetails>>("http://localhost:8885/api/theater_details", payload);
    console.log('✅ Update Response:', data);
    return data.data;
}

// Upload banner image
export async function uploadBanner(file: File): Promise<string> {
    console.log('📤 Uploading banner:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ResponseData<string>>(
        "http://localhost:8885/api/theater_banner",
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );

    console.log('✅ Upload Response:', data);

    if (data.status === 200 && data.data) {
        console.log('🎉 Banner URL:', data.data);
        return data.data; // Return banner URL
    } else {
        console.error('❌ Upload failed:', data.message);
        throw new Error(data.message || "Có lỗi xảy ra khi tải ảnh lên");
    }
}
