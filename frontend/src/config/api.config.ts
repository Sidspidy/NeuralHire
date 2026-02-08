// API Endpoint Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',

    // Service endpoints
    ENDPOINTS: {
        // Auth Service (via API Gateway)
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            ME: '/auth/me',
        },

        // Hiring Service - Jobs (via API Gateway)
        JOBS: {
            LIST: '/api/jobs',
            CREATE: '/api/jobs',
            GET: (id: string) => `/api/jobs/${id}`,
            UPDATE: (id: string) => `/api/jobs/${id}`,
            DELETE: (id: string) => `/api/jobs/${id}`,
            APPLICANTS: (id: string) => `/api/jobs/${id}/applicants`,
        },

        // Hiring Service - Candidates (via API Gateway)
        CANDIDATES: {
            LIST: '/api/candidates',
            CREATE: '/api/candidates',
            GET: (id: string) => `/api/candidates/${id}`,
            UPDATE: (id: string) => `/api/candidates/${id}`,
            DELETE: (id: string) => `/api/candidates/${id}`,
        },

        // AI Engine - Resumes (via API Gateway)
        RESUMES: {
            LIST: '/api/resumes',
            UPLOAD: '/api/resumes/upload',
            GET: (id: string) => `/api/resumes/${id}`,
            UPDATE_STATUS: (id: string) => `/api/resumes/${id}/status`,
            DELETE: (id: string) => `/api/resumes/${id}`,
            ANALYSIS: (id: string) => `/api/resumes/${id}/analysis`,
        },

        // Hiring Service - Interviews (via API Gateway)
        INTERVIEWS: {
            LIST: '/api/interviews',
            CREATE: '/api/interviews',
            GET: (id: string) => `/api/interviews/${id}`,
            UPDATE: (id: string) => `/api/interviews/${id}`,
            DELETE: (id: string) => `/api/interviews/${id}`,
            START: (id: string) => `/api/interviews/${id}/start`,
            SUBMIT: (id: string) => `/api/interviews/${id}/submit`,
        },

        // Payment Service (via API Gateway)
        PAYMENT: {
            CREATE_ORDER: '/api/payments',
            VERIFY: '/api/payments/verify',
            GET_STATUS: (id: string) => `/api/payments/${id}/status`,
            SUBSCRIPTION: '/api/payments/subscription',
            WEBHOOK: '/webhooks',
        },

        // Notification Service (Future implementation)
        NOTIFICATIONS: {
            LIST: '/api/notifications',
            MARK_READ: (id: string) => `/api/notifications/${id}/read`,
            MARK_ALL_READ: '/api/notifications/read-all',
        },
    },

    // WebSocket events for Voice Interview
    WS_EVENTS: {
        // Client → Server events
        JOIN_SESSION: 'join_session',
        AUDIO_CHUNK: 'audio_chunk',
        INTERRUPT: 'interrupt',

        // Server → Client events
        SESSION_INITIALIZED: 'session_initialized',
        AI_RESPONSE: 'ai_response',
        INTERVIEW_COMPLETED: 'interview_completed',
        ERROR: 'error',

        // Connection events
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
    },
};

export default API_CONFIG;

