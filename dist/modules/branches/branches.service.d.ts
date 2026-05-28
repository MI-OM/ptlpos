import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
export declare class BranchesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        _count: {
            sales: number;
            inventories: number;
            purchaseOrders: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateBranchDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateBranchDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(context: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
}
