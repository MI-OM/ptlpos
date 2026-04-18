import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthContext } from 'src/core/types/request-context';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  validate(payload: JwtPayload): AuthContext {
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role as any,
      branchId: payload.branchId,
    };
  }
}
