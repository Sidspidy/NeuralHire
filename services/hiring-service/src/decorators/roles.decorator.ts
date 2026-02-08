import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * Specifies which roles are allowed to access a route
 * 
 * @example
 * @Roles('ADMIN', 'RECRUITER')
 * @Get()
 * findAll() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
