import api from './axios';
import { API_CONFIG } from '@/config/api.config';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role?: 'RECRUITER' | 'CANDIDATE' | 'ADMIN';
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: 'RECRUITER' | 'CANDIDATE' | 'ADMIN';
    };
}


export const authService = {
    // Login
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
        return response.data;
    },

    // Register
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
        return response.data;
    },

    // Logout
    async logout(): Promise<void> {
        await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    },

    // Get current user
    async getCurrentUser(): Promise<AuthResponse['user']> {
        const response = await api.get(API_CONFIG.ENDPOINTS.AUTH.ME);
        return response.data;
    },

    // Refresh token
    async refreshToken(): Promise<{ token: string }> {
        const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH);
        return response.data;
    },
};
