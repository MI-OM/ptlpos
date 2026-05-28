import { AuthContext } from '../../core/types/request-context';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';
export declare class PurchaseOrdersController {
    private readonly purchaseOrdersService;
    constructor(purchaseOrdersService: PurchaseOrdersService);
    findAll(user: AuthContext): import(".prisma/client").Prisma.PrismaPromise<({
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        supplierId: string;
        status: import(".prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(user: AuthContext, id: string): Promise<{
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        supplierId: string;
        status: import(".prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthContext, dto: CreatePurchaseOrderDto): Promise<{
        supplier: {
            id: string;
            tenantId: string;
            name: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
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
