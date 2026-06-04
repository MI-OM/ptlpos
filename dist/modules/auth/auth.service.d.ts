import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly emailService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        refresh_token: string;
        tenant: {
            id: string;
            name: string;
        };
        user: {
            userId: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.RoleName;
            name: string;
            email: string;
            isEmailVerified: boolean;
            lastLoginAt: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            userId: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.RoleName;
            name: string;
            email: string;
            isEmailVerified: true;
            lastLoginAt: string;
        };
    }>;
    loginWithEmail(dto: LoginEmailDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            userId: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.RoleName;
            name: string;
            email: string;
        };
        tenant: {
            id: string;
            name: string;
        };
    }>;
    me(context: AuthContext): Promise<{
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        tenantId: string;
        id: string;
        name: string;
        email: string;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            userId: string;
            tenantId: string;
            role: import(".prisma/client").$Enums.RoleName;
            name: string;
            email: string;
        };
    }>;
    requestEmailVerification(emailOrTenantId: string, email?: string): Promise<{
        message: string;
        email: string;
        expiresAt?: undefined;
    } | {
        message: string;
        email: string;
        expiresAt: Date;
    }>;
    private generateVerificationToken;
    verifyEmail(token: string, tenantId?: string): Promise<{
        message: string;
        email: string;
        tenant: {
            id: string;
            name: string;
        };
    }>;
    private processEmailVerification;
    requestPasswordReset(tenantId: string, email: string): Promise<{
        message: string;
        email: string;
        expiresAt?: undefined;
    } | {
        message: string;
        email: string;
        expiresAt: Date;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    changePassword(context: AuthContext, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    private logSecurityEvent;
}
