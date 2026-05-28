import { PrismaService } from '../../core/database/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: import(".prisma/client").$Enums.RoleName;
        createdAt: Date;
    }[]>;
}
