import { AuthContext } from '../../core/types/request-context';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateStocktakeDto, RecordStocktakeCountsDto } from './dto/stocktake.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(user: AuthContext): Promise<unknown>;
    lowStock(user: AuthContext, threshold?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        product: {
            id: string;
            name: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sku: string;
            type: import(".prisma/client").$Enums.ProductType;
        };
        productId: string;
        productVariantId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        productVariant: {
            id: string;
            name: string;
            sku: string;
        };
    }[]>;
    getAlerts(user: AuthContext, resolved?: string): Promise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    checkAlerts(user: AuthContext, threshold?: string): Promise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    resolveAlert(user: AuthContext, alertId: string): Promise<{
        id: string;
        tenantId: string;
        productId: string;
        productVariantId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        isResolved: boolean;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    history(user: AuthContext, productId?: string): Promise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
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
        quantity: import("@prisma/client/runtime/library").Decimal;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
        referenceType: string;
        referenceId: string;
        note: string | null;
        createdAt: Date;
    })[]>;
    valuation(user: AuthContext): Promise<{
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
    adjust(user: AuthContext, dto: AdjustInventoryDto): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        productId: string;
        productVariantId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    transfer(user: AuthContext, dto: TransferInventoryDto): Promise<{
        transferReference: string;
        sourceBranchId: string;
        targetBranchId: string;
        itemCount: number;
        items: {
            productId: string;
            productVariantId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    createStocktake(user: AuthContext, dto: CreateStocktakeDto): Promise<{
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
    listStocktakes(user: AuthContext, status?: string): Promise<({
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
    getStocktake(user: AuthContext, id: string): Promise<{
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
            systemCount: import("@prisma/client/runtime/library").Decimal;
            physicalCount: import("@prisma/client/runtime/library").Decimal;
            variance: import("@prisma/client/runtime/library").Decimal;
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
    startStocktake(user: AuthContext, id: string): Promise<{
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
    cancelStocktake(user: AuthContext, id: string): Promise<{
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
    recordCounts(user: AuthContext, id: string, dto: RecordStocktakeCountsDto): Promise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        productVariant: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        stocktakeId: string;
        productId: string;
        productVariantId: string | null;
        systemCount: import("@prisma/client/runtime/library").Decimal;
        physicalCount: import("@prisma/client/runtime/library").Decimal;
        variance: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    completeStocktake(user: AuthContext, id: string): Promise<{
        lineItems: {
            id: string;
            stocktakeId: string;
            productId: string;
            productVariantId: string | null;
            systemCount: import("@prisma/client/runtime/library").Decimal;
            physicalCount: import("@prisma/client/runtime/library").Decimal;
            variance: import("@prisma/client/runtime/library").Decimal;
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
    applyAdjustments(user: AuthContext, id: string): Promise<{
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
