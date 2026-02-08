import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { jobsService } from '@/api/jobs.service';
import { useNotificationStore } from '@/store/useNotificationStore';

const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
];

const experienceLevelOptions = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead / Principal' },
];

const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' },
];

export default function CreateJobPage() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get job ID from URL for edit mode
    const { addToast } = useNotificationStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: '',
        employmentType: 'full-time',
        description: '',
        experienceLevel: 'mid',
    });

    const [salaryRange, setSalaryRange] = useState({
        min: '',
        max: '',
        currency: 'USD',
    });

    const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    const isEditMode = !!id;

    // Load existing job data when in edit mode
    useEffect(() => {
        if (isEditMode) {
            loadJobData();
        }
    }, [id]);

    const loadJobData = async () => {
        try {
            setIsLoading(true);
            const job = await jobsService.getJobById(id!);

            setFormData({
                title: job.title,
                department: job.department,
                location: job.location,
                employmentType: job.employmentType,
                description: job.description,
                experienceLevel: job.experienceLevel,
            });

            setSalaryRange({
                min: job.salaryRange?.min?.toString() || '',
                max: job.salaryRange?.max?.toString() || '',
                currency: job.salaryRange?.currency || 'USD',
            });

            setRequiredSkills(job.requiredSkills || []);
        } catch (error: any) {
            console.error('Failed to load job:', error);
            addToast({
                type: 'error',
                title: 'Failed to Load Job',
                message: error.response?.data?.message || 'Could not load job data',
            });
            navigate('/jobs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate salary range
            const minSalary = parseFloat(salaryRange.min);
            const maxSalary = parseFloat(salaryRange.max);

            if (isNaN(minSalary) || isNaN(maxSalary)) {
                addToast({
                    type: 'error',
                    title: 'Invalid Salary',
                    message: 'Please enter valid salary amounts',
                });
                setIsSubmitting(false);
                return;
            }

            if (minSalary >= maxSalary) {
                addToast({
                    type: 'error',
                    title: 'Invalid Salary Range',
                    message: 'Maximum salary must be greater than minimum salary',
                });
                setIsSubmitting(false);
                return;
            }

            // Prepare job data matching backend DTO exactly
            const jobData = {
                title: formData.title,
                description: formData.description,
                department: formData.department,
                location: formData.location,
                employmentType: formData.employmentType,
                requiredSkills: requiredSkills,
                experienceLevel: formData.experienceLevel,
                salaryRange: {
                    min: minSalary,
                    max: maxSalary,
                    currency: salaryRange.currency,
                },
            };

            console.log(isEditMode ? 'Updating job with data:' : 'Creating job with data:', jobData);

            // Call API to create or update job
            let result;
            if (isEditMode) {
                result = await jobsService.updateJob(id!, jobData);
            } else {
                result = await jobsService.createJob(jobData);
            }

            console.log('Job saved successfully:', result);

            addToast({
                type: 'success',
                title: isEditMode ? 'Job Updated' : 'Job Created',
                message: `${formData.title} has been ${isEditMode ? 'updated' : 'posted'} successfully`,
            });

            navigate('/jobs');
        } catch (error: any) {
            console.error('Error creating job:', error);
            addToast({
                type: 'error',
                title: isEditMode ? 'Failed to Update Job' : 'Failed to Create Job',
                message: error.response?.data?.message || error.message || `An error occurred while ${isEditMode ? 'updating' : 'creating'} the job`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
            setRequiredSkills([...requiredSkills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    };

    return (
        <div className="min-h-screen pb-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">
                            {isEditMode ? 'Edit Job' : 'Create New Job'}
                        </h1>
                        <p className="text-text-secondary mt-1">
                            {isEditMode ? 'Update job details and requirements' : 'Post a new position to attract top candidates'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Job Title"
                                    placeholder="e.g. Senior Full Stack Developer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Department"
                                    placeholder="e.g. Engineering"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Location"
                                    placeholder="e.g. Remote, San Francisco, CA"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Employment Type"
                                    value={formData.employmentType}
                                    onChange={(value) => setFormData({ ...formData, employmentType: value })}
                                    options={jobTypeOptions}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input
                                    label="Minimum Salary"
                                    type="number"
                                    placeholder="100000"
                                    value={salaryRange.min}
                                    onChange={(e) => setSalaryRange({ ...salaryRange, min: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Maximum Salary"
                                    type="number"
                                    placeholder="150000"
                                    value={salaryRange.max}
                                    onChange={(e) => setSalaryRange({ ...salaryRange, max: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Currency"
                                    value={salaryRange.currency}
                                    onChange={(value) => setSalaryRange({ ...salaryRange, currency: value })}
                                    options={currencyOptions}
                                />
                            </div>

                            <Select
                                label="Experience Level"
                                value={formData.experienceLevel}
                                onChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                                options={experienceLevelOptions}
                            />
                        </CardContent>
                    </Card>

                    {/* Job Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-background/50 border border-white/10 text-text-primary placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                placeholder="Describe the role, responsibilities, and what makes this position exciting...&#10;&#10;Example:&#10;We are seeking an experienced Full Stack Developer to join our growing team. You will work on cutting-edge technologies and help build scalable applications that impact millions of users."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </CardContent>
                    </Card>

                    {/* Required Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Required Skills</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Add a skill (e.g. React, TypeScript, Node.js)"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill();
                                            }
                                        }}
                                    />
                                </div>
                                <Button type="button" onClick={addSkill} className="flex-shrink-0">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            {requiredSkills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {requiredSkills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="gap-2 px-3 py-1.5">
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="ml-1 hover:text-error transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/jobs')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            Publish Job
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
