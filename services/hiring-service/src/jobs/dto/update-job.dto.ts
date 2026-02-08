import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateJobDto extends PartialType(CreateJobDto) {
    @IsString()
    @IsOptional()
    @IsEnum(['active', 'closed', 'on-hold'])
    status?: string;
}
