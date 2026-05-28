import { AuthContext } from '../../core/types/request-context';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    receive(user: AuthContext, dto: ReceivePurchaseDto): Promise<{
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
