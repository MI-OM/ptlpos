import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
export declare class OrdersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string, query: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        data: ({
            customer: {
                id: string;
                tenantId: string;
                name: string;
                phone: string | null;
                email: string | null;
                creditBalance: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            items: ({
                product: {
                    id: string;
                    name: string;
                    sku: string;
                };
            } & {
                id: string;
                orderId: string;
                productId: string;
                quantity: number;
                unitPrice: Prisma.Decimal;
                fulfilledQuantity: number;
                total: Prisma.Decimal;
            })[];
        } & {
            id: string;
            tenantId: string;
            branchId: string | null;
            customerId: string | null;
            orderNumber: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            subtotal: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            total: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            fulfilledQuantity: number;
            total: Prisma.Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        customerId: string | null;
        orderNumber: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateOrderDto): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            fulfilledQuantity: number;
            total: Prisma.Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        customerId: string | null;
        orderNumber: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(tenantId: string, id: string, dto: UpdateOrderDto): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            fulfilledQuantity: number;
            total: Prisma.Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        customerId: string | null;
        orderNumber: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancel(tenantId: string, id: string): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            fulfilledQuantity: number;
            total: Prisma.Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        customerId: string | null;
        orderNumber: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    fulfill(tenantId: string, id: string): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            fulfilledQuantity: number;
            total: Prisma.Decimal;
        })[];
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        customerId: string | null;
        orderNumber: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private generateOrderNumber;
}
