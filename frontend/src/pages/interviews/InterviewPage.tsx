import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Square, CheckCircle, Calendar, Video, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { interviewsService } from '@/api/interviews.service';
import { formatDate } from '@/utils/formatters';

const mockQuestions = [
    'Tell me about yourself and your experience.',
    'What interests you about this position?',
    'Describe a challenging project you worked on.',
    'How do you handle tight deadlines?',
    'Where do you see yourself in 5 years?',
];

export default function InterviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [interview, setInterview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInterview();
        }
    }, [id]);

    const fetchInterview = async () => {
        try {
            setIsLoading(true);
            const data = await interviewsService.getInterview(id!);
            setInterview(data);

            // If completed, set state
            if (data.status === 'COMPLETED') {
                setIsComplete(true);
            }
        } catch (err: any) {
            console.error('Failed to fetch interview:', err);
            setError('Could not load interview details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRecording) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        // TODO: Start actual voice recording
        console.log('Started recording');
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        // TODO: Stop recording and process
        const mockTranscript = 'This is a simulated transcript of the answer...';
        setTranscript(mockTranscript);
        console.log('Stopped recording');
    };

    const handleNextQuestion = () => {
        setAnswers([...answers, transcript]);
        setTranscript('');
        setTimeElapsed(0);

        if (currentQuestion < mockQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setIsComplete(true);
            // Optionally call backend to complete interview
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="text-center py-12">
                <p className="text-error mb-4">{error || 'Interview not found'}</p>
                <Button onClick={() => navigate('/interviews')}>Go Back</Button>
            </div>
        );
    }

    // Unified Render for Interview Details
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="text-center py-12 bg-card rounded-lg border border-white/10">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
                    {interview.type === 'LIVE' ? (
                        <Video className="h-12 w-12 text-primary" />
                    ) : interview.type === 'SCHEDULED' ? (
                        <Calendar className="h-12 w-12 text-primary" />
                    ) : (
                        <Mic className="h-12 w-12 text-primary" />
                    )}
                </div>

                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    {interview.type === 'LIVE' ? 'Live Interview' :
                        interview.type === 'SCHEDULED' ? 'Scheduled Interview' : 'AI Voice Interview'}
                </h1>

                <p className="text-text-secondary max-w-md mx-auto mb-8">
                    {interview.type === 'AI_VOICE'
                        ? "You are about to start an AI-powered voice interview. Please ensure you are in a quiet environment."
                        : `This is a ${interview.type.toLowerCase().replace('_', ' ')} session with `}
                    {interview.type !== 'AI_VOICE' && (
                        <span className="font-semibold text-text-primary"> {interview.candidateId?.firstName} {interview.candidateId?.lastName}</span>
                    )}
                </p>

                <div className="inline-block text-left bg-background/50 p-6 rounded-lg mb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-text-secondary" />
                            <div>
                                <p className="text-xs text-text-secondary">Scheduled Date</p>
                                <p className="font-medium text-text-primary">
                                    {interview.scheduledAt ? formatDate(interview.scheduledAt) : 'Ready to Start'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-text-secondary" />
                            <div>
                                <p className="text-xs text-text-secondary">Status</p>
                                <Badge variant={interview.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                    {interview.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    {interview.type === 'LIVE' && (
                        <Button size="lg" onClick={() => window.open(`https://meet.google.com/new`, '_blank')}>
                            Join Video Call
                        </Button>
                    )}

                    {interview.type === 'AI_VOICE' && interview.status !== 'COMPLETED' && (
                        <Button size="lg" onClick={() => navigate(`/interviews/${id}/session`)}>
                            Start Interview Session
                        </Button>
                    )}

                </div>
            </div>
        </div>
    );
}
