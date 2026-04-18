import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext, RequestWithContext } from '../types/request-context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.auth;
  }
);
