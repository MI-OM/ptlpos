import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
export declare class PurchaseOrdersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string, branchId?: string): Prisma.PrismaPromise<({
        items: ({
            product: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: Prisma.Decimal;
            cost: Prisma.Decimal;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        supplierId: string;
        status: import(".prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(tenantId: string, id: string, branchId?: string): Promise<{
        items: ({
            product: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: Prisma.Decimal;
            cost: Prisma.Decimal;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        supplierId: string;
        status: import(".prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreatePurchaseOrderDto): Promise<{
        items: ({
            product: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: Prisma.Decimal;
            cost: Prisma.Decimal;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        supplierId: string;
        status: import(".prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
