import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { interviewsService } from '@/api/interviews.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useNavigate } from 'react-router-dom';

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string | null;
    jobId: string;
    candidateName?: string;
}

export function ScheduleInterviewModal({ isOpen, onClose, candidateId, jobId, candidateName }: ScheduleInterviewModalProps) {
    const navigate = useNavigate();
    const { addToast } = useNotificationStore();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        type: 'AI_VOICE',
        scheduledAt: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!candidateId) return;

        try {
            setIsLoading(true);

            const interview = await interviewsService.createInterview({
                candidateId,
                jobId,
                type: formData.type,
                scheduledAt: formData.scheduledAt || undefined,
            });

            addToast({
                type: 'success',
                title: 'Interview Scheduled',
                message: 'Interview has been scheduled successfully',
            });

            onClose();
            // Optional: Navigate to interview details or refresh parent
            navigate(`/interviews/${interview._id || interview.id}`);

        } catch (error: any) {
            console.error('Failed to schedule interview:', error);
            addToast({
                type: 'error',
                title: 'Scheduling Failed',
                message: error.response?.data?.message || 'Could not schedule interview',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Schedule Interview for ${candidateName || 'Candidate'}`}
            description="Configure the interview details below."
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Interview Type"
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                    options={[
                        { value: 'AI_VOICE', label: 'AI Voice Interview' },
                        { value: 'LIVE', label: 'Live Video Interview' },
                        { value: 'SCHEDULED', label: 'Scheduled Callback' },
                    ]}
                />

                <Input
                    label="Date & Time (Optional for AI Voice, Required for Live)"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required={formData.type !== 'AI_VOICE'}
                />

                <ModalFooter>
                    <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Schedule Interview
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
