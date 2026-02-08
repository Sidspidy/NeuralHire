import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    phone: string;

    @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
    jobId: Types.ObjectId;

    @Prop()
    userId: string; // User ID from auth service (for candidates who applied)

    @Prop({ type: Object })
    resumeMetadata: {
        fileName: string;
        fileSize: number;
        uploadedAt: Date;
        storageUrl: string;
    };

    @Prop({ default: 'pending', enum: ['pending', 'processing', 'completed', 'failed'] })
    processingStatus: string;

    @Prop({ type: Object, default: null })
    analysisResult: {
        skills: string[];
        experience: number;
        education: string[];
        matchScore: number;
        summary: string;
    };

    @Prop({ type: Number, default: null })
    resumeScore: number;

    @Prop()
    errorMessage: string;

    @Prop({ default: 'applied', enum: ['applied', 'screened', 'shortlisted', 'interviewed', 'selected', 'rejected', 'on_hold'] })
    applicationStatus: string;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

// Compound index to ensure a candidate can only apply once per job
CandidateSchema.index({ email: 1, jobId: 1 }, { unique: true });
