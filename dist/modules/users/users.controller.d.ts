import { AuthContext } from '../../core/types/request-context';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(user: AuthContext): import(".prisma/client").Prisma.PrismaPromise<{
        tenantId: string;
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        name: string;
        id: string;
        tenant: {
            name: string;
        };
        email: string;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthContext, id: string): Promise<{
        tenantId: string;
        role: {
            name: import(".prisma/client").$Enums.RoleName;
        };
        name: string;
        id: string;
        tenant: {
            name: string;
        };
        email: string;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthContext, dto: CreateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        tenantId: string;
        role: import(".prisma/client").$Enums.RoleName;
    }>;
    update(user: AuthContext, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        tenantId: string;
        role: import(".prisma/client").$Enums.RoleName;
    }>;
    delete(user: AuthContext, id: string): Promise<{
        message: string;
        id: string;
    }>;
}
