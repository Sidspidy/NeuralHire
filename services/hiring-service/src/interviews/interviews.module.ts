import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Interview.name, schema: InterviewSchema },
            { name: Candidate.name, schema: CandidateSchema },
            { name: Job.name, schema: JobSchema },
        ]),
    ],
    controllers: [InterviewsController],
    providers: [InterviewsService],
    exports: [InterviewsService],
})
export class InterviewsModule { }
