import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(context: AuthContext, dto: CreatePaymentDto): Promise<{
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
    }>;
    reconciliation(tenantId: string, query: {
        from?: string;
        to?: string;
    }): Promise<{
        range: {
            from: string;
            to: string;
        };
        totals: {
            salesAmount: number;
            refundAmount: number;
            netAmount: number;
            salesCount: number;
            refundCount: number;
        };
        methods: {
            method: "CASH" | "TRANSFER" | "CARD" | "STORE_CREDIT";
            salesAmount: number;
            refundAmount: number;
            netAmount: number;
            salesCount: number;
            refundCount: number;
        }[];
    }>;
    cashDrawerSummary(tenantId: string, query: {
        from?: string;
        to?: string;
        countedCash?: number;
        branchId?: string;
    }): Promise<{
        range: {
            from: string;
            to: string;
        };
        branchId: string;
        currency: string;
        expectedCash: number;
        countedCash: number;
        variance: number;
        totals: {
            salesCash: number;
            refundCash: number;
            netCash: number;
            salesCount: number;
            refundCount: number;
        };
    }>;
    findByStatus(tenantId: string, status: PaymentStatus, limit?: number): Promise<({
        sale: {
            totalAmount: Prisma.Decimal;
            id: string;
            status: import(".prisma/client").$Enums.SaleStatus;
            saleNumber: string;
            customer: {
                id: string;
                name: string;
                email: string;
                phone: string;
            };
        };
    } & {
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
    })[]>;
    updateStatus(context: AuthContext, paymentId: string, newStatus: PaymentStatus): Promise<{
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
    }>;
}
