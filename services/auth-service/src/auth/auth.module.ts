import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [AuthService, PrismaService],
})
export class AuthModule { }
