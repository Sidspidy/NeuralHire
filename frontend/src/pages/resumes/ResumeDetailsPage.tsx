import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Mail, Phone, Award, TrendingUp, Briefcase, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import { candidatesService } from '@/api/candidates.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { interviewsService } from '@/api/interviews.service';

interface CandidateDetails {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobId: string | { _id: string; title: string };
    resumeMetadata?: {
        originalName: string;
        storagePath: string;
        mimeType: string;
        size: number;
    };
    resumeScore?: number;
    applicationStatus: string;
    processingStatus: string;
    analysisResult?: {
        matchScore?: number;
        skills?: string[];
        experience?: number;
        education?: string;
        strengths?: string[];
        weaknesses?: string[];
        recommendations?: string[];
        keywords?: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export default function ResumeDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addToast } = useNotificationStore();
    const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchCandidate(id);
        }
    }, [id]);

    const fetchCandidate = async (candidateId: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await candidatesService.getCandidate(candidateId);
            setCandidate(data as unknown as CandidateDetails);
        } catch (err: any) {
            setError(err.message || 'Failed to load candidate details');
            console.error('Failed to fetch candidate:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScheduleInterview = async () => {
        try {
            if (!candidate) return;

            const jobId = typeof candidate.jobId === 'object' ? candidate.jobId._id : candidate.jobId;

            const interview = await interviewsService.createInterview({
                candidateId: candidate._id,
                jobId: jobId,
                type: 'AI_VOICE',
            });

            addToast({
                type: 'success',
                title: 'Interview Scheduled',
                message: 'AI Voice Interview has been scheduled successfully',
            });

            // Navigate to the interview page
            navigate(`/interviews/${interview._id || interview.id}`);
        } catch (error: any) {
            console.error('Failed to schedule interview:', error);
            addToast({
                type: 'error',
                title: 'Failed to Schedule Interview',
                message: error.message || 'Could not schedule interview',
            });
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-success';
        if (score >= 70) return 'text-warning';
        return 'text-error';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-success/10';
        if (score >= 70) return 'bg-warning/10';
        return 'bg-error/10';
    };

    const getStatusBadgeVariant = (status: string): "success" | "warning" | "destructive" | "secondary" | "outline" | "default" | null | undefined => {
        switch (status) {
            case 'selected': return 'success';
            case 'rejected': return 'destructive';
            case 'shortlisted': return 'warning';
            case 'interviewed': return 'warning';
            case 'screened': return 'secondary';
            default: return 'outline';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-text-secondary">Loading candidate details...</p>
                </div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/resumes')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-text-primary">Candidate Details</h1>
                </div>
                <Card className="border-error/20 bg-error/5">
                    <CardContent className="py-6 text-center">
                        <p className="text-error">{error || 'Candidate not found'}</p>
                        <Button variant="outline" onClick={() => navigate('/resumes')} className="mt-4">
                            Back to Candidates
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Unknown';
    const jobTitle = typeof candidate.jobId === 'object' ? candidate.jobId.title : 'N/A';
    const score = candidate.resumeScore || candidate.analysisResult?.matchScore || 0;
    const analysis = candidate.analysisResult || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/resumes')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{candidateName}</h1>
                        <p className="text-text-secondary flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Applied for {jobTitle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(candidate.applicationStatus)}>
                        {candidate.applicationStatus}
                    </Badge>
                    {candidate.resumeMetadata?.storagePath && (
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Resume
                        </Button>
                    )}
                    {candidate.applicationStatus === 'shortlisted' && (
                        <Button onClick={handleScheduleInterview}>
                            Schedule Interview
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Score */}
                    <Card variant="gradient" hover="glow">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <p className="text-sm text-text-secondary mb-1">AI Match Score</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                                        {score}
                                    </span>
                                    <span className="text-2xl text-text-secondary">/100</span>
                                </div>
                            </div>
                            <div className={`p-6 rounded-full ${getScoreBgColor(score)}`}>
                                <Award className={`h-12 w-12 ${getScoreColor(score)}`} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {analysis.strengths && analysis.strengths.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((strength, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                                                <span className="text-success mt-1">✓</span>
                                                <span>{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-warning mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 rotate-180" />
                                        Areas to Explore
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.weaknesses.map((weakness, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                                                <span className="text-warning mt-1">!</span>
                                                <span>{weakness}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-primary mb-3">Recommendations</h4>
                                    <ul className="space-y-2">
                                        {analysis.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                                                <span className="text-primary mt-1">→</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(!analysis.strengths || analysis.strengths.length === 0) &&
                                (!analysis.weaknesses || analysis.weaknesses.length === 0) &&
                                (!analysis.recommendations || analysis.recommendations.length === 0) && (
                                    <p className="text-text-secondary text-center py-4">
                                        {candidate.processingStatus === 'processing'
                                            ? 'AI analysis in progress...'
                                            : candidate.processingStatus === 'pending'
                                                ? 'AI analysis pending...'
                                                : 'No AI analysis available for this candidate.'}
                                    </p>
                                )}
                        </CardContent>
                    </Card>

                    {/* Keywords Match */}
                    {analysis.keywords && analysis.keywords.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Keyword Match</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.map((keyword) => (
                                        <Badge key={keyword} variant="success">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-text-secondary">Email</p>
                                    <p className="text-sm font-medium text-text-primary truncate">{candidate.email}</p>
                                </div>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-secondary/10">
                                        <Phone className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary">Phone</p>
                                        <p className="text-sm font-medium text-text-primary">{candidate.phone}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-warning/10">
                                    <Calendar className="h-4 w-4 text-warning" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Applied</p>
                                    <p className="text-sm font-medium text-text-primary">{formatDate(candidate.createdAt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {(analysis.experience || analysis.education) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Experience & Education</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.experience && (
                                    <div>
                                        <p className="text-xs text-text-secondary mb-1">Years of Experience</p>
                                        <p className="text-lg font-bold text-text-primary">{analysis.experience} years</p>
                                    </div>
                                )}
                                {analysis.education && (
                                    <div>
                                        <p className="text-xs text-text-secondary mb-1">Education</p>
                                        <p className="text-sm text-text-primary">{analysis.education}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {analysis.skills && analysis.skills.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.skills.map((skill) => (
                                        <Badge key={skill} variant="outline" size="sm">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Processing Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Processing Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={
                                candidate.processingStatus === 'completed' ? 'success' :
                                    candidate.processingStatus === 'failed' ? 'destructive' :
                                        'warning'
                            }>
                                {candidate.processingStatus}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
