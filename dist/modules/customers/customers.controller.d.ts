import { AuthContext } from '../../core/types/request-context';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(user: AuthContext): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthContext, id: string): Promise<{
        _count: {
            sales: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    history(user: AuthContext, id: string, page?: string, limit?: string, from?: string, to?: string, minAmount?: string): Promise<{
        data: ({
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
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    create(user: AuthContext, dto: CreateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthContext, id: string): Promise<{
        id: string;
    }>;
}
