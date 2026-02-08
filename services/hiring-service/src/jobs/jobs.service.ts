import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
    constructor(
        @InjectModel(Job.name) private jobModel: Model<JobDocument>,
        @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    ) { }

    async create(createJobDto: CreateJobDto): Promise<Job> {
        const createdJob = new this.jobModel(createJobDto);
        return createdJob.save();
    }

    async findAll(filters: { status?: string; department?: string; location?: string; recruiterId?: string }): Promise<any[]> {
        const query: any = {};

        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.department) {
            query.department = filters.department;
        }
        if (filters.location) {
            query.location = filters.location;
        }
        if (filters.recruiterId) {
            query.recruiterId = filters.recruiterId;
        }

        const jobs = await this.jobModel.find(query).lean().exec();

        // Get applicant counts for all jobs in one query
        const jobIds = jobs.map(job => job._id.toString());
        const applicantCounts = await this.candidateModel.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$jobId', count: { $sum: 1 } } }
        ]);

        // Create a map for quick lookup
        const countMap = new Map(
            applicantCounts.map(item => [item._id.toString(), item.count])
        );

        // Add applicantsCount to each job
        return jobs.map(job => ({
            ...job,
            applicants: countMap.get(job._id.toString()) || 0
        }));
    }

    async findOne(id: string): Promise<Job> {
        const job = await this.jobModel.findById(id).exec();
        if (!job) {
            throw new NotFoundException(`Job with ID ${id} not found`);
        }
        return job;
    }

    async update(id: string, updateJobDto: UpdateJobDto): Promise<Job> {
        const updatedJob = await this.jobModel
            .findByIdAndUpdate(id, updateJobDto, { new: true })
            .exec();

        if (!updatedJob) {
            throw new NotFoundException(`Job with ID ${id} not found`);
        }

        return updatedJob;
    }

    async remove(id: string): Promise<{ message: string }> {
        const result = await this.jobModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException(`Job with ID ${id} not found`);
        }

        return { message: 'Job deleted successfully' };
    }
}

