import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    department: string;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true })
    employmentType: string;

    @Prop({ type: [String], default: [] })
    requiredSkills: string[];

    @Prop({ required: true })
    experienceLevel: string;

    @Prop({ type: Object })
    salaryRange: {
        min: number;
        max: number;
        currency: string;
    };

    @Prop({ default: 'active' })
    status: string;

    @Prop()
    postedBy: string;

    @Prop({ required: true })
    recruiterId: string;

    @Prop()
    closingDate: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
