import { IsString, IsNotEmpty, IsArray, IsOptional, IsDateString, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class SalaryRangeDto {
    @IsNumber()
    min: number;

    @IsNumber()
    max: number;

    @IsString()
    currency: string;
}

export class CreateJobDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    department: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['full-time', 'part-time', 'contract', 'internship'])
    employmentType: string;

    @IsArray()
    @IsString({ each: true })
    requiredSkills: string[];

    @IsString()
    @IsNotEmpty()
    @IsEnum(['entry', 'mid', 'senior', 'lead'])
    experienceLevel: string;

    @ValidateNested()
    @Type(() => SalaryRangeDto)
    salaryRange: SalaryRangeDto;

    @IsString()
    @IsOptional()
    postedBy?: string;

    @IsDateString()
    @IsOptional()
    closingDate?: string;
}
