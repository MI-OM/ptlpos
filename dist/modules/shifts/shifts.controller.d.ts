import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';
import { ReconcileShiftDto } from './dto/reconcile-shift.dto';
import { EndOfDayReportQueryDto, EndOfShiftReportQueryDto, SalesPerformanceQueryDto } from './dto/report-query.dto';
import { ShiftsService } from './shifts.service';
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    openShift(user: AuthContext, dto: OpenShiftDto): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
        openedAt: Date;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        drawerType: import(".prisma/client").$Enums.DrawerType;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
    }>;
    closeShift(user: AuthContext, id: string, dto: CloseShiftDto): Promise<{
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
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        closingBalance: import("@prisma/client/runtime/library").Decimal;
        drawerType: import(".prisma/client").$Enums.DrawerType;
        cashSales: import("@prisma/client/runtime/library").Decimal;
        cardSales: import("@prisma/client/runtime/library").Decimal;
        transferSales: import("@prisma/client/runtime/library").Decimal;
        otherSales: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
        discrepancy: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
    }>;
    getActiveShift(user: AuthContext): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
        };
        branch: {
            name: string;
        };
        openedAt: Date;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        cashSales: import("@prisma/client/runtime/library").Decimal;
        cardSales: import("@prisma/client/runtime/library").Decimal;
        transferSales: import("@prisma/client/runtime/library").Decimal;
        otherSales: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.ShiftStatus;
        notes: string;
        salesCount: number;
    }>;
    findAll(user: AuthContext, query: QueryShiftsDto): Promise<{
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: AuthContext, id: string): Promise<{
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
    }>;
    getCashDrawerSummary(user: AuthContext): Promise<{
        shiftId: string;
        openedAt: Date;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        cashSales: import("@prisma/client/runtime/library").Decimal;
        cardSales: import("@prisma/client/runtime/library").Decimal;
        otherSales: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
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
    reconcileShift(user: AuthContext, id: string, dto: ReconcileShiftDto): Promise<{
        id: string;
        tenantId: string;
        shiftId: string;
        expectedCash: import("@prisma/client/runtime/library").Decimal;
        expectedCard: import("@prisma/client/runtime/library").Decimal;
        expectedTransfer: import("@prisma/client/runtime/library").Decimal;
        expectedMobile: import("@prisma/client/runtime/library").Decimal;
        expectedTotal: import("@prisma/client/runtime/library").Decimal;
        actualCash: import("@prisma/client/runtime/library").Decimal;
        actualCard: import("@prisma/client/runtime/library").Decimal;
        actualTransfer: import("@prisma/client/runtime/library").Decimal;
        actualMobile: import("@prisma/client/runtime/library").Decimal;
        actualTotal: import("@prisma/client/runtime/library").Decimal;
        cashDiscrepancy: import("@prisma/client/runtime/library").Decimal;
        cardDiscrepancy: import("@prisma/client/runtime/library").Decimal;
        transferDiscrepancy: import("@prisma/client/runtime/library").Decimal;
        mobileDiscrepancy: import("@prisma/client/runtime/library").Decimal;
        totalDiscrepancy: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        reconciledBy: string;
        reconciledAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getEndOfDayReport(user: AuthContext, query: EndOfDayReportQueryDto): Promise<{
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
    getEndOfShiftReport(user: AuthContext, query: EndOfShiftReportQueryDto): Promise<{
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
            expectedCash: import("@prisma/client/runtime/library").Decimal;
            expectedCard: import("@prisma/client/runtime/library").Decimal;
            expectedTransfer: import("@prisma/client/runtime/library").Decimal;
            expectedMobile: import("@prisma/client/runtime/library").Decimal;
            expectedTotal: import("@prisma/client/runtime/library").Decimal;
            actualCash: import("@prisma/client/runtime/library").Decimal;
            actualCard: import("@prisma/client/runtime/library").Decimal;
            actualTransfer: import("@prisma/client/runtime/library").Decimal;
            actualMobile: import("@prisma/client/runtime/library").Decimal;
            actualTotal: import("@prisma/client/runtime/library").Decimal;
            cashDiscrepancy: import("@prisma/client/runtime/library").Decimal;
            cardDiscrepancy: import("@prisma/client/runtime/library").Decimal;
            transferDiscrepancy: import("@prisma/client/runtime/library").Decimal;
            mobileDiscrepancy: import("@prisma/client/runtime/library").Decimal;
            totalDiscrepancy: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            reconciledBy: string;
            reconciledAt: Date;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getSalesPerformance(user: AuthContext, query: SalesPerformanceQueryDto): Promise<{
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
