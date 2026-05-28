import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(context: AuthContext): Promise<{
        customers: number;
        products: number;
        sales: {
            total: number;
            today: number;
        };
        revenue: {
            total: number;
            today: number;
        };
        activeShifts: number;
        lowStockAlerts: number;
    }>;
}
