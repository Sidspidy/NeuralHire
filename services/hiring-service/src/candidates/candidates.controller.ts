import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards, ForbiddenException } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JobsService } from '../jobs/jobs.service';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
    constructor(
        private readonly candidatesService: CandidatesService,
        private readonly jobsService: JobsService
    ) { }

    @Post()
    @Roles('CANDIDATE', 'RECRUITER', 'ADMIN')
    async create(
        @Body() createCandidateDto: CreateCandidateDto,
        @CurrentUser() user: any
    ) {
        try {
            const candidateData: any = { ...createCandidateDto };

            // If candidate is applying, attach their user ID
            if (user.role === 'CANDIDATE') {
                candidateData.userId = user.id;
            }

            return await this.candidatesService.create(candidateData);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create candidate',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    async findAll(
        @Query('jobId') jobId?: string,
        @Query('processingStatus') processingStatus?: string,
        @Query('applicationStatus') applicationStatus?: string,
        @CurrentUser() user?: any
    ) {
        try {
            const filters: any = { jobId, processingStatus, applicationStatus };

            // Candidates only see their own applications
            if (user.role === 'CANDIDATE') {
                filters.userId = user.id;
            }

            // Recruiters only see candidates for their jobs
            if (user.role === 'RECRUITER') {
                const recruiterJobs = await this.jobsService.findAll({ recruiterId: user.id });
                const jobIds = recruiterJobs.map(j => (j as any)._id?.toString()).filter(Boolean);

                if (jobIds.length === 0) {
                    return []; // Recruiter has no jobs, so no candidates
                }

                // If jobId filter is provided, verify it belongs to this recruiter
                if (filters.jobId && !jobIds.includes(filters.jobId)) {
                    throw new ForbiddenException('You do not have permission to view candidates for this job');
                }

                // If no jobId filter, return candidates for all recruiter's jobs
                if (!filters.jobId) {
                    filters.jobId = { $in: jobIds };
                }
            }

            return await this.candidatesService.findAll(filters);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch candidates',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const candidate = await this.candidatesService.findOne(id);

            // Candidates can only view their own applications
            if (user.role === 'CANDIDATE' && candidate.userId !== user.id) {
                throw new ForbiddenException('You do not have permission to view this candidate');
            }

            // Recruiters can only view candidates for their jobs
            if (user.role === 'RECRUITER') {
                let recruiterId;
                const jobRef: any = candidate.jobId;

                if (!jobRef) {
                    throw new ForbiddenException('Candidate has no associated job');
                }

                if (typeof jobRef === 'object' && jobRef.recruiterId) {
                    recruiterId = jobRef.recruiterId;
                } else {
                    const jobId = jobRef._id ? jobRef._id.toString() : jobRef.toString();
                    const job = await this.jobsService.findOne(jobId);
                    recruiterId = job.recruiterId;
                }

                if (recruiterId !== user.id) {
                    throw new ForbiddenException('You do not have permission to view this candidate');
                }
            }

            return candidate;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch candidate',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    @Roles('RECRUITER', 'ADMIN')
    async update(
        @Param('id') id: string,
        @Body() updateCandidateDto: UpdateCandidateDto,
        @CurrentUser() user: any
    ) {
        try {
            const candidate = await this.candidatesService.findOne(id);

            // Recruiters can only update candidates for their jobs
            if (user.role === 'RECRUITER') {
                let recruiterId;
                const jobRef: any = candidate.jobId;

                if (!jobRef) {
                    throw new ForbiddenException('Candidate has no associated job');
                }

                if (typeof jobRef === 'object' && jobRef.recruiterId) {
                    recruiterId = jobRef.recruiterId;
                } else {
                    const jobId = jobRef._id ? jobRef._id.toString() : jobRef.toString();
                    const job = await this.jobsService.findOne(jobId);
                    recruiterId = job.recruiterId;
                }

                if (recruiterId !== user.id) {
                    throw new ForbiddenException('You do not have permission to update this candidate');
                }
            }

            return await this.candidatesService.update(id, updateCandidateDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update candidate',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':id')
    @Roles('RECRUITER', 'ADMIN')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const candidate = await this.candidatesService.findOne(id);

            // Recruiters can only delete candidates for their jobs
            if (user.role === 'RECRUITER') {
                let recruiterId;
                const jobRef: any = candidate.jobId;

                if (!jobRef) {
                    throw new ForbiddenException('Candidate has no associated job');
                }

                if (typeof jobRef === 'object' && jobRef.recruiterId) {
                    recruiterId = jobRef.recruiterId;
                } else {
                    const jobId = jobRef._id ? jobRef._id.toString() : jobRef.toString();
                    const job = await this.jobsService.findOne(jobId);
                    recruiterId = job.recruiterId;
                }

                if (recruiterId !== user.id) {
                    throw new ForbiddenException('You do not have permission to delete this candidate');
                }
            }

            return await this.candidatesService.remove(id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to delete candidate',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
