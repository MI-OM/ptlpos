import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: import(".prisma/client").$Enums.RoleName;
        createdAt: Date;
    }[]>;
}
