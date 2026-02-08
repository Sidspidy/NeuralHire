import { useEffect, useState } from 'react';
import { jobsService } from '@/api/jobs.service';
import { candidatesService } from '@/api/candidates.service';

export interface DashboardMetrics {
    totalJobs: number;
    totalApplicants: number;
    totalInterviews: number;
    hireRate: string;
}

export interface ActivityData {
    name: string;
    apps: number;
}

export interface ScoreData {
    range: string;
    count: number;
}

export function useDashboardData() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalJobs: 0,
        totalApplicants: 0,
        totalInterviews: 0,
        hireRate: '0%',
    });
    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [scoreData, setScoreData] = useState<ScoreData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch jobs and candidates in parallel
            const [jobs, candidates] = await Promise.all([
                jobsService.getJobs(),
                candidatesService.getCandidates({}),
            ]);

            // Calculate metrics
            const totalJobs = jobs.length;
            const totalApplicants = candidates.length;
            const interviewCandidates = candidates.filter(
                (c) => c.applicationStatus === 'interview'
            ).length;
            const offeredCandidates = candidates.filter(
                (c) => c.applicationStatus === 'offered'
            ).length;
            const hireRate =
                totalApplicants > 0
                    ? `${Math.round((offeredCandidates / totalApplicants) * 100)}%`
                    : '0%';

            setMetrics({
                totalJobs,
                totalApplicants,
                totalInterviews: interviewCandidates,
                hireRate,
            });

            // Generate activity data (last 7 days)
            // In a real app, this would come from the backend
            const activity: ActivityData[] = [
                { name: 'Mon', apps: 0 },
                { name: 'Tue', apps: 0 },
                { name: 'Wed', apps: 0 },
                { name: 'Thu', apps: 0 },
                { name: 'Fri', apps: 0 },
                { name: 'Sat', apps: 0 },
                { name: 'Sun', apps: 0 },
            ];

            // Count applications by day (simplified - would need actual dates from backend)
            candidates.forEach((_candidate) => {
                const dayIndex = Math.floor(Math.random() * 7); // Placeholder
                activity[dayIndex].apps++;
            });

            setActivityData(activity);

            // Generate score distribution
            const scores: ScoreData[] = [
                { range: '90-100', count: 0 },
                { range: '80-89', count: 0 },
                { range: '70-79', count: 0 },
                { range: '60-69', count: 0 },
                { range: '<60', count: 0 },
            ];

            candidates.forEach((candidate) => {
                const score = candidate.aiScore || 0;
                if (score >= 90) scores[0].count++;
                else if (score >= 80) scores[1].count++;
                else if (score >= 70) scores[2].count++;
                else if (score >= 60) scores[3].count++;
                else scores[4].count++;
            });

            setScoreData(scores);
        } catch (err: any) {
            console.error('Failed to fetch dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        metrics,
        activityData,
        scoreData,
        isLoading,
        error,
        refetch: fetchDashboardData,
    };
}
