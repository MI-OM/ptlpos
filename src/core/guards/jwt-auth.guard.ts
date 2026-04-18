import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Try to extract and validate JWT token
    // If token is present and valid, request.user will be set
    // If token is not present, we allow it through and let RequestContextGuard handle auth
    try {
      const result = await super.canActivate(context);
      // Handle Observable or Promise result
      if (result instanceof Observable) {
        return await new Promise<boolean>((resolve, reject) => {
          result.subscribe(
            res => resolve(!!res),
            err => resolve(true) // On error, allow through
          );
        });
      }
      return !!result;
    } catch (error) {
      // Token validation failed or token not present
      // Return true to allow RequestContextGuard to check other auth methods
      return true;
    }
  }
}
