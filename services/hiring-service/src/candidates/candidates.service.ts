import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
// import { Queue } from 'bull';
import { ResumeProcessor } from '../queues/resume.processor';
import { Candidate, CandidateDocument } from './schemas/candidate.schema';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
    constructor(
        @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
        private resumeProcessor: ResumeProcessor,
    ) { }

    async create(createCandidateDto: CreateCandidateDto): Promise<Candidate> {
        // Validate jobId - ensure it's a string, not an object
        // Robustly sanitize jobId to ensure we never save an object
        let jobId = createCandidateDto.jobId;
        if (jobId && typeof jobId === 'object') {
            // If it has an _id property (like a populated doc), use it
            if ((jobId as any)._id) {
                jobId = (jobId as any)._id.toString();
            } else {
                // If it's just a string wrapper or unknown object, try to stringify or warn
                console.warn('Received weird object for jobId:', jobId);
                // Dangerous fallback: if the object casts to string as the ID
                jobId = String(jobId);
            }
        }

        const createdCandidate = new this.candidateModel({
            ...createCandidateDto,
            jobId: jobId, // Use sanitized ID
            processingStatus: 'pending',
            applicationStatus: 'applied',
        });

        try {
            const savedCandidate = await createdCandidate.save();

            // Trigger resume analysis directly (async/fire-and-forget)
            this.resumeProcessor.processResume({
                candidateId: savedCandidate._id.toString(),
                resumeUrl: createCandidateDto.resumeMetadata.storageUrl,
                jobId: jobId, // Use sanitized ID
            }).catch(err => console.error('Resume processing failed:', err));

            return savedCandidate;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('You have already applied for this job.');
            }
            throw error;
        }
    }

    async findAll(filters: {
        jobId?: string | { $in: string[] };
        processingStatus?: string;
        applicationStatus?: string;
        userId?: string;
    }): Promise<Candidate[]> {
        const query: any = {};

        if (filters.jobId) {
            query.jobId = filters.jobId;
        }
        if (filters.processingStatus) {
            query.processingStatus = filters.processingStatus;
        }
        if (filters.applicationStatus) {
            query.applicationStatus = filters.applicationStatus;
        }
        if (filters.userId) {
            query.userId = filters.userId;
        }

        try {
            return await this.candidateModel.find(query).populate('jobId').exec();
        } catch (error) {
            console.warn(`Population failed in findAll. Fetching without populate. Error: ${error.message}`);
            return await this.candidateModel.find(query).exec();
        }
    }

    async findOne(id: string): Promise<Candidate> {
        try {
            const candidate = await this.candidateModel.findById(id).populate('jobId').exec();
            if (!candidate) {
                throw new NotFoundException(`Candidate with ID ${id} not found`);
            }
            return candidate;
        } catch (error) {
            // If population fails (e.g., CastError due to bad data), log and fetch without populate
            // This ensures we always return the candidate data even if the job link is corrupted
            console.warn(`Population failed for candidate ${id}, fetching raw document. Error: ${error.message}`);

            const candidate = await this.candidateModel.findById(id).exec();
            if (!candidate) {
                throw new NotFoundException(`Candidate with ID ${id} not found`);
            }
            return candidate;
        }
    }

    async update(id: string, updateCandidateDto: UpdateCandidateDto): Promise<Candidate> {
        // Validate and sanitize jobId if present
        let jobId = updateCandidateDto.jobId;
        if (jobId && typeof jobId === 'object') {
            if ((jobId as any)._id) {
                jobId = (jobId as any)._id.toString();
            } else {
                console.warn('Received weird object for jobId in update:', jobId);
                jobId = String(jobId);
            }
            // Update the DTO with the sanitized string
            updateCandidateDto.jobId = jobId;
        }

        const updatedCandidate = await this.candidateModel
            .findByIdAndUpdate(id, updateCandidateDto, { new: true })
            .populate('jobId')
            .exec();

        if (!updatedCandidate) {
            throw new NotFoundException(`Candidate with ID ${id} not found`);
        }

        return updatedCandidate;
    }

    async remove(id: string): Promise<{ message: string }> {
        const result = await this.candidateModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Candidate with ID ${id} not found`);
        }

        return { message: 'Candidate deleted successfully' };
    }

    async updateProcessingStatus(
        candidateId: string,
        status: string,
        analysisResult?: any,
        errorMessage?: string,
    ): Promise<Candidate> {
        const updateData: any = { processingStatus: status };

        if (analysisResult) {
            updateData.analysisResult = analysisResult;
        }

        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        return this.candidateModel
            .findByIdAndUpdate(candidateId, updateData, { new: true })
            .exec();
    }
}
