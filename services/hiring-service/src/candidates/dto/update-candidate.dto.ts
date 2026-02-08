import { PartialType } from '@nestjs/mapped-types';
import { CreateCandidateDto } from './create-candidate.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
    @IsString()
    @IsOptional()
    @IsEnum(['applied', 'screened', 'shortlisted', 'interviewed', 'selected', 'rejected', 'on_hold'])
    applicationStatus?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['pending', 'processing', 'completed', 'failed'])
    processingStatus?: string;
}
