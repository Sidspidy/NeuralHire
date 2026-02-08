import api from './axios';
import { API_CONFIG } from '@/config/api.config';

export interface Interview {
    _id: string;
    candidateId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    jobId: {
        _id: string;
        title: string;
    };
    type: 'AI_VOICE' | 'AI_VIDEO' | 'LIVE' | 'SCHEDULED';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    overallScore?: number;
    questions?: Array<{
        id: string;
        question: string;
        answer?: string;
        score?: number;
    }>;
    createdAt: string;
    updatedAt: string;
    [key: string]: any; // Allow for other fields
}

export const interviewsService = {
    // Get all interviews
    async getInterviews(filters?: {
        status?: string;
        jobId?: string;
    }): Promise<Interview[]> {
        const response = await api.get(API_CONFIG.ENDPOINTS.INTERVIEWS.LIST, { params: filters });
        return response.data;
    },

    // Get single interview
    async getInterview(id: string): Promise<Interview> {
        const response = await api.get(API_CONFIG.ENDPOINTS.INTERVIEWS.GET(id));
        return response.data;
    },

    // Create interview
    async createInterview(data: {
        candidateId: string;
        jobId: string;
        type?: string;
        scheduledAt?: string;
    }): Promise<Interview> {
        const response = await api.post(API_CONFIG.ENDPOINTS.INTERVIEWS.CREATE, data);
        return response.data;
    },

    // Start interview
    async startInterview(id: string): Promise<Interview> {
        const response = await api.post(API_CONFIG.ENDPOINTS.INTERVIEWS.START(id));
        return response.data;
    },

    // Submit interview answers
    async submitInterview(id: string, answers: Array<{
        questionId: string;
        answer: string;
    }>): Promise<Interview> {
        const response = await api.post(API_CONFIG.ENDPOINTS.INTERVIEWS.SUBMIT(id), { answers });
        return response.data;
    },

    // Delete interview
    async deleteInterview(id: string): Promise<void> {
        await api.delete(API_CONFIG.ENDPOINTS.INTERVIEWS.DELETE(id));
    },
};
