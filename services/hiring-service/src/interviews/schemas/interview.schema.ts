import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewDocument = Interview & Document;

@Schema({ timestamps: true })
export class Interview {
    @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true })
    candidateId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
    jobId: Types.ObjectId;

    @Prop({ required: true })
    recruiterId: string;

    @Prop({ required: true, enum: ['AI_VOICE', 'SCHEDULED', 'LIVE'], default: 'AI_VOICE' })
    type: string;

    @Prop({ required: true, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' })
    status: string;

    @Prop({ type: [Object], default: [] })
    questions: Array<{
        id: string;
        question: string;
        category: string;
    }>;

    @Prop({ type: [Object], default: [] })
    answers: Array<{
        questionId: string;
        answer: string;
        score: number;
        feedback: string;
    }>;

    @Prop({ type: Number, default: null })
    overallScore: number;

    @Prop({ type: String, default: null })
    feedback: string;

    @Prop({ type: String, default: null })
    sessionToken: string;

    @Prop({ type: Date, default: null })
    scheduledAt: Date;

    @Prop({ type: Date, default: null })
    startedAt: Date;

    @Prop({ type: Date, default: null })
    completedAt: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);
