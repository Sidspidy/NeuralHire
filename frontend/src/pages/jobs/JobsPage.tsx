import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MapPin, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { jobsService } from '@/api/jobs.service';
import type { Job } from '@/store/useJobsStore';

export default function JobsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await jobsService.getJobs();
            setJobs(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load jobs');
            console.error('Failed to fetch jobs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatSalary = (job: Job) => {
        if (!job.salaryRange) return 'Not specified';
        const { min, max, currency } = job.salaryRange;
        return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Jobs</h1>
                    <p className="text-text-secondary">Manage your open positions</p>
                </div>
                <Button onClick={() => navigate('/jobs/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Post New Job
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-lg border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <Input
                        placeholder="Search jobs..."
                        className="pl-10 bg-background/50 border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-text-secondary">Loading jobs...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="glass p-6 rounded-xl border border-error/20 bg-error/5">
                    <p className="text-error text-center">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredJobs.length === 0 && (
                <div className="glass p-12 rounded-xl border border-white/5 text-center">
                    <Briefcase className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No jobs found</h3>
                    <p className="text-text-secondary mb-4">
                        {searchTerm ? 'Try adjusting your search' : 'Get started by posting your first job'}
                    </p>
                    {!searchTerm && (
                        <Button onClick={() => navigate('/jobs/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Post New Job
                        </Button>
                    )}
                </div>
            )}

            {/* Jobs List */}
            {!isLoading && !error && filteredJobs.length > 0 && (
                <div className="grid gap-4">
                    {filteredJobs.map((job) => (
                        <div
                            key={job._id || job.id}
                            className="glass p-6 rounded-xl border border-white/5 hover:border-primary/50 transition-colors group relative overflow-hidden cursor-pointer"
                            onClick={() => navigate(`/jobs/${job._id || job.id}`)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">{job.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                                        {job.department && (
                                            <span className="flex items-center gap-1">
                                                <BriefcaseIcon className="h-3 w-3" /> {job.department}
                                            </span>
                                        )}
                                        {job.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {job.location}
                                            </span>
                                        )}
                                        {job.type && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {job.type}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" /> {formatSalary(job)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'OPEN' || job.status === 'Active'
                                        ? 'bg-success/10 text-success'
                                        : 'bg-text-secondary/10 text-text-secondary'
                                        }`}>
                                        {job.status}
                                    </span>
                                    <p className="mt-2 text-2xl font-bold text-text-primary">{job.applicants || 0}</p>
                                    <p className="text-xs text-text-secondary">Applicants</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

function Briefcase(props: any) {
    return <BriefcaseIcon {...props} />;
}
