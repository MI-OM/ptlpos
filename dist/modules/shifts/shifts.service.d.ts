import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';
import { ReconcileShiftDto } from './dto/reconcile-shift.dto';
export declare class ShiftsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    openShift(context: AuthContext, dto: OpenShiftDto): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
        openedAt: Date;
        openingBalance: Prisma.Decimal;
        drawerType: import(".prisma/client").$Enums.DrawerType;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
    }>;
    closeShift(context: AuthContext, shiftId: string, dto: CloseShiftDto): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
        openedAt: Date;
        closedAt: Date;
        openingBalance: Prisma.Decimal;
        closingBalance: Prisma.Decimal;
        drawerType: import(".prisma/client").$Enums.DrawerType;
        cashSales: Prisma.Decimal;
        cardSales: Prisma.Decimal;
        transferSales: Prisma.Decimal;
        otherSales: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        discrepancy: Prisma.Decimal;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
    }>;
    getActiveShift(context: AuthContext): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
        openedAt: Date;
        openingBalance: Prisma.Decimal;
        cashSales: Prisma.Decimal;
        cardSales: Prisma.Decimal;
        transferSales: Prisma.Decimal;
        otherSales: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
        salesCount: number;
    }>;
    findAll(context: AuthContext, query: QueryShiftsDto): Promise<{
        data: ({
            branch: {
                name: string;
            };
            user: {
                name: string;
                email: string;
            };
        } & {
            id: string;
            tenantId: string;
            branchId: string | null;
            userId: string;
            openedAt: Date;
            closedAt: Date | null;
            openingBalance: Prisma.Decimal;
            closingBalance: Prisma.Decimal | null;
            cashSales: Prisma.Decimal;
            cardSales: Prisma.Decimal;
            otherSales: Prisma.Decimal;
            status: import(".prisma/client").$Enums.ShiftStatus;
            drawerType: import(".prisma/client").$Enums.DrawerType;
            onlineDrawerBalance: Prisma.Decimal | null;
            offlineDrawerBalance: Prisma.Decimal | null;
            actualCashCount: Prisma.Decimal | null;
            discrepancy: Prisma.Decimal | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(context: AuthContext, shiftId: string): Promise<{
        branch: {
            name: string;
        };
        user: {
            name: string;
            email: string;
        };
        sales: ({
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
    } & {
        id: string;
        tenantId: string;
        branchId: string | null;
        userId: string;
        openedAt: Date;
        closedAt: Date | null;
        openingBalance: Prisma.Decimal;
        closingBalance: Prisma.Decimal | null;
        cashSales: Prisma.Decimal;
        cardSales: Prisma.Decimal;
        otherSales: Prisma.Decimal;
        status: import(".prisma/client").$Enums.ShiftStatus;
        drawerType: import(".prisma/client").$Enums.DrawerType;
        onlineDrawerBalance: Prisma.Decimal | null;
        offlineDrawerBalance: Prisma.Decimal | null;
        actualCashCount: Prisma.Decimal | null;
        discrepancy: Prisma.Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCashDrawerSummary(context: AuthContext): Promise<{
        shiftId: string;
        openedAt: Date;
        openingBalance: Prisma.Decimal;
        cashSales: Prisma.Decimal;
        cardSales: Prisma.Decimal;
        otherSales: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        salesCount: number;
        status: import(".prisma/client").$Enums.ShiftStatus;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
    }>;
    reconcileShift(context: AuthContext, shiftId: string, dto: ReconcileShiftDto): Promise<{
        id: string;
        tenantId: string;
        shiftId: string;
        expectedCash: Prisma.Decimal;
        expectedCard: Prisma.Decimal;
        expectedTransfer: Prisma.Decimal;
        expectedMobile: Prisma.Decimal;
        expectedTotal: Prisma.Decimal;
        actualCash: Prisma.Decimal;
        actualCard: Prisma.Decimal;
        actualTransfer: Prisma.Decimal;
        actualMobile: Prisma.Decimal;
        actualTotal: Prisma.Decimal;
        cashDiscrepancy: Prisma.Decimal;
        cardDiscrepancy: Prisma.Decimal;
        transferDiscrepancy: Prisma.Decimal;
        mobileDiscrepancy: Prisma.Decimal;
        totalDiscrepancy: Prisma.Decimal;
        notes: string | null;
        reconciledBy: string;
        reconciledAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getEndOfDayReport(context: AuthContext, date?: string, branchId?: string): Promise<{
        date: string;
        branchId: string;
        shifts: {
            shiftId: string;
            userId: string;
            userName: string;
            branchId: string;
            branchName: string;
            openTime: Date;
            closeTime: Date;
            sales: {
                totalSales: number;
                totalRevenue: number;
                totalRefunds: number;
                totalRefundAmount: number;
            };
            payments: {
                cash: number;
                card: number;
                transfer: number;
                mobile: number;
                storeCredit: number;
            };
            drawer: {
                openingBalance: number;
                expectedCash: number;
                actualCash: number;
                discrepancy: number;
            };
        }[];
        totals: {
            totalSales: number;
            totalRevenue: number;
            totalCash: number;
            totalCard: number;
            totalTransfer: number;
            totalMobile: number;
            totalDiscrepancy: number;
        };
    }>;
    getEndOfShiftReport(context: AuthContext, shiftId: string): Promise<{
        shiftId: string;
        userId: string;
        userName: string;
        branchId: string;
        branchName: string;
        openTime: Date;
        closeTime: Date;
        sales: {
            totalSales: number;
            totalRevenue: number;
            totalRefunds: number;
            totalRefundAmount: number;
        };
        payments: {
            cash: number;
            card: number;
            transfer: number;
            mobile: number;
            storeCredit: number;
        };
        drawer: {
            openingBalance: number;
            expectedCash: number;
            actualCash: number;
            discrepancy: number;
        };
        reconciliation: {
            id: string;
            tenantId: string;
            shiftId: string;
            expectedCash: Prisma.Decimal;
            expectedCard: Prisma.Decimal;
            expectedTransfer: Prisma.Decimal;
            expectedMobile: Prisma.Decimal;
            expectedTotal: Prisma.Decimal;
            actualCash: Prisma.Decimal;
            actualCard: Prisma.Decimal;
            actualTransfer: Prisma.Decimal;
            actualMobile: Prisma.Decimal;
            actualTotal: Prisma.Decimal;
            cashDiscrepancy: Prisma.Decimal;
            cardDiscrepancy: Prisma.Decimal;
            transferDiscrepancy: Prisma.Decimal;
            mobileDiscrepancy: Prisma.Decimal;
            totalDiscrepancy: Prisma.Decimal;
            notes: string | null;
            reconciledBy: string;
            reconciledAt: Date;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getSalesPerformance(context: AuthContext, userId?: string, fromDate?: string, toDate?: string, branchId?: string): Promise<{
        period: {
            from: string;
            to: string;
        };
        users: any[];
        totals: {
            totalSales: number;
            totalRevenue: number;
        };
    }>;
}
