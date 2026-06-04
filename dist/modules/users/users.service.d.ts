import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly audit;
    private readonly emailService;
    private readonly configService;
    constructor(prisma: PrismaService, audit: AuditService, emailService: EmailService, configService: ConfigService);
    findAll(tenantId: string): import(".prisma/client").Prisma.PrismaPromise<{
        tenant: {
            name: string;
        };
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        tenantId: string;
        id: string;
        name: string;
        email: string;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        tenant: {
            name: string;
        };
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        tenantId: string;
        id: string;
        name: string;
        email: string;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        tenantId: string;
        role: import(".prisma/client").$Enums.RoleName;
    }>;
    update(context: AuthContext, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        tenantId: string;
        role: import(".prisma/client").$Enums.RoleName;
    }>;
    delete(context: AuthContext, id: string): Promise<{
        message: string;
        id: string;
    }>;
}
