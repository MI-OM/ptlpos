import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
export declare class AdminAuthController {
    private readonly adminAuthService;
    constructor(adminAuthService: AdminAuthService);
    register(registerDto: AdminRegisterDto): Promise<{
        adminUser: {
            role: import(".prisma/client").$Enums.AdminRole;
            id: string;
            email: string;
            createdAt: Date;
            isActive: boolean;
            firstName: string;
            lastName: string;
        };
        access_token: string;
        refresh_token: string;
    }>;
    login(loginDto: AdminLoginDto): Promise<{
        adminUser: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.AdminRole;
            isActive: true;
            lastLoginAt: Date;
            createdAt: Date;
        };
        access_token: string;
        refresh_token: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<any>;
}
