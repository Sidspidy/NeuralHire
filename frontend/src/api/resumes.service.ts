import api from './axios';
import type { Resume } from '@/store/useResumesStore';
import { API_CONFIG } from '@/config/api.config';

export const resumesService = {
    // Get all resumes
    async getResumes(filters?: {
        jobId?: string;
        status?: string;
        minScore?: number;
        maxScore?: number;
    }): Promise<Resume[]> {
        const response = await api.get(API_CONFIG.ENDPOINTS.RESUMES.LIST, { params: filters });
        return response.data;
    },

    // Get single resume
    async getResume(id: string): Promise<Resume> {
        const response = await api.get(API_CONFIG.ENDPOINTS.RESUMES.GET(id));
        return response.data;
    },

    // Upload resume
    async uploadResume(formData: FormData): Promise<Resume> {
        const response = await api.post(API_CONFIG.ENDPOINTS.RESUMES.UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update resume status
    async updateResumeStatus(id: string, status: Resume['status']): Promise<Resume> {
        const response = await api.patch(API_CONFIG.ENDPOINTS.RESUMES.UPDATE_STATUS(id), { status });
        return response.data;
    },

    // Delete resume
    async deleteResume(id: string): Promise<void> {
        await api.delete(API_CONFIG.ENDPOINTS.RESUMES.DELETE(id));
    },

    // Get AI analysis for resume
    async getAIAnalysis(id: string): Promise<Resume['aiAnalysis']> {
        const response = await api.get(API_CONFIG.ENDPOINTS.RESUMES.ANALYSIS(id));
        return response.data;
    },
};
