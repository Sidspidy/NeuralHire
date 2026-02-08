import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User Decorator
 * Extracts the current user from the request object
 * 
 * @example
 * @Get()
 * findAll(@CurrentUser() user: any) {
 *   console.log(user.id, user.email, user.role);
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
