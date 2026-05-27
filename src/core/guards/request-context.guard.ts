import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestWithContext } from '../types/request-context';

@Injectable()
export class RequestContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithContext>();

    // Skip authentication for admin routes - let AdminJwtAuthGuard handle them
    const requestPath = request.originalUrl?.split('?')[0] || request.url?.split('?')[0];
    if (requestPath && (requestPath.startsWith('/api/admin/') || requestPath.startsWith('/admin/'))) {
      return true;
    }

    // Check for JWT-based auth from Authorization header
    const authHeader = request.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret =
          this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        const payload = jwt.verify(token, secret) as any;

        const { sub, tenantId, role, type } = payload;
        const branchId = payload.branchId || request.header('x-branch-id');
        
        // Handle admin tokens — set the actual admin role (e.g. SUPER_ADMIN)
        if (type === 'admin') {
          request.auth = {
            tenantId: null,
            userId: sub,
            role: role || 'SUPER_ADMIN',
            branchId: null,
          };
          return true;
        }
        
        // Handle tenant tokens
        if (sub && tenantId && role && Object.values(RoleName).includes(role as RoleName)) {
          request.auth = {
            tenantId,
            userId: sub,
            role: role as RoleName,
            branchId,
          };
          return true;
        }
      } catch (error) {
        // Token verification failed, continue to check other auth methods
      }
    }

    // Check for JWT-based auth from Passport (attached to request.user by JwtAuthGuard)
    if (request.user) {
      const user = request.user as any;
      const { sub, tenantId, role, branchId } = user;
      if (sub && tenantId && role && Object.values(RoleName).includes(role as RoleName)) {
        request.auth = {
          tenantId,
          userId: sub,
          role: role as RoleName,
          branchId,
        };
        return true;
      }
    }

    // If endpoint is public, allow without authentication
    if (isPublic) {
      return true;
    }

    // Only throw if not public AND no auth provided
    throw new UnauthorizedException(
      'Missing authentication: provide JWT Bearer token'
    );
  }
}
