import { AuthContext } from '../../core/types/request-context';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    reconciliation(user: AuthContext, from?: string, to?: string): Promise<{
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
            method: "TRANSFER" | "CASH" | "CARD" | "STORE_CREDIT";
            salesAmount: number;
            refundAmount: number;
            netAmount: number;
            salesCount: number;
            refundCount: number;
        }[];
    }>;
    cashDrawerSummary(user: AuthContext, from?: string, to?: string, countedCash?: string): Promise<{
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
    findByStatus(user: AuthContext, status: string, limit?: string): Promise<({
        sale: {
            customer: {
                id: string;
                name: string;
                email: string;
                phone: string;
            };
            id: string;
            status: import(".prisma/client").$Enums.SaleStatus;
            saleNumber: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
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
    })[]>;
    create(user: AuthContext, dto: CreatePaymentDto): Promise<{
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
    }>;
    updateStatus(user: AuthContext, id: string, newStatus: string): Promise<{
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
    }>;
}
