import { Prisma, StocktakeStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/database/redis.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateStocktakeDto, RecordStocktakeCountsDto } from './dto/stocktake.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
export declare class InventoryService {
    private readonly prisma;
    private readonly redis;
    private readonly audit;
    constructor(prisma: PrismaService, redis: RedisService, audit: AuditService);
    findAll(tenantId: string, branchId?: string): Promise<unknown>;
    lowStock(tenantId: string, threshold?: number, branchId?: string): Promise<{
        product: {
            type: import(".prisma/client").$Enums.ProductType;
            id: string;
            name: string;
            sku: string;
            price: Prisma.Decimal;
        };
        productVariant: {
            id: string;
            name: string;
            sku: string;
        };
        tenantId: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: Prisma.Decimal;
        productVariantId: string;
    }[]>;
    history(tenantId: string, productId?: string, branchId?: string): Promise<({
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
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: Prisma.Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        productId: string;
        productVariantId: string | null;
        type: import(".prisma/client").$Enums.InventoryTransactionType;
        quantity: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        referenceType: string;
        referenceId: string;
        note: string | null;
        createdAt: Date;
    })[]>;
    valuation(tenantId: string, branchId?: string): Promise<{
        branchId: string;
        valuationMethod: string;
        totals: {
            quantity: number;
            stockValue: number;
            itemCount: number;
        };
        items: {
            inventoryId: string;
            productId: string;
            productVariantId: string;
            productName: string;
            variantName: string;
            sku: string;
            quantity: number;
            unitCost: number;
            stockValue: number;
        }[];
    }>;
    transfer(context: AuthContext, dto: TransferInventoryDto): Promise<{
        transferReference: string;
        sourceBranchId: string;
        targetBranchId: string;
        itemCount: number;
        items: {
            productId: string;
            productVariantId: string;
            quantity: Prisma.Decimal;
        }[];
    }>;
    adjust(context: AuthContext, dto: AdjustInventoryDto): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        productId: string;
        productVariantId: string | null;
        quantity: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAlerts(tenantId: string, resolved?: boolean): Promise<({
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
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: Prisma.Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: Prisma.Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    checkAndCreateAlerts(tenantId: string, threshold?: number): Promise<({
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
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: Prisma.Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: Prisma.Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    resolveAlert(tenantId: string, alertId: string): Promise<{
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: Prisma.Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createStocktake(context: AuthContext, dto: CreateStocktakeDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    startStocktake(context: AuthContext, stocktakeId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    cancelStocktake(context: AuthContext, stocktakeId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    recordStocktakeCounts(context: AuthContext, stocktakeId: string, dto: RecordStocktakeCountsDto): Promise<({
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
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: Prisma.Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        stocktakeId: string;
        productId: string;
        productVariantId: string | null;
        systemCount: Prisma.Decimal;
        physicalCount: Prisma.Decimal;
        variance: Prisma.Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    completeStocktake(context: AuthContext, stocktakeId: string): Promise<{
        lineItems: {
            id: string;
            stocktakeId: string;
            productId: string;
            productVariantId: string | null;
            systemCount: Prisma.Decimal;
            physicalCount: Prisma.Decimal;
            variance: Prisma.Decimal;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    getStocktake(tenantId: string, stocktakeId: string): Promise<{
        lineItems: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
            productVariant: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            stocktakeId: string;
            productId: string;
            productVariantId: string | null;
            systemCount: Prisma.Decimal;
            physicalCount: Prisma.Decimal;
            variance: Prisma.Decimal;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    listStocktakes(tenantId: string, status?: StocktakeStatus): Promise<({
        _count: {
            lineItems: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    applyStocktakeAdjustments(context: AuthContext, stocktakeId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        status: import(".prisma/client").$Enums.StocktakeStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
}
