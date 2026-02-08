import api from './axios';
import { API_CONFIG } from '@/config/api.config';

export interface Candidate {
    id: string;
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    resumeId?: string;
    resumeMetadata?: {
        fileName: string;
        fileSize: number;
        uploadedAt: string;
        storageUrl: string;
    };
    aiScore?: number;
    resumeScore?: number;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    applicationStatus: 'applied' | 'screened' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected' | 'on_hold';
    appliedAt: string;
    updatedAt: string;
}

export const candidatesService = {
    // Get all candidates
    async getCandidates(filters?: {
        jobId?: string;
        processingStatus?: string;
        applicationStatus?: string;
    }): Promise<Candidate[]> {
        const response = await api.get(API_CONFIG.ENDPOINTS.CANDIDATES.LIST, { params: filters });
        return response.data;
    },

    // Get single candidate
    async getCandidate(id: string): Promise<Candidate> {
        const response = await api.get(API_CONFIG.ENDPOINTS.CANDIDATES.GET(id));
        return response.data;
    },

    // Create candidate application
    async createCandidate(candidate: Omit<Candidate, 'id' | 'appliedAt' | 'updatedAt' | 'processingStatus' | 'applicationStatus'>): Promise<Candidate> {
        const response = await api.post(API_CONFIG.ENDPOINTS.CANDIDATES.CREATE, candidate);
        return response.data;
    },

    // Update candidate
    async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
        const response = await api.put(API_CONFIG.ENDPOINTS.CANDIDATES.UPDATE(id), updates);
        return response.data;
    },

    // Delete candidate
    async deleteCandidate(id: string): Promise<void> {
        await api.delete(API_CONFIG.ENDPOINTS.CANDIDATES.DELETE(id));
    },
};
