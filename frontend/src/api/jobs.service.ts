import api from './axios';
import type { Job } from '@/store/useJobsStore';
import { API_CONFIG } from '@/config/api.config';

export const jobsService = {
    // Get all jobs
    async getJobs(): Promise<Job[]> {
        const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.LIST);
        return response.data;
    },

    // Get single job
    async getJob(id: string): Promise<Job> {
        const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.GET(id));
        return response.data;
    },

    // Alias for getJob
    async getJobById(id: string): Promise<Job> {
        return this.getJob(id);
    },

    // Create job
    async createJob(job: any): Promise<Job> {
        const response = await api.post(API_CONFIG.ENDPOINTS.JOBS.CREATE, job);
        return response.data;
    },

    // Update job
    async updateJob(id: string, job: Partial<Job>): Promise<Job> {
        const response = await api.put(API_CONFIG.ENDPOINTS.JOBS.UPDATE(id), job);
        return response.data;
    },

    // Delete job
    async deleteJob(id: string): Promise<void> {
        await api.delete(API_CONFIG.ENDPOINTS.JOBS.DELETE(id));
    },

    // Get applicants for a job
    async getJobApplicants(jobId: string): Promise<any[]> {
        const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.APPLICANTS(jobId));
        return response.data;
    },
};
