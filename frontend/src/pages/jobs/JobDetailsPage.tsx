import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Clock, Briefcase, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, SortableTableHead } from '@/components/ui/Table';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { formatDate } from '@/utils/formatters';
import { jobsService } from '@/api/jobs.service';
import { candidatesService } from '@/api/candidates.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { resumesService } from '@/api/resumes.service';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal';

export default function JobDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useNotificationStore();
    const { user } = useAuthStore();

    const [job, setJob] = useState<any>(null);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'score',
        direction: 'desc',
    });


    // Apply Modal State
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [applicationForm, setApplicationForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // Schedule Interview Modal State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    // Pre-fill form with user data
    useEffect(() => {
        if (user && showApplyModal) {
            const names = user.name ? user.name.split(' ') : ['', ''];
            setApplicationForm({
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                email: user.email || '',
                phone: '',
            });
        }
    }, [user, showApplyModal]);

    useEffect(() => {
        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            setIsLoading(true);
            const [jobData, candidatesData] = await Promise.all([
                jobsService.getJobById(id!),
                candidatesService.getCandidates({ jobId: id }),
            ]);
            setJob(jobData);
            setApplicants(candidatesData);
        } catch (error: any) {
            console.error('Failed to fetch job details:', error);
            addToast({
                type: 'error',
                title: 'Failed to Load Job',
                message: error.response?.data?.message || 'Could not load job details',
            });
            navigate('/jobs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedApplicants = [...applicants].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
    });

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await jobsService.deleteJob(id!);
            addToast({
                type: 'success',
                title: 'Job Deleted',
                message: 'Job has been successfully deleted',
            });
            navigate('/jobs');
        } catch (error: any) {
            console.error('Failed to delete job:', error);
            addToast({
                type: 'error',
                title: 'Failed to Delete Job',
                message: error.response?.data?.message || 'Could not delete job',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Handler for updating candidate status (Shortlist, Reject, Hold, etc.)
    const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
        try {
            await candidatesService.updateCandidate(candidateId, { applicationStatus: newStatus as any });
            addToast({
                type: 'success',
                title: 'Status Updated',
                message: `Candidate status updated to ${newStatus}`,
            });
            fetchJobDetails(); // Refresh the list
        } catch (error: any) {
            console.error('Failed to update status:', error);
            addToast({
                type: 'error',
                title: 'Failed to Update Status',
                message: error.response?.data?.message || 'Could not update candidate status',
            });
        }
    };

    // Handler for scheduling an interview
    // Handler for scheduling an interview
    const handleScheduleInterview = (candidateId: string) => {
        setSelectedCandidateId(candidateId);
        setShowScheduleModal(true);
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resumeFile) {
            addToast({ type: 'error', title: 'Resume Required', message: 'Please upload your resume to apply.' });
            return;
        }

        try {
            setIsApplying(true);

            // 1. Upload Resume
            const formData = new FormData();
            formData.append('file', resumeFile);

            // Note: resumesService.uploadResume calls the AI Engine which returns { job_id, status, ... }
            // The resume is processed asynchronously. We use the job_id as a reference.
            const uploadResponse: any = await resumesService.uploadResume(formData);

            // Use storage_url if available (from new backend logic), otherwise fallback to job_id
            const resumeStoragePath = uploadResponse.storage_url || uploadResponse.job_id || uploadResponse.id;

            // 2. Create Application
            await candidatesService.createCandidate({
                firstName: applicationForm.firstName,
                lastName: applicationForm.lastName,
                email: applicationForm.email,
                phone: applicationForm.phone,
                jobId: id!,
                resumeMetadata: {
                    fileName: resumeFile.name,
                    fileSize: resumeFile.size,
                    uploadedAt: new Date().toISOString(),
                    storageUrl: resumeStoragePath,
                }
            });

            addToast({
                type: 'success',
                title: 'Application Submitted',
                message: 'Your application has been received successfully!',
            });

            setShowApplyModal(false);
            setResumeFile(null);
            fetchJobDetails(); // Refresh list to see "Applied" status if applicable
        } catch (error: any) {
            console.error('Failed to apply:', error);
            addToast({
                type: 'error',
                title: 'Application Failed',
                message: error.response?.data?.message || 'Could not submit application',
            });
        } finally {
            setIsApplying(false);
        }
    };

    // Check if current user has already applied
    const hasApplied = user?.role === 'CANDIDATE' && applicants.some(app => app.email === user.email || app.userId === user.id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-error mb-2">Job not found</p>
                    <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
                </div>
            </div>
        );
    }

    // Only show edit/delete buttons for recruiters who own the job or admins
    const canEdit = user?.role === 'ADMIN' || (user?.role === 'RECRUITER' && job.recruiterId === user?.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/jobs')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
                        <p className="text-text-secondary">Posted {formatDate(job.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={job.status === 'active' ? 'success' : 'outline'}>
                        {job.status}
                    </Badge>

                </div>
                <div className="flex items-center gap-3">

                    {/* Candidate Apply Button */}
                    {user?.role === 'CANDIDATE' && !hasApplied && (
                        <Button onClick={() => setShowApplyModal(true)}>
                            Apply Now
                        </Button>
                    )}

                    {user?.role === 'CANDIDATE' && hasApplied && (
                        <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Applied
                        </Badge>
                    )}

                    {canEdit && (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/jobs/${id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-text-secondary whitespace-pre-wrap">{job.description}</p>
                        </CardContent>
                    </Card>

                    {applicants.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Applicants ({applicants.length})</CardTitle>
                                <CardDescription>Review and manage candidates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>
                                                Name
                                            </SortableTableHead>
                                            <TableHead>Email</TableHead>
                                            <SortableTableHead sortKey="analysisResult.matchScore" currentSort={sortConfig} onSort={handleSort}>
                                                AI Score
                                            </SortableTableHead>
                                            <TableHead>Status</TableHead>
                                            <SortableTableHead sortKey="createdAt" currentSort={sortConfig} onSort={handleSort}>
                                                Applied
                                            </SortableTableHead>
                                            {canEdit && <TableHead>Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedApplicants.map((applicant) => (
                                            <TableRow
                                                key={applicant._id || applicant.id}
                                                className="cursor-pointer"
                                            >
                                                <TableCell
                                                    className="font-medium"
                                                    onClick={() => navigate(`/resumes/${applicant._id || applicant.id}`)}
                                                >
                                                    {applicant.firstName} {applicant.lastName}
                                                </TableCell>
                                                <TableCell className="text-text-secondary">{applicant.email}</TableCell>
                                                <TableCell>
                                                    {applicant.analysisResult?.matchScore || applicant.resumeScore ? (
                                                        <>
                                                            <span className="font-bold text-primary">
                                                                {applicant.analysisResult?.matchScore || applicant.resumeScore}
                                                            </span>
                                                            <span className="text-text-secondary">/100</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-text-secondary">Pending</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            applicant.applicationStatus === 'selected'
                                                                ? 'success'
                                                                : applicant.applicationStatus === 'interviewed'
                                                                    ? 'warning'
                                                                    : applicant.applicationStatus === 'shortlisted'
                                                                        ? 'secondary'
                                                                        : applicant.applicationStatus === 'screened'
                                                                            ? 'outline'
                                                                            : applicant.applicationStatus === 'rejected'
                                                                                ? 'error'
                                                                                : 'outline'
                                                        }
                                                        size="sm"
                                                    >
                                                        {applicant.applicationStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-text-secondary">
                                                    {formatDate(applicant.createdAt)}
                                                </TableCell>
                                                {canEdit && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {/* Show Shortlist button for screened candidates */}
                                                            {applicant.applicationStatus === 'screened' && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateStatus(applicant._id || applicant.id, 'shortlisted');
                                                                        }}
                                                                    >
                                                                        Shortlist
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateStatus(applicant._id || applicant.id, 'on_hold');
                                                                        }}
                                                                    >
                                                                        Hold
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateStatus(applicant._id || applicant.id, 'rejected');
                                                                        }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {/* Show Schedule Interview button for shortlisted candidates */}
                                                            {applicant.applicationStatus === 'shortlisted' && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleScheduleInterview(applicant._id || applicant.id);
                                                                    }}
                                                                >
                                                                    Schedule Interview
                                                                </Button>
                                                            )}
                                                            {/* Show final decision buttons for interviewed candidates */}
                                                            {applicant.applicationStatus === 'interviewed' && (
                                                                <>
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateStatus(applicant._id || applicant.id, 'selected');
                                                                        }}
                                                                    >
                                                                        Select
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateStatus(applicant._id || applicant.id, 'rejected');
                                                                        }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Department</p>
                                    <p className="text-sm font-medium text-text-primary">{job.department}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-secondary/10">
                                    <MapPin className="h-4 w-4 text-secondary" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Location</p>
                                    <p className="text-sm font-medium text-text-primary">{job.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-warning/10">
                                    <Clock className="h-4 w-4 text-warning" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Type</p>
                                    <p className="text-sm font-medium text-text-primary">{job.employmentType}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-success/10">
                                    <DollarSign className="h-4 w-4 text-success" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">Salary</p>
                                    <p className="text-sm font-medium text-text-primary">
                                        {job.salaryRange?.currency} {job.salaryRange?.min?.toLocaleString()} - {job.salaryRange?.max?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Required Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="outline">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Job"
                description="Are you sure you want to delete this job? This action cannot be undone."
                size="sm"
            >
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
                        Delete
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Apply Modal */}
            <Modal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                title={`Apply for ${job.title}`}
                description="Please verify your details and upload your resume."
                size="md"
            >
                <form onSubmit={handleApply} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={applicationForm.firstName}
                            onChange={(e) => setApplicationForm({ ...applicationForm, firstName: e.target.value })}
                            required
                        />
                        <Input
                            label="Last Name"
                            value={applicationForm.lastName}
                            onChange={(e) => setApplicationForm({ ...applicationForm, lastName: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        value={applicationForm.email}
                        onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                        required
                    />

                    <Input
                        label="Phone (Optional)"
                        type="tel"
                        value={applicationForm.phone}
                        onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">Resume (PDF)</label>
                        <FileUpload
                            accept=".pdf"
                            maxSize={5} // 5MB
                            onUpload={async (files) => {
                                if (files.length > 0) {
                                    setResumeFile(files[0]);
                                    // Simulate immediate success so the UI shows the file is ready
                                    return Promise.resolve();
                                }
                            }}
                            className="w-full"
                        />
                        {resumeFile && (
                            <div className="flex items-center justify-between p-2 mt-2 bg-success/10 rounded-md border border-success/20">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="h-4 w-4 text-success flex-shrink-0" />
                                    <span className="text-sm text-text-primary truncate">{resumeFile.name}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-transparent"
                                    onClick={() => setResumeFile(null)}
                                >
                                    <X className="h-4 w-4 text-text-secondary hover:text-error" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <ModalFooter className="px-0 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)} disabled={isApplying}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isApplying} disabled={!resumeFile}>
                            Submit Application
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Schedule Interview Modal */}
            <ScheduleInterviewModal
                isOpen={showScheduleModal}
                onClose={() => {
                    setShowScheduleModal(false);
                    setSelectedCandidateId(null);
                }}
                candidateId={selectedCandidateId}
                jobId={id!}
                candidateName={
                    selectedCandidateId
                        ? (() => {
                            const candidate = applicants.find(app => (app._id || app.id) === selectedCandidateId);
                            return candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate';
                        })()
                        : undefined
                }
            />
        </div >
    );
}
