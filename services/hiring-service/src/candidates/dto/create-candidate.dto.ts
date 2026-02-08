import { IsString, IsNotEmpty, IsEmail, IsOptional, ValidateNested, IsNumber, IsDateString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class ResumeMetadataDto {
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsNumber()
    fileSize: number;

    @IsDateString()
    uploadedAt: string;

    @IsString()
    @IsNotEmpty()
    storageUrl: string;
}

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsMongoId()
    @IsNotEmpty()
    jobId: string;

    @ValidateNested()
    @Type(() => ResumeMetadataDto)
    resumeMetadata: ResumeMetadataDto;
}
