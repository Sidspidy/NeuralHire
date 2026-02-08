import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * JWT Authentication Guard
 * Extracts user information from headers set by API Gateway
 * and attaches it to the request object
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // Extract user info from headers (set by API Gateway)
        const userId = request.headers['x-user-id'];
        const email = request.headers['x-user-email'];
        const role = request.headers['x-user-role'];

        // Debug: Log received headers
        console.log('[JwtAuthGuard] Headers:', { userId, email, role });

        // Validate that all required headers are present
        if (!userId || !email || !role) {
            console.error('[JwtAuthGuard] Missing headers:', { userId, email, role });
            throw new UnauthorizedException('Missing authentication headers');
        }

        // Attach user to request for use in controllers
        request.user = {
            id: userId,
            email: email,
            role: role
        };

        return true;
    }
}
