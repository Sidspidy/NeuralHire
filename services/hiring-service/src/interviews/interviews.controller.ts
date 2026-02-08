import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards, ForbiddenException } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) { }

    @Post()
    @Roles('RECRUITER', 'ADMIN')
    async create(
        @Body() createInterviewDto: CreateInterviewDto,
        @CurrentUser() user: any
    ) {
        try {
            return await this.interviewsService.create(createInterviewDto, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    async findAll(
        @Query('candidateId') candidateId?: string,
        @Query('jobId') jobId?: string,
        @Query('status') status?: string,
        @CurrentUser() user?: any
    ) {
        try {
            const filters: any = { candidateId, jobId, status };

            // Recruiters see their own interviews
            if (user.role === 'RECRUITER') {
                filters.recruiterId = user.id;
            }

            // Candidates see interviews they're part of
            // Note: candidateId in Interview points to Candidate document, not userId
            // So for candidates, we need to filter differently in service

            return await this.interviewsService.findAll(filters);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch interviews',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const interview = await this.interviewsService.findOne(id);

            // Check permission
            if (user.role === 'RECRUITER' && interview.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to view this interview');
            }

            // Check permission for Candidate
            if (user.role === 'CANDIDATE') {
                // The interview.candidateId field is populated with the Candidate object
                // We need to check if that Candidate object belongs to the current user
                const candidateContext = interview.candidateId as any;
                if (candidateContext.userId !== user.id && candidateContext.email !== user.email) {
                    // Fallback to email check if userId not set (legacy data)
                    throw new ForbiddenException('You do not have permission to view this interview');
                }
            }

            return interview;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post(':id/start')
    async start(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            return await this.interviewsService.start(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to start interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post(':id/complete')
    @Roles('RECRUITER', 'ADMIN')
    async complete(
        @Param('id') id: string,
        @Body() updateInterviewDto: UpdateInterviewDto,
        @CurrentUser() user: any
    ) {
        try {
            const interview = await this.interviewsService.findOne(id);

            // Verify recruiter owns this interview
            if (user.role === 'RECRUITER' && interview.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to complete this interview');
            }

            return await this.interviewsService.complete(id, updateInterviewDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to complete interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    @Roles('RECRUITER', 'ADMIN')
    async update(
        @Param('id') id: string,
        @Body() updateInterviewDto: UpdateInterviewDto,
        @CurrentUser() user: any
    ) {
        try {
            const interview = await this.interviewsService.findOne(id);

            if (user.role === 'RECRUITER' && interview.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to update this interview');
            }

            return await this.interviewsService.update(id, updateInterviewDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':id')
    @Roles('RECRUITER', 'ADMIN')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        try {
            const interview = await this.interviewsService.findOne(id);

            if (user.role === 'RECRUITER' && interview.recruiterId !== user.id) {
                throw new ForbiddenException('You do not have permission to delete this interview');
            }

            return await this.interviewsService.remove(id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to delete interview',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
