import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { BullModule } from '@nestjs/bull';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate, CandidateSchema } from './schemas/candidate.schema';
import { JobsModule } from '../jobs/jobs.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }]),
        // BullModule.registerQueue({
        //     name: 'resume-processing',
        // }),
        JobsModule, // Import JobsModule to use JobsService
        QueuesModule, // Import QueuesModule to use ResumeProcessor
    ],
    controllers: [CandidatesController],
    providers: [CandidatesService],
    exports: [CandidatesService],
})
export class CandidatesModule { }
