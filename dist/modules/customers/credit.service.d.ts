import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
export declare class CreditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addCredit(context: AuthContext, customerId: string, amount: number, note?: string): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: Prisma.Decimal;
    }>;
    deductCredit(context: AuthContext, customerId: string, amount: number, referenceType?: string, referenceId?: string, note?: string): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: Prisma.Decimal;
    }>;
    getCreditBalance(context: AuthContext, customerId: string): Promise<{
        id: string;
        name: string;
        creditBalance: Prisma.Decimal;
    }>;
    getCreditTransactions(context: AuthContext, customerId: string): Promise<{
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
        transactions: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        }[];
    }>;
    adjustCredit(context: AuthContext, customerId: string, amount: number, note?: string): Promise<{
        transaction: {
            id: string;
            tenantId: string;
            customerId: string;
            amount: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            type: import(".prisma/client").$Enums.CreditTransactionType;
            referenceType: string | null;
            referenceId: string | null;
            note: string | null;
            createdAt: Date;
        };
        newBalance: Prisma.Decimal;
    }>;
}
