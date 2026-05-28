import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
export declare class SuppliersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string): Prisma.PrismaPromise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateSupplierDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateSupplierDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
    }>;
    private ensureNoDuplicateSupplier;
    private normalizeEmail;
}
