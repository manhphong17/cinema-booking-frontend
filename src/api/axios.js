import axios from "axios";

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8885",
    withCredentials: true, // để tự gửi cookie refreshToken
});

API.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        console.log("Interceptor triggered, status:", error.response ? .status);

        if ((error.response ? .status === 401 || error.response ? .status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8885"}/auth/refresh-token`, {}, {
                        withCredentials: true
                    }
                );

                const newAccessToken = res.data.data.accessToken;
                console.log("New access token:", newAccessToken);

                localStorage.setItem("accessToken", newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return API(originalRequest);
            } catch (refreshError) {
                console.error("Refresh token failed:", refreshError);
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);


export default API;