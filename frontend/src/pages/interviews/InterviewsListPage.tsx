import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, User, Briefcase, Play, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { interviewsService, type Interview } from '@/api/interviews.service';
// import { useNotificationStore } from '@/store/useNotificationStore'; // Unused
import { formatDate } from '@/utils/formatters';



export default function InterviewsListPage() {
    const navigate = useNavigate();
    // const { addToast } = useNotificationStore(); // Unused
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await interviewsService.getInterviews();
            setInterviews(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load interviews');
            console.error('Failed to fetch interviews:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success" size="sm"><CheckCircle className="h-3 w-3 mr-1" />{status}</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="warning" size="sm"><Play className="h-3 w-3 mr-1" />{status}</Badge>;
            case 'CANCELLED':
                return <Badge variant="error" size="sm"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>;
            case 'SCHEDULED':
                return <Badge variant="outline" size="sm"><Calendar className="h-3 w-3 mr-1" />{status}</Badge>;
            default:
                return <Badge variant="outline" size="sm"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'AI_VOICE':
                return <Badge variant="secondary" size="sm">AI Voice</Badge>;
            case 'AI_VIDEO':
                return <Badge variant="secondary" size="sm">AI Video</Badge>;
            case 'LIVE':
                return <Badge variant="outline" size="sm">Live</Badge>;
            default:
                return <Badge variant="outline" size="sm">{type}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading interviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Interviews</h1>
                    <p className="text-text-secondary">Manage AI-powered candidate interviews</p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-error/20 bg-error/5">
                    <CardContent className="py-6">
                        <p className="text-error text-center">{error}</p>
                        <Button variant="outline" onClick={fetchInterviews} className="mx-auto mt-4 block">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!error && interviews.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Video className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No interviews yet</h3>
                        <p className="text-text-secondary">
                            Schedule interviews from the jobs page after shortlisting candidates.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/jobs')} className="mt-4">
                            View Jobs
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Interviews Table */}
            {!error && interviews.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Interviews ({interviews.length})</CardTitle>
                        <CardDescription>Click on an interview to view details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Job</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interviews.map((interview) => (
                                    <TableRow key={interview._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-text-secondary" />
                                                <div>
                                                    <p className="font-medium text-text-primary">
                                                        {interview.candidateId?.firstName} {interview.candidateId?.lastName}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        {interview.candidateId?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-text-secondary" />
                                                <span className="text-text-primary">{interview.jobId?.title || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(interview.type)}</TableCell>
                                        <TableCell>{getStatusBadge(interview.status)}</TableCell>
                                        <TableCell>
                                            {interview.overallScore !== undefined ? (
                                                <span className="font-bold text-primary">{interview.overallScore}/100</span>
                                            ) : (
                                                <span className="text-text-secondary">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-text-secondary">
                                            {formatDate(interview.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {interview.status === 'SCHEDULED' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => navigate(`/interviews/${interview._id}`)}
                                                    >
                                                        Start
                                                    </Button>
                                                )}
                                                {interview.status === 'COMPLETED' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/interviews/${interview._id}`)}
                                                    >
                                                        View Results
                                                    </Button>
                                                )}
                                                {interview.status === 'IN_PROGRESS' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => navigate(`/interviews/${interview._id}`)}
                                                    >
                                                        Continue
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
