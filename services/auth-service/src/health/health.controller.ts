import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async check() {
        try {
            // Check database connectivity
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'auth-service',
                database: 'connected',
                uptime: process.uptime(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                service: 'auth-service',
                database: 'disconnected',
                error: error.message,
            };
        }
    }
}
