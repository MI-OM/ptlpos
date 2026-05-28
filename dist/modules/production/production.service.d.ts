import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { RunProductionDto } from './dto/run-production.dto';
export declare class ProductionService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    run(context: AuthContext, dto: RunProductionDto): Promise<{
        id: string;
        tenantId: string;
        productId: string;
        quantityProduced: Prisma.Decimal;
        createdAt: Date;
    }>;
    getOrders(context: AuthContext): Promise<{
        id: string;
        product: string;
        quantity: Prisma.Decimal;
        status: string;
        progress: number;
        startDate: Date;
        expectedDate: Date;
    }[]>;
    getRecipes(context: AuthContext): Promise<{
        id: string;
        productId: string;
        productName: string;
        productSku: string;
        productPrice: number;
        materialCost: number;
        margin: number;
        marginPercent: number;
        materials: {
            materialId: string;
            materialName: string;
            quantity: Prisma.Decimal;
            unitCost: number | Prisma.Decimal;
            totalCost: number;
        }[];
    }[]>;
    getMaterials(context: AuthContext): Promise<{
        id: string;
        name: string;
        stock: Prisma.Decimal;
        unit: string;
        reorderLevel: number;
    }[]>;
    getMachines(context: AuthContext): Promise<{
        id: string;
        name: string;
        status: string;
        uptime: number;
        lastMaintenance: Date;
    }[]>;
}
