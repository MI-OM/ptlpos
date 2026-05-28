import { PrismaService } from '../../core/database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    dashboard(tenantId: string, query?: {
        from?: string;
        to?: string;
    }): Promise<{
        range: {
            from: string;
            to: string;
        };
        dailyRevenue: number | import("@prisma/client/runtime/library").Decimal;
        salesCount: number;
        profitEstimate: {
            revenue: number;
            estimatedCost: number;
            grossProfit: number;
            grossMargin: number;
        };
        topProducts: {
            productId: string;
            name: any;
            quantitySold: number | import("@prisma/client/runtime/library").Decimal;
        }[];
        topCustomers: {
            customerId: string;
            name: any;
            totalSpent: number | import("@prisma/client/runtime/library").Decimal;
            salesCount: number;
        }[];
        hourlySales: {
            hour: string;
            salesCount: number;
            revenue: number;
        }[];
    }>;
    private resolveRange;
    private buildHourlyBreakdown;
}
