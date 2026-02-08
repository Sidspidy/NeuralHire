import { create } from 'zustand';

export interface Resume {
    id: string;
    candidateName: string;
    email: string;
    phone?: string;
    jobId: string;
    jobTitle: string;
    fileName: string;
    fileUrl: string;
    score: number;
    status: 'Queued' | 'Analyzing' | 'Scored' | 'Recommended' | 'Qualified' | 'Rejected';
    keywords: string[];
    skills: string[];
    experience: number;
    education: string;
    aiAnalysis?: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    createdAt: string;
    updatedAt: string;
}

interface ResumesState {
    resumes: Resume[];
    isLoading: boolean;
    error: string | null;
    selectedResume: Resume | null;
    filters: {
        jobId?: string;
        status?: string;
        minScore?: number;
        maxScore?: number;
    };
    setResumes: (resumes: Resume[]) => void;
    addResume: (resume: Resume) => void;
    updateResume: (id: string, resume: Partial<Resume>) => void;
    deleteResume: (id: string) => void;
    setSelectedResume: (resume: Resume | null) => void;
    setFilters: (filters: Partial<ResumesState['filters']>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    getFilteredResumes: () => Resume[];
}

export const useResumesStore = create<ResumesState>((set, get) => ({
    resumes: [],
    isLoading: false,
    error: null,
    selectedResume: null,
    filters: {},
    setResumes: (resumes) => set({ resumes }),
    addResume: (resume) => set((state) => ({ resumes: [...state.resumes, resume] })),
    updateResume: (id, updatedResume) =>
        set((state) => ({
            resumes: state.resumes.map((resume) =>
                resume.id === id ? { ...resume, ...updatedResume } : resume
            ),
        })),
    deleteResume: (id) => set((state) => ({ resumes: state.resumes.filter((r) => r.id !== id) })),
    setSelectedResume: (resume) => set({ selectedResume: resume }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    getFilteredResumes: () => {
        const { resumes, filters } = get();
        return resumes.filter((resume) => {
            if (filters.jobId && resume.jobId !== filters.jobId) return false;
            if (filters.status && resume.status !== filters.status) return false;
            if (filters.minScore && resume.score < filters.minScore) return false;
            if (filters.maxScore && resume.score > filters.maxScore) return false;
            return true;
        });
    },
}));
