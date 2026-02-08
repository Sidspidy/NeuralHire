import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards, ForbiddenException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    @Post()
    @Roles('RECRUITER', 'ADMIN')
    async create(
        @Body() createJobDto: CreateJobDto,
        @CurrentUser() user: any
    ) {
        try {
            // Attach recruiter ID to job
            const jobData = {
                ...createJobDto,
                recruiterId: user.id,
                postedBy: user.email
            };
            return await this.jobsService.create(jobData);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create job',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('department') department?: string,
        @Query('location') location?: string,
        @CurrentUser() user?: any
    ) {
        try {
            const filters: any = { status, department, location };

            // Recruiters only see their own jobs
            if (user?.role === 'RECRUITER') {
                filters.recruiterId = user.id;
            }

            return await this.jobsService.findAll(filters);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch jobs',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const job = await this.jobsService.findOne(id);

            // Recruiters can only view their own jobs (unless ADMIN or CANDIDATE)
            if (user.role === 'RECRUITER' && job.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to view this job');
            }

            return job;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch job',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    @Roles('RECRUITER', 'ADMIN')
    async update(
        @Param('id') id: string,
        @Body() updateJobDto: UpdateJobDto,
        @CurrentUser() user: any
    ) {
        try {
            const job = await this.jobsService.findOne(id);

            // Recruiters can only update their own jobs
            if (user.role === 'RECRUITER' && job.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to update this job');
            }

            return await this.jobsService.update(id, updateJobDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update job',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':id')
    @Roles('RECRUITER', 'ADMIN')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const job = await this.jobsService.findOne(id);

            // Recruiters can only delete their own jobs
            if (user.role === 'RECRUITER' && job.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to delete this job');
            }

            return await this.jobsService.remove(id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to delete job',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
