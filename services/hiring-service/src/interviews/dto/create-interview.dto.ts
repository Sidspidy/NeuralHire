import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateInterviewDto {
    @IsString()
    candidateId: string;

    @IsString()
    jobId: string;

    @IsOptional()
    @IsEnum(['AI_VOICE', 'SCHEDULED', 'LIVE'])
    type?: string;

    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}
