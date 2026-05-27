import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithContext } from '../types/request-context';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    // Skip admin routes — they use AdminJwtAuthGuard + AdminRolesGuard
    if (request.url && request.url.startsWith('/api/admin/')) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const role = request.auth?.role;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
