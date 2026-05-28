import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthContext } from '../../core/types/request-context';
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
    branchId?: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): AuthContext;
}
export {};
