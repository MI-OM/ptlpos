import { AuthContext } from '../../core/types/request-context';
import { CreditService } from './credit.service';
export declare class CreditController {
    private readonly creditService;
    constructor(creditService: CreditService);
    addCredit(user: AuthContext, id: string, body: {
        amount: number;
        note?: string;
    }): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    deductCredit(user: AuthContext, id: string, body: {
        amount: number;
        referenceType?: string;
        referenceId?: string;
        note?: string;
    }): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    adjustCredit(user: AuthContext, id: string, body: {
        amount: number;
        note?: string;
    }): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getCreditBalance(user: AuthContext, id: string): Promise<{
        id: string;
        name: string;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    getCreditTransactions(user: AuthContext, id: string): Promise<{
        customer: {
            id: string;
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            creditBalance: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        transactions: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        }[];
    }>;
}
