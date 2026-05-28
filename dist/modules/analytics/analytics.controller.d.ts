import { AuthContext } from '../../core/types/request-context';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    dashboard(user: AuthContext, from?: string, to?: string): Promise<{
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
            revenue: number;
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
}
