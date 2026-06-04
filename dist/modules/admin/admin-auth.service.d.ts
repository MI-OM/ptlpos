import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/database/prisma.service';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
export declare class AdminAuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    validateAdminUser(adminId: string): Promise<any>;
}
