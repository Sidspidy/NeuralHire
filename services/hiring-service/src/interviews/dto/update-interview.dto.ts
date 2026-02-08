import { IsString, IsOptional, IsNumber, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
    @IsString()
    questionId: string;

    @IsString()
    answer: string;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsString()
    feedback?: string;
}

export class UpdateInterviewDto {
    @IsOptional()
    @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    status?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers?: AnswerDto[];

    @IsOptional()
    @IsNumber()
    overallScore?: number;

    @IsOptional()
    @IsString()
    feedback?: string;
}
