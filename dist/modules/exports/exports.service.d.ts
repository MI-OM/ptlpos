import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
export declare class ExportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    exportProducts(context: AuthContext): Promise<{
        success: boolean;
        count: number;
        data: {
            type: import(".prisma/client").$Enums.ProductType;
            name: string;
            id: string;
            sku: string;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
        }[];
        exportedAt: string;
    }>;
    exportCustomers(context: AuthContext): Promise<{
        success: boolean;
        count: number;
        data: {
            name: string;
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
        }[];
        exportedAt: string;
    }>;
    exportSuppliers(context: AuthContext): Promise<{
        success: boolean;
        count: number;
        data: {
            name: string;
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
        }[];
        exportedAt: string;
    }>;
    exportSales(context: AuthContext, from?: string, to?: string, branchId?: string): Promise<{
        success: boolean;
        count: number;
        data: ({
            shift: {
                user: {
                    name: string;
                };
            } & {
                id: string;
                tenantId: string;
                branchId: string | null;
                userId: string;
                openedAt: Date;
                closedAt: Date | null;
                openingBalance: import("@prisma/client/runtime/library").Decimal;
                closingBalance: import("@prisma/client/runtime/library").Decimal | null;
                cashSales: import("@prisma/client/runtime/library").Decimal;
                cardSales: import("@prisma/client/runtime/library").Decimal;
                otherSales: import("@prisma/client/runtime/library").Decimal;
                status: import(".prisma/client").$Enums.ShiftStatus;
                drawerType: import(".prisma/client").$Enums.DrawerType;
                onlineDrawerBalance: import("@prisma/client/runtime/library").Decimal | null;
                offlineDrawerBalance: import("@prisma/client/runtime/library").Decimal | null;
                actualCashCount: import("@prisma/client/runtime/library").Decimal | null;
                discrepancy: import("@prisma/client/runtime/library").Decimal | null;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            payments: {
                id: string;
                tenantId: string;
                saleId: string;
                method: import(".prisma/client").$Enums.PaymentMethod;
                direction: import(".prisma/client").$Enums.PaymentDirection;
                status: import(".prisma/client").$Enums.PaymentStatus;
                amount: import("@prisma/client/runtime/library").Decimal;
                reference: string | null;
                externalRef: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            customer: {
                name: string;
                email: string;
            };
            items: ({
                product: {
                    name: string;
                    sku: string;
                };
            } & {
                id: string;
                saleId: string;
                productId: string;
                productVariantId: string | null;
                quantity: import("@prisma/client/runtime/library").Decimal;
                price: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                taxAmount: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
            })[];
        } & {
            id: string;
            tenantId: string;
            branchId: string | null;
            customerId: string | null;
            shiftId: string | null;
            saleNumber: string;
            status: import(".prisma/client").$Enums.SaleStatus;
            taxRateOverride: import("@prisma/client/runtime/library").Decimal | null;
            subtotalAmount: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
            heldAt: Date | null;
            completedAt: Date | null;
            cancelledAt: Date | null;
            refundedAt: Date | null;
        })[];
        exportedAt: string;
    }>;
    exportInventory(context: AuthContext, branchId?: string): Promise<{
        success: boolean;
        count: number;
        data: ({
            product: {
                name: string;
                sku: string;
            };
        } & {
            id: string;
            tenantId: string;
            branchId: string | null;
            productId: string;
            productVariantId: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        })[];
        exportedAt: string;
    }>;
}
