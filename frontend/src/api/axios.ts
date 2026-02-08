import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies/sessions
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
    // Get token from Zustand persisted storage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        try {
            const { state } = JSON.parse(authStorage);
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        } catch (error) {
            console.error('Failed to parse auth storage:', error);
        }
    }
    return config;
});

// Response interceptor - Handle errors and token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Get refresh token from storage
                const authStorage = localStorage.getItem('auth-storage');
                if (!authStorage) {
                    throw new Error('No auth storage found');
                }

                const { state } = JSON.parse(authStorage);
                if (!state?.refreshToken) {
                    throw new Error('No refresh token found');
                }

                // Try to refresh token - send refreshToken field as expected by backend
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
                    { refreshToken: state.refreshToken },
                    {
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Update token in Zustand storage
                const updatedStorage = {
                    state: {
                        ...state,
                        token: accessToken,
                        refreshToken: newRefreshToken
                    },
                    version: 0
                };
                localStorage.setItem('auth-storage', JSON.stringify(updatedStorage));

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                processQueue(null, accessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Refresh failed - clear storage and redirect to login
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
