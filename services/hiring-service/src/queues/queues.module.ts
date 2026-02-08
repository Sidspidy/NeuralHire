import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeProcessor } from './resume.processor';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Candidate.name, schema: CandidateSchema },
            { name: Job.name, schema: JobSchema },
        ]),
        // BullModule.registerQueue({
        //     name: 'resume-processing',
        // }),
    ],
    providers: [ResumeProcessor],
    exports: [ResumeProcessor], // Export for direct use
})
export class QueuesModule { }

