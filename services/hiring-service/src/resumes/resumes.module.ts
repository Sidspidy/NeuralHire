
import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [ResumesController],
})
export class ResumesModule { }
