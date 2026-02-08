import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { useNotificationStore } from '@/store/useNotificationStore';
import { candidatesService, type Candidate } from '@/api/candidates.service';

export default function ResumesPage() {
    const navigate = useNavigate();
    const { addToast } = useNotificationStore();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await candidatesService.getCandidates();
            setCandidates(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load candidates');
            console.error('Failed to fetch candidates:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (files: File[]) => {
        try {
            // TODO: Implement actual upload logic with AI Engine
            console.log('Uploading files:', files);

            // Simulate upload
            await new Promise((resolve) => setTimeout(resolve, 2000));

            addToast({
                type: 'success',
                title: 'Upload Successful',
                message: `${files.length} resume(s) uploaded and queued for AI analysis`,
            });

            // Refresh candidates list
            fetchCandidates();
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Upload Failed',
                message: 'Failed to upload resumes. Please try again.',
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'selected':
            case 'completed':
                return 'bg-success/10 text-success';
            case 'rejected':
            case 'failed':
                return 'bg-error/10 text-error';
            case 'interviewed':
            case 'shortlisted':
            case 'processing':
                return 'bg-warning/10 text-warning';
            case 'screened':
                return 'bg-secondary/10 text-secondary';
            case 'on_hold':
                return 'bg-text-secondary/10 text-text-secondary';
            default:
                return 'bg-info/10 text-info';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'selected':
            case 'completed':
                return <CheckCircle className="h-3 w-3" />;
            case 'rejected':
            case 'failed':
                return <XCircle className="h-3 w-3" />;
            default:
                return <Clock className="h-3 w-3" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Resumes</h1>
                    <p className="text-text-secondary">AI-powered resume screening</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <FileUpload
                        onUpload={handleUpload}
                        accept=".pdf,.doc,.docx"
                        multiple={true}
                        maxSize={10}
                    />
                </div>

                {/* Recent Analysis List */}
                <div className="col-span-1 lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary">Recent Analysis</h3>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-text-secondary">Loading candidates...</p>
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
                    {!isLoading && !error && candidates.length === 0 && (
                        <div className="glass p-12 rounded-xl border border-white/5 text-center">
                            <Upload className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-text-primary mb-2">No resumes yet</h3>
                            <p className="text-text-secondary">Upload resumes to get started with AI-powered screening</p>
                        </div>
                    )}

                    {/* Candidates List */}
                    {!isLoading && !error && candidates.length > 0 && (
                        <>
                            {candidates.map((candidate) => {
                                const candidateId = (candidate as any)._id || candidate.id;
                                const candidateName = candidate.name || `${(candidate as any).firstName || ''} ${(candidate as any).lastName || ''}`.trim() || 'Unknown';
                                const appliedDate = candidate.appliedAt || (candidate as any).createdAt;
                                return (
                                    <div
                                        key={candidateId}
                                        className="glass p-4 rounded-lg flex items-center justify-between hover:bg-card-hover transition-colors cursor-pointer"
                                        onClick={() => navigate(`/resumes/${candidateId}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">{candidateName}</p>
                                                <p className="text-xs text-text-secondary">
                                                    {candidate.email} • {appliedDate ? formatDate(appliedDate) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {(candidate.aiScore !== undefined || candidate.resumeScore !== undefined) && (
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-text-primary">{candidate.aiScore || candidate.resumeScore}/100</div>
                                                    <div className="text-xs text-text-secondary">AI Score</div>
                                                </div>
                                            )}
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(candidate.applicationStatus)}`}>
                                                {getStatusIcon(candidate.applicationStatus)}
                                                {candidate.applicationStatus}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

