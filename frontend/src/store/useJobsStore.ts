import { create } from 'zustand';

export interface Job {
    _id?: string; // MongoDB ID
    id?: string; // For compatibility
    title: string;
    department: string;
    location: string;
    description?: string;

    // Backend uses these fields
    employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | string;
    requiredSkills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | string;

    // Legacy fields (for backward compatibility)
    type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | string;
    salary?: string;
    requirements?: string[];
    skills?: string[];

    salaryRange?: {
        min: number;
        max: number;
        currency: string;
    };
    status?: 'Active' | 'Closed' | 'Draft' | 'OPEN' | 'active' | string;
    applicants?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface JobsState {
    jobs: Job[];
    isLoading: boolean;
    error: string | null;
    selectedJob: Job | null;
    setJobs: (jobs: Job[]) => void;
    addJob: (job: Job) => void;
    updateJob: (id: string, job: Partial<Job>) => void;
    deleteJob: (id: string) => void;
    setSelectedJob: (job: Job | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
    jobs: [],
    isLoading: false,
    error: null,
    selectedJob: null,
    setJobs: (jobs) => set({ jobs }),
    addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
    updateJob: (id, updatedJob) =>
        set((state) => ({
            jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updatedJob } : job)),
        })),
    deleteJob: (id) => set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),
    setSelectedJob: (job) => set({ selectedJob: job }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));
