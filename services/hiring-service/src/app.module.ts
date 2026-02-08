import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { QueuesModule } from './queues/queues.module';
import { VoiceModule } from './voice/voice.module';
import { InterviewsModule } from './interviews/interviews.module';
import { ResumesModule } from './resumes/resumes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/hiring-service'),
    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //     password: process.env.REDIS_PASSWORD,
    //   },
    // }),
    JobsModule,
    CandidatesModule,
    InterviewsModule,
    ResumesModule,
    QueuesModule,
    VoiceModule,
  ],
})
export class AppModule { }
