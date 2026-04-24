import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      
      console.log('AdminJwtAuthGuard - Token payload:', payload);
      
      // Verify this is an admin token
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('Invalid token type for admin access');
      }

      // Attach admin user to request
      request.user = payload;
      console.log('AdminJwtAuthGuard - User set in request:', request.user);
      return true;
    } catch (error) {
      console.log('AdminJwtAuthGuard - Error:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
