import { AuthContext } from '../../core/types/request-context';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailVerificationDto, VerifyEmailDto, RequestPasswordResetDto, ResetPasswordDto } from './dto/email-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
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
    me(user: AuthContext): Promise<{
        tenantId: string;
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        name: string;
        id: string;
        email: string;
    }>;
    requestEmailVerification(dto: RequestEmailVerificationDto, user?: AuthContext): Promise<{
        message: string;
        email: string;
        expiresAt?: undefined;
    } | {
        message: string;
        email: string;
        expiresAt: Date;
    }>;
    verifyEmail(dto: VerifyEmailDto, user?: AuthContext): Promise<{
        message: string;
        email: string;
        tenant: {
            id: string;
            name: string;
        };
    }>;
    requestPasswordReset(dto: RequestPasswordResetDto): Promise<{
        message: string;
        email: string;
        expiresAt?: undefined;
    } | {
        message: string;
        email: string;
        expiresAt: Date;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
        };
    }>;
    changePassword(user: AuthContext, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
