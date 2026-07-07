import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from './token.service';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * Use with @UseGuards(JwtAuthGuard) on the controller or method.
 *
 * @example
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: TokenPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: TokenPayload }>();
    return request.user;
  },
);
