import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name?: string;
    email: string;
    role: 'RECRUITER' | 'CANDIDATE' | 'ADMIN';
}

interface AuthState {
    user: User | null;
    token: string | null; // accessToken
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    updateToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            login: (user, accessToken, refreshToken) => set({
                user: { ...user, name: user.name || user.email.split('@')[0] },
                token: accessToken,
                refreshToken,
                isAuthenticated: true
            }),
            logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
            updateToken: (accessToken) => set({ token: accessToken }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
