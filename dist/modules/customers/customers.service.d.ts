import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string): Prisma.PrismaPromise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        _count: {
            sales: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    history(tenantId: string, id: string, page?: number, limit?: number, from?: string, to?: string, minAmount?: number): Promise<{
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
                saleId: string;
                productId: string;
                productVariantId: string | null;
                quantity: Prisma.Decimal;
                price: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                discountAmount: Prisma.Decimal;
                taxAmount: Prisma.Decimal;
                lineTotal: Prisma.Decimal;
                createdAt: Date;
            })[];
            payments: {
                id: string;
                tenantId: string;
                saleId: string;
                method: import(".prisma/client").$Enums.PaymentMethod;
                direction: import(".prisma/client").$Enums.PaymentDirection;
                status: import(".prisma/client").$Enums.PaymentStatus;
                amount: Prisma.Decimal;
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
            taxRateOverride: Prisma.Decimal | null;
            subtotalAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            totalAmount: Prisma.Decimal;
            paidAmount: Prisma.Decimal;
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
    create(context: AuthContext, dto: CreateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        phone: string | null;
        email: string | null;
        creditBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
    }>;
    private ensureNoDuplicateCustomer;
    private normalizeEmail;
}
