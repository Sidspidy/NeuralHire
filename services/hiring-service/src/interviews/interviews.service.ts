import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interview, InterviewDocument } from './schemas/interview.schema';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class InterviewsService {
    constructor(
        @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
        @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
        @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    ) { }

    async create(createInterviewDto: CreateInterviewDto, recruiterId: string): Promise<Interview> {
        // 1. Verify candidate exists and is shortlisted
        const candidate = await this.candidateModel.findById(createInterviewDto.candidateId);
        if (!candidate) {
            throw new NotFoundException('Candidate not found');
        }

        if (candidate.applicationStatus !== 'shortlisted') {
            throw new BadRequestException('Candidate must be shortlisted before interview can be scheduled');
        }

        // 2. Verify job exists and belongs to recruiter
        const job = await this.jobModel.findById(createInterviewDto.jobId);
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        if (job.recruiterId !== recruiterId) {
            throw new ForbiddenException('You do not have permission to schedule interviews for this job');
        }

        // 3. Check subscription status (call payment service)
        const hasSubscription = await this.checkSubscription(recruiterId);
        if (!hasSubscription) {
            throw new ForbiddenException('Active subscription required to schedule interviews. Please upgrade your plan.');
        }

        // 4. Generate interview questions using AI (mock for now - can be enhanced)
        const questions = await this.generateInterviewQuestions(job);

        // 5. Create interview
        const interview = new this.interviewModel({
            ...createInterviewDto,
            recruiterId,
            status: 'SCHEDULED',
            type: createInterviewDto.type || 'AI_VOICE',
            questions,
            sessionToken: uuidv4(),
        });

        return interview.save();
    }

    async findAll(filters: {
        recruiterId?: string;
        candidateId?: string;
        jobId?: string;
        status?: string;
    }): Promise<Interview[]> {
        const query: any = {};

        if (filters.recruiterId) {
            query.recruiterId = filters.recruiterId;
        }
        if (filters.candidateId) {
            query.candidateId = filters.candidateId;
        }
        if (filters.jobId) {
            query.jobId = filters.jobId;
        }
        if (filters.status) {
            query.status = filters.status;
        }

        return this.interviewModel
            .find(query)
            .populate('candidateId')
            .populate('jobId')
            .exec();
    }

    async findAllByUserId(userId: string): Promise<Interview[]> {
        const candidate = await this.candidateModel.findOne({ userId });
        if (!candidate) return [];
        return this.interviewModel.find({ candidateId: candidate._id })
            .populate('candidateId')
            .populate('jobId')
            .exec();
    }

    async findOne(id: string): Promise<Interview> {
        const interview = await this.interviewModel
            .findById(id)
            .populate('candidateId')
            .populate('jobId')
            .exec();

        if (!interview) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }

        return interview;
    }

    async start(id: string, userId: string): Promise<Interview> {
        const interview = await this.findOne(id);

        // Verify the user is the candidate for this interview
        const candidate = await this.candidateModel.findById(interview.candidateId);
        if (!candidate) {
            throw new NotFoundException('Candidate not found');
        }

        // Allow start if user is the candidate OR the recruiter
        if (candidate.userId !== userId && interview.recruiterId !== userId) {
            throw new ForbiddenException('You do not have permission to start this interview');
        }

        if (interview.status !== 'SCHEDULED') {
            throw new BadRequestException('Interview is not in SCHEDULED status');
        }

        return this.interviewModel.findByIdAndUpdate(
            id,
            { status: 'IN_PROGRESS', startedAt: new Date() },
            { new: true }
        ).exec();
    }

    async complete(id: string, updateDto: UpdateInterviewDto): Promise<Interview> {
        const interview = await this.findOne(id);

        if (interview.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Interview is not in progress');
        }

        // Update interview with results
        const updated = await this.interviewModel.findByIdAndUpdate(
            id,
            {
                status: 'COMPLETED',
                completedAt: new Date(),
                answers: updateDto.answers || [],
                overallScore: updateDto.overallScore,
                feedback: updateDto.feedback,
            },
            { new: true }
        ).exec();

        // Update candidate status to 'interviewed'
        await this.candidateModel.findByIdAndUpdate(
            interview.candidateId,
            { applicationStatus: 'interviewed' }
        );

        return updated;
    }

    async update(id: string, updateInterviewDto: UpdateInterviewDto): Promise<Interview> {
        const interview = await this.interviewModel
            .findByIdAndUpdate(id, updateInterviewDto, { new: true })
            .populate('candidateId')
            .populate('jobId')
            .exec();

        if (!interview) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }

        return interview;
    }

    async remove(id: string): Promise<{ message: string }> {
        const result = await this.interviewModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Interview with ID ${id} not found`);
        }

        return { message: 'Interview deleted successfully' };
    }

    // Check if recruiter has active subscription
    private async checkSubscription(recruiterId: string): Promise<boolean> {
        try {
            // Call payment service to verify subscription
            const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8002';
            const response = await axios.get(`${paymentServiceUrl}/payments/subscription/status`, {
                headers: { 'X-User-Id': recruiterId },
                timeout: 5000,
            });
            return response.data?.active === true;
        } catch (error) {
            // For MVP, if payment service is unavailable, allow interviews (can be changed)
            console.warn('Payment service unavailable, allowing interview creation:', error.message);
            return true;
        }
    }

    // Generate interview questions based on job requirements
    private async generateInterviewQuestions(job: Job): Promise<Array<{ id: string; question: string; category: string }>> {
        // In production, this would call OpenAI to generate relevant questions
        // For now, return template questions based on job skills
        const questions = [
            { id: uuidv4(), question: `Tell me about your experience with ${job.requiredSkills?.[0] || 'this field'}.`, category: 'experience' },
            { id: uuidv4(), question: 'Describe a challenging project you worked on and how you overcame obstacles.', category: 'problem_solving' },
            { id: uuidv4(), question: 'How do you stay updated with the latest technologies in your field?', category: 'learning' },
            { id: uuidv4(), question: 'Tell me about a time you had to work under a tight deadline.', category: 'time_management' },
            { id: uuidv4(), question: 'Where do you see yourself in 5 years?', category: 'career_goals' },
        ];

        return questions;
    }
}
